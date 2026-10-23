#!/usr/bin/env node
/**
 * Builds the collections (`content/collections/*.md`) into what the
 * /collections routes render: every collection as HTML in
 * `src/app/collections/_collections/collections.json`, and every photo as a
 * small WebP file in `public/collections/images/`.
 *
 * The collections are public, just unlisted. The markdown is committed, and
 * this runs before every `next dev` and `next build` through the `predev` and
 * `prebuild` npm hooks, so both outputs are generated and gitignored.
 *
 * Markdown is rendered to HTML here rather than in the browser so no markdown
 * parser ships to visitors; `marked` stays a devDependency.
 *
 * Usage:
 *   npm run collections
 */
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import sharp from "sharp";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_DIR = path.join(projectRoot, "content/collections");
const OUT_FILE = path.join(projectRoot, "src/app/collections/_collections/collections.json");
// `public/` is served from the site root, so IMAGE_DIR is reachable at IMAGE_URL.
const IMAGE_DIR = path.join(projectRoot, "public/collections/images");
const IMAGE_URL = "/collections/images";

// Every local image is encoded as the same IMAGE_SIDE WebP square, at the
// highest quality up to IMAGE_QUALITY that keeps it under IMAGE_MAX_BYTES, so
// a busy photo gives up detail rather than weight. 320px is about the widest a
// gallery tile gets, and the largest side at which the busiest photos still
// fit the cap at a usable quality.
const IMAGE_SIDE = 320;
const IMAGE_QUALITY = 78;
const IMAGE_MAX_BYTES = 5000;
// Product shots are usually transparent PNG or WebP cutouts. Left unflattened
// they inherit whatever the page theme is painting behind them, so a page of
// them looks inconsistent. Compositing onto white first makes every collection
// read like one catalogue. This is a no-op for images with no alpha channel.
const IMAGE_BACKGROUND = "#ffffff";

// A list item whose body holds a bullet list made entirely of `Label: value`
// lines renders as a card instead of a list row. Ticked and unticked cards get
// a status chip; an item with no checkbox is a maybe and has none. A list of
// maybes renders as compact rows of photo, name, reference and price; any
// other card list renders as a gallery of photo tiles. Either way the fields
// stay hidden, and each card's open button shows the whole card in a dialog
// (`openCard` in src/app/collections/_collections/components/collection-view.tsx),
// unless the page asks for its details inline (`CARD_SETTINGS`). A plain
// checklist has no such list and renders as an ordinary checklist.
const CARD_FIELD = /^([A-Z][A-Za-z ]{0,19}):\s/;
const CARD_OPEN_LABEL = "Details";
// Card settings, which a page can override in its frontmatter. `ticked` and
// `unticked` are the status chips. `ranked`, when set, numbers the cards of an
// unticked list in markdown order and is the tooltip on those numbers.
// `details: inline` shows a card's fields on the card itself, with no open
// button or dialog, for pages with only a few short lines per card.
const CARD_SETTINGS = { ticked: "Owned", unticked: "To buy", ranked: "", details: "dialog" };
const INLINE_DETAILS = "inline";
// The leading figure of this field is repeated in the card header, so prices
// can be compared without reading each field grid.
const CARD_PRICE_FIELD = "Cost";
const CARD_PRICE_PREFIX = "₹";
// A list of unticked cards gets these sort buttons, and each card its place in
// the markdown for "My order". `sortCards` in
// src/app/collections/_collections/components/collection-view.tsx does the
// sorting off these keys.
const CARD_SORTS = [
  { key: "order", label: "My order" },
  { key: "price-asc", label: "Price ↑", title: "Price, low to high" },
  { key: "price-desc", label: "Price ↓", title: "Price, high to low" },
];
// A page with `layout: story` in its frontmatter opens with an overview: a
// row per chapter (h2) that holds cards, with its count and a thumbnail per
// card that scrolls down to it and opens it in the card dialog.
// collections.css numbers the chapters.
const STORY_LAYOUT = "story";
// Overview thumbnails are 3rem tiles, so they get their own small encode
// rather than loading each full-size photo. The suffix marks an image source
// as a thumbnail and never reaches the browser.
const THUMB_SUFFIX = "#thumb";
const THUMB_SIDE = 160;
// Each collection's tile on the /collections index shows its first few photos
// and a count per chapter. The tiles use the full-size photos the cards already
// load, so they cost no extra encodes and share the browser cache.
const PREVIEW_PHOTOS = 5;

