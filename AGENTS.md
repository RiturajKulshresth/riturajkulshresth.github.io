# Agent notes

## Adding to the collections

`/collections` is built from markdown. To add, move or remove an item, edit only
`content/collections/`. The index tiles, chapter counts, overview, dialogs and
image encoding are all generated from it.

- `content/collections/<slug>.md`: one file per collection (`watches.md`,
  `diecast.md`). The file name is the URL, `/collections/<slug>/`.
- `content/collections/images/`: the photos the markdown points at.
- `npm run collections` builds both, and runs on its own before `npm run dev`
  and `npm run build`. Run it after an edit to refresh a running dev server and
  to catch errors such as a missing photo. Never edit `collections.json` or
  `public/collections/`: they are generated and gitignored.

### Cards

An item is a list item holding a nested `Label: value` list. Its checkbox is its
status: `- [x]` owned, `- [ ]` wanted or ordered, `- ` with no box a maybe. Each
`##` section is one list, so keep a list to one status.

```markdown
- [ ] **Seiko Prospex Alpinist Mechanical GMT** (ref. HBC007J1, cal. 6R54)

  ![Seiko Prospex Alpinist Mechanical GMT HBC007J1](images/seiko-alpinist-gmt-hbc007j1.webp)

  - Case: 39.5mm x 13.6mm, 46.4mm lug-to-lug
  - Cost: 1,10,000 available, against the 1,20,000 Seiko India MRP
```

- Name line: the name in bold, then the reference or variant in brackets.
- Photo: one, directly under the name, saved in `images/` with a kebab-case
  name such as `brand-model-ref.jpg` (jpg, png, webp or avif) and alt text
  naming brand and model. The build pads it to a white 320px WebP square under
  5 KB; if it fails to fit, crop the photo closer to the subject.
- Labels are letters and spaces only, start with a capital, are at most 20
  characters, and end in `: `.
- `Cost:` starts with the figure in Indian grouping (`1,10,000`), no ₹ sign.
  That leading figure is the card's price, its sort key, and its table value.

Fields, in this order, skipping any that don't apply:

- Watches: Case, Movement, Features, Dial, Crystal, Strap, Water, Cost, Where,
  Note.
- Diecast: Brand, Scale (always 1:64; the collection is 1:64 only). Preorders
  add Due (when known), Cost and Site.

### Sections

- **Watches:** On the wrist (`[x]`), Next up (`[ ]`), Someday (no box), Passed
  on, What it all costs. Next up is in buy order, numbered by `ranked: Buy
  order`, so insert a watch at its place in that order and ask if it's unclear.
  When a watch arrives, move it to On the wrist and tick it. A dropped watch
  becomes a `Name (reference)` row in the Passed on table, and its card and
  photo are deleted.
- **Diecast:** On the shelf (`[x]`), On preorder (`[ ]`), What it all costs.
  When a preorder arrives, move it to On the shelf, tick it, and drop its Due,
  Cost and Site fields.
- **What it all costs:** every card with a Cost has a row in its section's
  table. Whenever a card is added, moved, repriced or removed, update its row,
  the `Total, N ...` row and, for watches, the combined line at the bottom.
- **Removing anything:** delete its photo from `images/` too, so no file is
  left unreferenced.

### A new collection

Add `content/collections/<slug>.md` with `## ` chapters of cards under an `#`
title. It gets an index tile and a nav link with no code changes.

```markdown
---
title: Sneakers
date: 2026-11-01
order: 3          # position on the index
layout: story     # opens with an overview of the chapters
---
```

Optional frontmatter: `ticked` and `unticked` rename the status chips (Owned and
To buy by default), `ranked` numbers an unticked list, and `details: inline`
shows the fields on the card rather than in a dialog. See `CARD_SETTINGS` in
`scripts/build-collections.mjs`.

### Writing

These are notes for the owner, not articles. No intro paragraphs, no notes on
method (how prices were checked, when items move), no advice or opinion ("so
it's a desk watch"), no explaining terms, and no rankings that go stale. A
`Note:` holds only facts worth not looking up again, such as a reference
mismatch or a sibling variant. No em dashes or en dashes.
