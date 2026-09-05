#!/usr/bin/env node
/**
 * Encrypts the plaintext vault (`content/vault/*.md`) into a single ciphertext
 * blob at `src/app/vault/_vault/vault.json`.
 *
 * The site is a static export on public GitHub Pages, so there is no server to
 * check a password against. Privacy therefore has to come from the content
 * itself being ciphertext: the markdown under `content/vault/` is gitignored
 * and never leaves this machine, and only the encrypted blob is committed and
 * deployed. The deploy workflow needs no secret because it just builds an
 * already-encrypted file.
 *
 * Markdown is rendered to HTML here rather than in the browser so no markdown
 * parser ships to visitors; `marked` stays a devDependency.
 *
 * Usage:
 *   npm run vault                    # prompts for the passphrase
 *   VAULT_PASSWORD=... npm run vault # non-interactive
 */
import { webcrypto as crypto } from "node:crypto";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import sharp from "sharp";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_DIR = path.join(projectRoot, "content/vault");
const OUT_FILE = path.join(projectRoot, "src/app/vault/_vault/vault.json");

// OWASP's 2023 floor for PBKDF2-SHA256. Costs a legitimate unlock roughly half
// a second in the browser; the ciphertext is publicly downloadable, so this is
// what makes bulk offline guessing expensive. Passphrase strength still does
// most of the work: use five or more random words.
const PBKDF2_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const VAULT_VERSION = 1;

// Local images are downscaled and inlined as data URIs so they end up inside
// the ciphertext. Anything served from `public/` would be a plain file at a
// guessable URL, which would leak the picture even though the prose around it
// is encrypted. WebP at these settings keeps a phone photo well under 200 KB.
// 720px is roughly 2.5x the 18rem display cap in vault.css, so photos stay
// crisp on a retina screen without bloating the blob. It caps the long edge,
// since every image is squared off before encoding.
const IMAGE_MAX_SIDE = 720;
const IMAGE_QUALITY = 78;
// Product shots are usually transparent PNG or WebP cutouts. Left unflattened
// they inherit whatever the vault theme is painting behind them, so a page of
// them looks inconsistent. Compositing onto white first makes every entry read
// like one catalogue. This is a no-op for images with no alpha channel.
const IMAGE_BACKGROUND = "#ffffff";
// The whole blob is embedded in the page and decrypted in one pass, so it is
// worth knowing when it starts getting heavy.
const BLOB_WARN_BYTES = 6 * 1024 * 1024;

/**
 * Minimal YAML-ish frontmatter parser. The vault only ever needs `title` and
 * `date`, so a real YAML dependency would be dead weight.
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

/**
 * Rewrites every local `<img src>` into a downscaled WebP data URI, so photos
 * travel inside the ciphertext instead of sitting in `public/` as plain files.
 * Remote and already-inlined sources are left alone.
 */