/**
 * Minimal YAML-ish frontmatter parser. The collections only ever need flat
 * `key: value` lines, so a real YAML dependency would be dead weight.
 */
function parseFrontmatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!match) return { meta: {}, body: raw };

  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const sep = line.indexOf(":");
    if (sep === -1) continue;
    const key = line.slice(0, sep).trim();
    let value = line.slice(sep + 1).trim();
    // Strip one layer of matching quotes.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    meta[key] = value;
  }
  return { meta, body: raw.slice(match[0].length) };
}

function isFieldList(token) {
  return (
    token.type === "list" &&
    !token.ordered &&
    token.items.every((item) => !item.task && CARD_FIELD.test(item.text))
  );
}

function isCard(item) {
  return item.tokens.some(isFieldList);
}

function isCardList(token) {
  return token.type === "list" && token.items.length > 0 && token.items.every(isCard);
}

function cardStatus(item) {
  return !item.task ? "maybe" : item.checked ? "done" : "open";
}

/** A list of unticked cards gets sort buttons. */
function isSortable(list) {
  return list.items.length > 1 && list.items.every((item) => cardStatus(item) === "open");
}

/** Inline tokens of a card's first line, minus the checkbox. */
function cardTitle(item) {
  return (inlineOf(item.tokens[0]) ?? []).filter((t) => t.type !== "checkbox");
}

/** The bold part of the first line, or the whole line if nothing is bold. */
function cardNameText(item) {
  const title = cardTitle(item);
  return title.find((t) => t.type === "strong")?.text ?? title.map((t) => t.raw).join("");
}

/**
 * The name as plain text for attributes. parseInline escapes quotes too, so
 * the result is safe inside one.
 */
function cardLabel(item) {
  return marked.parseInline(cardNameText(item)).replace(/<[^>]*>/g, "");
}

/**
 * Stamps each card list with the page's card settings and each card with an
 * id, so a story overview thumbnail can point at it. Ids come from the name,
 * with a number added when the page already has a card by that name, so they
 * are worked out once here rather than separately by the renderer and overview.
 */
function prepareCards(tokens, meta) {
  const settings = Object.fromEntries(
    Object.entries(CARD_SETTINGS).map(([key, fallback]) => [key, meta[key] ?? fallback])
  );
  const seen = new Map();
  marked.walkTokens(tokens, (token) => {
    if (!isCardList(token)) return;
    token.settings = settings;
    for (const item of token.items) {
      const slug = cardNameText(item).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const count = (seen.get(slug) ?? 0) + 1;
      seen.set(slug, count);
      item.cardId = `card-${slug}${count > 1 ? `-${count}` : ""}`;
    }
  });
}

/** The image token of a paragraph that holds nothing else, if it is one. */
function loneImage(token) {
  const visible = inlineOf(token)?.filter((t) => t.type !== "text" || t.text.trim());
  return visible?.length === 1 && visible[0].type === "image" ? visible[0] : null;
}

/** The leading figure of a `Cost: ...` field, digits and commas only. */
function priceOf(field) {
  return /^[^:]+:\s*([\d,]+)/.exec(field.text)?.[1] ?? "";
}

/**
 * The chapters (h2) of a page that hold cards, each with its cards in order.
 * The story overview and the index tile both read these, from the same tokens
 * the cards are rendered from, so their counts always agree with the page.
 */
function chaptersOf(tokens) {
  const chapters = [];
  for (const token of tokens) {
    if (token.type === "heading" && token.depth === 2) {
      chapters.push({ name: marked.parseInline(token.text), cards: [] });
    } else if (chapters.length > 0 && isCardList(token)) {
      const ranked = isSortable(token) && token.settings.ranked;
      const dialog = token.settings.details !== INLINE_DETAILS;
      chapters.at(-1).cards.push(
        ...token.items.map((item, i) => ({ item, rank: ranked ? i + 1 : 0, dialog }))
      );
    }
  }
  return chapters.filter(({ cards }) => cards.length > 0);
}

/** A card's photo: the first paragraph after its name that holds only an image. */
function cardImage(item) {
  return item.tokens.slice(1).map(loneImage).find(Boolean);
}

/** The overview a story page opens with. */
function storyRoll(tokens) {
  const rows = chaptersOf(tokens)
    .map(({ name, cards }) => {
      const thumbs = cards.map(({ item, rank, dialog }) => {
        const image = cardImage(item);
        const label = cardLabel(item);
        // With no photo, the thumbnail is the name's first letter, and the
        // link takes the name the photo's alt text would have given it.
        const initial = /[a-z0-9]/i.exec(cardNameText(item))?.[0].toUpperCase() ?? "";
        const named = image ? "" : ` aria-label="${label}"`;
        return [
          `<li><a href="#${item.cardId}" title="${label}"${dialog ? ` aria-haspopup="dialog"` : ""}${named}>`,
          rank ? `<span class="roll-rank">${rank}</span>` : "",
          image
            ? `<img src="${image.href}${THUMB_SUFFIX}" alt="${label}">`
            : `<span class="roll-initial" aria-hidden="true">${initial}</span>`,
          `</a></li>`,
        ].join("");
      });
      return [
        `<div class="roll-row" data-status="${cardStatus(cards[0].item)}">`,
        `<p class="roll-name">${name}<span class="roll-count">${cards.length}</span></p>`,
        `<ul class="roll-items">${thumbs.join("")}</ul>`,
        `</div>\n`,
      ].join("");
    });

  return rows.length > 0 ? `<nav class="roll" aria-label="Overview">\n${rows.join("")}</nav>\n` : "";
}

/**
 * A collection's tile on the /collections index: its first few photos, then a
 * count per chapter with the same status dot as the overview. The tile is one
 * link named by its text, so the photos are decorative.
 */
function previewOf(tokens) {
  const chapters = chaptersOf(tokens);
  const photos = chapters
    .flatMap(({ cards }) => cards.map(({ item }) => cardImage(item)))
    .filter(Boolean)
    .slice(0, PREVIEW_PHOTOS)
    .map((image) => `<li><img src="${image.href}" alt=""></li>`);
  const counts = chapters.map(
    ({ name, cards }) =>
      `<li data-status="${cardStatus(cards[0].item)}">${name}<span class="preview-count">${cards.length}</span></li>`
  );
  return [
    photos.length ? `<ul class="preview-photos" aria-hidden="true">${photos.join("")}</ul>` : "",
    counts.length ? `<ul class="preview-chapters">${counts.join("")}</ul>` : "",
  ].join("");
}

function sortButtons() {
  const buttons = CARD_SORTS.map(({ key, label, title }, i) => {
    const named = title ? ` title="${title}" aria-label="${title}"` : "";
    return `<button type="button" data-sort="${key}" aria-pressed="${i === 0}"${named}>${label}</button>`;
  });
  return `<div class="card-sort" role="group" aria-label="Sort"><span class="card-sort-label" aria-hidden="true">Sort</span>${buttons.join("")}</div>\n`;
}

/** Inline children of a paragraph, or of a tight list item's text token. */
function inlineOf(token) {
  return (token.type === "paragraph" || token.type === "text") && token.tokens
    ? token.tokens
    : null;
}

/**
 * marked renderer overrides that turn buy-list items into cards. The bold
 * text on the item's first line is the name and whatever follows it is the
 * reference, a paragraph holding only an image is the photo, and the
 * `Label: value` list becomes a definition list. Returning false hands a token
 * back to marked's default renderer.
 */