async function inlineImages(html, slug, report) {
  const sources = [
    ...new Set([...html.matchAll(/<img\b[^>]*?\bsrc="([^"]*)"/g)].map((m) => m[1])),
  ];

  const inlined = new Map();
  for (const src of sources) {
    if (src.startsWith("data:")) continue;
    if (/^(https?:)?\/\//i.test(src)) {
      report.remote.push(`${slug}: ${src}`);
      continue;
    }

    // Resolve inside the content dir only, so a stray `../../.ssh/id_rsa`
    // in a markdown file can't pull an arbitrary file into the vault.
    const abs = path.resolve(CONTENT_DIR, decodeURIComponent(src));
    if (abs !== CONTENT_DIR && !abs.startsWith(CONTENT_DIR + path.sep)) {
      throw new Error(`${slug}: image path escapes content/vault/: ${src}`);
    }

    let original;
    try {
      original = await readFile(abs);
    } catch {
      throw new Error(
        `${slug}: image not found: ${src}\n  looked in ${path.relative(projectRoot, abs)}`
      );
    }

    // Entries mix square product shots with portrait phone photos. The reading
    // pane caps both axes, so a portrait image lands visibly narrower than a
    // square one and the column of pictures looks ragged. Padding each image
    // out to a square on the same white background lines them all up. The side
    // is the source's own long edge, capped at IMAGE_MAX_SIDE, so the scale
    // factor is never above 1 and nothing gets upscaled into blur.
    const meta = await sharp(original).metadata();
    // EXIF orientations 5 to 8 rotate by a quarter turn, swapping the axes.
    const upright = (meta.orientation ?? 1) >= 5
      ? { width: meta.height, height: meta.width }
      : { width: meta.width, height: meta.height };
    const side = Math.min(Math.max(upright.width, upright.height), IMAGE_MAX_SIDE);

    // `.rotate()` with no argument applies the EXIF orientation, which phone
    // photos rely on; stripping metadata afterwards drops any GPS tags.
    // `contain` fills the padding with the background but leaves the source's
    // own alpha intact, so the flatten afterwards is still doing work.
    const encoded = await sharp(original)
      .rotate()
      .resize({ width: side, height: side, fit: "contain", background: IMAGE_BACKGROUND })
      .flatten({ background: IMAGE_BACKGROUND })
      .webp({ quality: IMAGE_QUALITY })
      .toBuffer();

    inlined.set(src, `data:image/webp;base64,${encoded.toString("base64")}`);
    report.images.push({ slug, src, from: original.length, to: encoded.length });
  }

  if (inlined.size === 0) return html;
  return html.replace(
    /(<img\b[^>]*?\bsrc=")([^"]*)(")/g,
    (whole, before, src, after) =>
      inlined.has(src) ? `${before}${inlined.get(src)}${after}` : whole
  );
}

async function readEntries(report) {
  let files;
  try {
    files = (await readdir(CONTENT_DIR)).filter((f) => f.endsWith(".md")).sort();
  } catch (err) {
    if (err.code === "ENOENT") {
      throw new Error(
        `No vault content found. Create ${path.relative(projectRoot, CONTENT_DIR)}/ and add a markdown file.`
      );
    }
    throw err;
  }

  if (files.length === 0) {
    throw new Error(
      `No .md files in ${path.relative(projectRoot, CONTENT_DIR)}/. Nothing to encrypt.`
    );
  }

  const entries = [];
  for (const file of files) {
    const raw = await readFile(path.join(CONTENT_DIR, file), "utf8");
    const { meta, body } = parseFrontmatter(raw);
    const slug = file.replace(/\.md$/, "");
    const rendered = await marked.parse(body, { gfm: true, breaks: false });
    entries.push({
      slug,
      title: meta.title || slug,
      date: meta.date || "",
      html: await inlineImages(rendered, slug, report),
    });
  }

  // Newest first, undated entries last, then alphabetical for stability.
  entries.sort((a, b) => {
    if (a.date && b.date && a.date !== b.date) return b.date.localeCompare(a.date);
    if (a.date && !b.date) return -1;
    if (!a.date && b.date) return 1;
    return a.title.localeCompare(b.title);
  });

  return entries;
}

/** Prompts on the TTY without echoing keystrokes. */
function promptHidden(question) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(
        new Error(
          "Not a TTY, so the passphrase cannot be prompted for. Set VAULT_PASSWORD instead."
        )
      );
      return;
    }
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    // Suppress echo by swallowing everything readline writes after the prompt.
    let muted = false;
    const write = rl._writeToOutput.bind(rl);
    rl._writeToOutput = (chunk) => {
      if (!muted) write(chunk);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true;
  });
}

async function resolvePassphrase() {
  const fromEnv = process.env.VAULT_PASSWORD;
  if (fromEnv) return fromEnv;

  const first = await promptHidden("Vault passphrase: ");
  if (first.length < 12) {
    throw new Error(
      "Passphrase must be at least 12 characters. The ciphertext is public, so short passphrases are brute-forceable offline."
    );
  }
  const second = await promptHidden("Confirm passphrase: ");
  if (first !== second) throw new Error("Passphrases do not match.");
  return first;
}

async function deriveKey(passphrase, salt) {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function main() {
  const report = { images: [], remote: [] };
  const entries = await readEntries(report);
  const passphrase = await resolvePassphrase();

  // Fresh salt and IV on every run. Reusing an IV under the same key would
  // leak plaintext relationships between builds, so these are never persisted
  // beyond the blob they belong to.
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(passphrase, salt);

  const plaintext = new TextEncoder().encode(JSON.stringify({ entries }));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);

  const blob = {
    v: VAULT_VERSION,
    kdf: "PBKDF2-SHA256",
    iterations: PBKDF2_ITERATIONS,
    salt: Buffer.from(salt).toString("base64"),
    iv: Buffer.from(iv).toString("base64"),
    data: Buffer.from(ciphertext).toString("base64"),
  };

  await mkdir(path.dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, `${JSON.stringify(blob, null, 2)}\n`, "utf8");

  const blobBytes = Buffer.byteLength(JSON.stringify(blob));
  console.log(
    `Encrypted ${entries.length} ${entries.length === 1 ? "entry" : "entries"} into ${path.relative(projectRoot, OUT_FILE)} (${formatBytes(blobBytes)})`
  );
  for (const entry of entries) {
    const count = report.images.filter((i) => i.slug === entry.slug).length;
    console.log(`  - ${entry.title}${count ? ` (${count} image${count === 1 ? "" : "s"})` : ""}`);
  }

  if (report.images.length > 0) {
    console.log("\nImages inlined into the ciphertext:");
    for (const img of report.images) {
      console.log(
        `  ${img.src}  ${formatBytes(img.from)} -> ${formatBytes(img.to)} webp`
      );
    }
  }

  if (report.remote.length > 0) {
    console.log(
      "\nWarning: these images are remote URLs, so they are NOT encrypted and\nwill be fetched from a third party every time you open the vault:"
    );
    for (const src of report.remote) console.log(`  ${src}`);
  }

  if (blobBytes > BLOB_WARN_BYTES) {
    console.log(
      `\nWarning: the blob is ${formatBytes(blobBytes)}. It is embedded in the page and\ndecrypted in one pass, so consider fewer or smaller images.`
    );
  }
}

main().catch((err) => {
  console.error(`\nVault encryption failed: ${err.message}`);
  process.exit(1);
});