const cardRenderer = {
  list(token) {
    if (!isCardList(token)) return false;
    const settings = token.settings ?? CARD_SETTINGS;
    const compact = token.items.every((item) => cardStatus(item) === "maybe");
    const sortable = isSortable(token);
    const cards = token.items
      .map((item, i) => this.listitem(item, sortable ? i + 1 : 0, settings))
      .join("");
    const inline = settings.details === INLINE_DETAILS ? ` data-details="${INLINE_DETAILS}"` : "";
    const list = `<ul class="cards ${compact ? "compact" : "gallery"}"${inline}>\n${cards}</ul>\n`;
    return sortable ? sortButtons() + list : list;
  },

  /**
   * `rank` is the card's place in a sortable list, or 0 outside one; it shows
   * as a badge only when `settings.ranked` is set.
   */
  listitem(item, rank = 0, settings = CARD_SETTINGS) {
    if (!isCard(item)) return false;

    const rest = item.tokens.slice(1);
    const title = cardTitle(item);
    const nameAt = title.findIndex((t) => t.type === "strong");
    const name = this.parser.parseInline(nameAt === -1 ? title : title[nameAt].tokens);
    const ref = nameAt === -1
      ? ""
      : this.parser
          .parseInline(title.filter((_, i) => i !== nameAt))
          .trim()
          .replace(/^\(([\s\S]*)\)$/, "$1");

    let media = "";
    let extra = "";
    const fields = [];
    for (const token of rest) {
      const image = media ? null : loneImage(token);
      if (image) {
        media = `<figure class="card-media">${this.parser.parseInline([image])}</figure>`;
      } else if (isFieldList(token)) {
        fields.push(...token.items);
      } else if (token.type !== "space") {
        extra += this.parser.parse([token]);
      }
    }

    const status = cardStatus(item);

    let price = "";
    const rows = [];
    for (const field of fields) {
      const label = CARD_FIELD.exec(field.text)[1];
      if (label === CARD_PRICE_FIELD) price = priceOf(field);
      const value = this.parser
        .parse(field.tokens)
        .trim()
        .replace(/^<p>([\s\S]*)<\/p>$/, "$1")
        .replace(new RegExp(`^${label}:\\s*`), "");
      const key = label.toLowerCase().replace(/ +/g, "-");
      rows.push(`<div data-field="${key}"><dt>${label}</dt><dd>${value}</dd></div>`);
    }
    const fieldList = rows.length ? `<dl class="card-fields">${rows.join("")}</dl>` : "";
    const opener = (extra || fieldList) && settings.details !== INLINE_DETAILS
      ? `<button type="button" class="card-open" aria-haspopup="dialog" aria-label="${CARD_OPEN_LABEL}, ${cardLabel(item)}">${CARD_OPEN_LABEL}</button>`
      : "";

    const sortKeys = rank ? ` data-order="${rank}" data-price="${price.replace(/,/g, "")}"` : "";
    const rankBadge = rank && settings.ranked
      ? `<span class="card-rank" title="${settings.ranked}">${rank}</span>`
      : "";
    const chip = status === "done" ? settings.ticked : status === "open" ? settings.unticked : "";
    return [
      `<li class="card" id="${item.cardId}" data-status="${status}"${sortKeys}>`,
      media,
      `<header class="card-head">`,
      `<div class="card-title"><h3 class="card-name">${rankBadge}${name}</h3>`,
      ref ? `<p class="card-ref">${ref}</p>` : "",
      `</div><div class="card-meta">`,
      price ? `<p class="card-price">${CARD_PRICE_PREFIX}${price}</p>` : "",
      chip ? `<span class="card-status">${chip}</span>` : "",
      `</div></header>`,
      extra || fieldList ? `<div class="card-body">${extra}${fieldList}</div>` : "",
      opener,
      `</li>\n`,
    ].join("");
  },
};

marked.use({ renderer: cardRenderer });

/**
 * WebP-encodes raw pixels at the highest quality, up to IMAGE_QUALITY, that
 * comes in under `maxBytes`. Size grows with quality, so a binary search finds
 * it in a handful of encodes. `effort: 6` is the slowest and tightest encoder
 * setting, which buys quality back under the cap. Returns a null `encoded`
 * when even the lowest quality is too big.
 */
async function encodeWithin(data, info, maxBytes) {
  const raw = { width: info.width, height: info.height, channels: info.channels };
  let low = 1;
  let high = IMAGE_QUALITY;
  let best = { encoded: null, quality: 0 };
  while (low <= high) {
    const quality = Math.floor((low + high) / 2);
    const encoded = await sharp(data, { raw })
      .webp({ quality, effort: 6, smartSubsample: true })
      .toBuffer();
    if (encoded.length < maxBytes) {
      best = { encoded, quality };
      low = quality + 1;
    } else {
      high = quality - 1;
    }
  }
  return best;
}

/**
 * Encodes every local `<img src>` into a WebP file in IMAGE_DIR and points the
 * tag at it. Files are named after the source plus a hash of the encoded bytes,
 * so a changed photo gets a new URL rather than a stale cached copy. Remote and
 * data URI sources are left alone. `written` is shared between the calls for
 * one page, so a photo that appears in both the page and its tile is encoded
 * once.
 */
async function writeImages(html, slug, report, written = new Map()) {
  const sources = [
    ...new Set([...html.matchAll(/<img\b[^>]*?\bsrc="([^"]*)"/g)].map((m) => m[1])),
  ];

  for (const src of sources) {
    if (src.startsWith("data:") || written.has(src)) continue;
    if (/^(https?:)?\/\//i.test(src)) {
      report.remote.push(`${slug}: ${src}`);
      continue;
    }

    const thumb = src.endsWith(THUMB_SUFFIX);
    const file = thumb ? src.slice(0, -THUMB_SUFFIX.length) : src;

    // Resolve inside the content dir only, so a stray `../../.ssh/id_rsa`
    // in a markdown file can't pull an arbitrary file into the site.
    const abs = path.resolve(CONTENT_DIR, decodeURIComponent(file));
    if (abs !== CONTENT_DIR && !abs.startsWith(CONTENT_DIR + path.sep)) {
      throw new Error(`${slug}: image path escapes content/collections/: ${src}`);
    }

    let original;
    try {
      original = await readFile(abs);
    } catch {
      throw new Error(
        `${slug}: image not found: ${src}\n  looked in ${path.relative(projectRoot, abs)}`
      );
    }

    // Collections mix square product shots with portrait phone photos. The
    // reading pane caps both axes, so a portrait image lands visibly narrower
    // than a square one and the column of pictures looks ragged. Padding each
    // image out to a square on the same white background lines them all up.
    // `.rotate()` with no argument applies the EXIF orientation, which phone
    // photos rely on; stripping metadata afterwards drops any GPS tags.
    // `contain` fills the padding with the background but leaves the source's
    // own alpha intact, so the flatten afterwards is still doing work.
    const side = thumb ? THUMB_SIDE : IMAGE_SIDE;
    const { data, info } = await sharp(original)
      .rotate()
      .resize({ width: side, height: side, fit: "contain", background: IMAGE_BACKGROUND })
      .flatten({ background: IMAGE_BACKGROUND })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const { encoded, quality } = await encodeWithin(data, info, IMAGE_MAX_BYTES);
    if (!encoded) {
      throw new Error(
        `${slug}: image won't get under ${formatBytes(IMAGE_MAX_BYTES)} even at the lowest quality: ${src}\n  crop it closer to the subject and try again`
      );
    }

    const name = path.basename(abs, path.extname(abs)).toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const hash = createHash("sha256").update(encoded).digest("hex").slice(0, 8);
    const out = `${name}${thumb ? "-thumb" : ""}.${hash}.webp`;
    await writeFile(path.join(IMAGE_DIR, out), encoded);

    written.set(src, { url: `${IMAGE_URL}/${out}`, side });
    report.images.push({ slug, src, from: original.length, to: encoded.length, quality });
  }

  if (written.size === 0) return html;
  // The size attributes reserve each photo's square before it loads, so lazy
  // loading doesn't shift the page as photos arrive.
  return html.replace(/(<img\b[^>]*?\bsrc=")([^"]*)(")/g, (whole, before, src, after) => {
    const image = written.get(src);
    if (!image) return whole;
    return `${before}${image.url}${after} width="${image.side}" height="${image.side}" loading="lazy" decoding="async"`;
  });
}

async function readCollections(report) {
  let files;
  try {
    files = (await readdir(CONTENT_DIR)).filter((f) => f.endsWith(".md")).sort();
  } catch (err) {
    if (err.code === "ENOENT") {
      throw new Error(
        `No collections found. Create ${path.relative(projectRoot, CONTENT_DIR)}/ and add a markdown file.`
      );
    }
    throw err;
  }

  if (files.length === 0) {
    throw new Error(
      `No .md files in ${path.relative(projectRoot, CONTENT_DIR)}/. Nothing to build.`
    );
  }

  const collections = [];
  for (const file of files) {
    const raw = await readFile(path.join(CONTENT_DIR, file), "utf8");
    const { meta, body } = parseFrontmatter(raw);
    const slug = file.replace(/\.md$/, "");
    const story = meta.layout === STORY_LAYOUT;
    // No options object here or below: one would replace marked's defaults,
    // card renderer included, rather than merge into them.
    const tokens = marked.lexer(body);
    prepareCards(tokens, meta);
    const roll = story ? storyRoll(tokens) : "";
    if (roll) {
      // After the intro, just above the first chapter.
      const at = tokens.findIndex((t) => t.type === "heading" && t.depth === 2);
      const overview = { type: "html", block: true, pre: false, raw: roll, text: roll };
      tokens.splice(at === -1 ? tokens.length : at, 0, overview);
    }
    const rendered = marked.parser(tokens);
    const html = story ? `<div class="story">\n${rendered}</div>\n` : rendered;
    const order = Number.parseFloat(meta.order);
    const written = new Map();
    collections.push({
      slug,
      title: meta.title || slug,
      date: meta.date || "",
      html: await writeImages(html, slug, report, written),
      preview: await writeImages(previewOf(tokens), slug, report, written),
      order: Number.isFinite(order) ? order : Infinity,
    });
  }

  // Collections with an `order` in their frontmatter come first, lowest first.
  // The rest follow newest first, undated last, then alphabetical for
  // stability. This is the order of the index tiles and the nav.
  collections.sort((a, b) => {
    if (a.order !== b.order) return a.order < b.order ? -1 : 1;
    if (a.date && b.date && a.date !== b.date) return b.date.localeCompare(a.date);
    if (a.date && !b.date) return -1;
    if (!a.date && b.date) return 1;
    return a.title.localeCompare(b.title);
  });

  return collections.map(({ order, ...collection }) => collection);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function main() {
  // Emptied first, so a photo dropped from the markdown doesn't linger.
  await rm(IMAGE_DIR, { recursive: true, force: true });
  await mkdir(IMAGE_DIR, { recursive: true });

  const report = { images: [], remote: [] };
  const collections = await readCollections(report);

  await mkdir(path.dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, `${JSON.stringify({ collections }, null, 2)}\n`, "utf8");

  console.log(
    `Built ${collections.length} ${collections.length === 1 ? "collection" : "collections"} into ${path.relative(projectRoot, OUT_FILE)}`
  );
  for (const collection of collections) {
    const count = report.images.filter((i) => i.slug === collection.slug && !i.src.endsWith(THUMB_SUFFIX)).length;
    console.log(`  - ${collection.title}${count ? ` (${count} image${count === 1 ? "" : "s"})` : ""}`);
  }

  if (report.images.length > 0) {
    const total = report.images.reduce((sum, img) => sum + img.to, 0);
    console.log(
      `\nImages written to ${path.relative(projectRoot, IMAGE_DIR)} (${report.images.length} files, ${formatBytes(total)}):`
    );
    for (const img of report.images) {
      console.log(
        `  ${img.src}  ${formatBytes(img.from)} -> ${formatBytes(img.to)} webp, quality ${img.quality}`
      );
    }
  }

  if (report.remote.length > 0) {
    console.log(
      "\nWarning: these images are remote URLs, so they are fetched from a third\nparty every time the page opens:"
    );
    for (const src of report.remote) console.log(`  ${src}`);
  }
}

main().catch((err) => {
  console.error(`\nCollections build failed: ${err.message}`);
  process.exit(1);
});
