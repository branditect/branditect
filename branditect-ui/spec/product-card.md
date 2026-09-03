# Product card — build spec

Reference mockup: `reference/product-drawer.html` (open it, click the tabs, toggle **Design notes**).

## Scope

**Only the opened product card changes.** The products list — route, table, columns,
search, Import, Add product, pagination, the estimated-cost footnote — ships as it is today.
No new columns, no new badges on the rows, no change to the list query.

Everything below happens inside the drawer that opens when a row is clicked.

## The one rule

**The product card is the join, not the store.** Files live in Knowledge. Images live in the
asset library. The card holds links to them plus the things that exist nowhere else:
description, specifications, notes. Nothing is ever stored twice, and nothing may exist *only*
inside a product.

Consequence: uploading a file from the card writes it to Knowledge first, then links it.
Uploading an image from the card writes it to the asset library first, then links it.

---

## Tabs

Six, replacing the current five. `Details · Pricing · Files · Media · Notes · History`

- **Inventory is removed** as a tab; stock moves into Pricing, beside cost.
- **Write about it / Make images / Ask about it are removed** from the card header.
- The header gains a **link summary**: `4 files · 6 images · 3 notes`, each chip a jump to its tab.

### Details

| Field | Type | Notes |
|---|---|---|
| Product name | text | unchanged |
| Description | textarea | **min-height 196px** (was ~2 rows), vertical resize, 2000-char counter |
| Category | text/select | unchanged |
| SKU | text, mono | unchanged |
| Barcode | text, mono | unchanged |
| Tags | text | unchanged, keep the existing helper line |
| **Specifications** | repeatable key/value rows | new |

Specifications is a new `product_specs` table: `id, product_id, key, value, sort_order`.
Add-row, inline edit, remove, drag to reorder (reorder can be phase 2).

Why both: the description is prose Studio rewrites; specifications are values Studio must
quote verbatim and never paraphrase. One free-text blob cannot carry both contracts.

### Pricing

Existing cost/price fields, plus stock moved in from Inventory, plus a read-only
"What Studio is allowed to say" block: margin, floor price, max discount. When an input is
missing, the tile says *which* figure is missing rather than showing a wrong number —
this is the same rule as the list's estimated-cost footnote, stated per product.

### Files — new

Upload zone: PDF, DOCX, XLSX, ≤25 MB. Two entry points: **Upload** and **Link from Knowledge**.

Each row shows: type icon, filename, a document-type label, size, date, index state, and a
provenance line. Row actions: `Feeds Studio` toggle, overflow menu (Download, Rename,
Replace, Make private, Unlink / Delete).

Document types (seed list, user-extendable): Safety sheet · Spec sheet · Marketing sheet ·
Contract · Certificate · Price list · Other.

### Media — new

Grid of images linked from the asset library. Each tile: thumbnail, filename, dimensions,
source (`Asset library` / `Made in Studio`), unlink on hover. One image is `Primary`.
Plus a `Link from asset library` tile that opens the library picker filtered to this brand.

The primary image is what the list row *already* renders in its thumbnail slot — this is the
one place the card writes something the list reads, and it needs no list-side change beyond
pointing the existing thumbnail at `primary_asset_id` when present.

### Notes — new

Composer + reverse-chronological entries. Each note: author, timestamp, body, pin, edit,
delete. A `Studio reads these notes` toggle scoped to the product (default on).
Pinned notes are injected into every generation about this product.

`product_notes`: `id, product_id, author_id, body, is_pinned, created_at, updated_at`.

### History

Append-only activity for this product: field edits, file linked/unlinked, image linked,
note pinned, description rewritten in Studio. Read-only.

---

## Linking model

Two link tables. Both are per-product; a document or asset may link to many products.

```
document_links
  id
  document_id      -> knowledge documents table
  product_id
  origin           'uploaded_here' | 'linked_from_knowledge'
  feeds_studio     boolean, default true
  visibility       'shared' | 'reference_only'   -- excluded from all AI context + Knowledge list
  created_at

asset_links
  id
  asset_id         -> asset library table
  product_id
  is_primary       boolean, one true per product (partial unique index)
  created_at
```

**`origin` drives the destructive action, and the UI must say which it is:**

| origin | button | effect |
|---|---|---|
| `uploaded_here` | Delete | removes the link **and** the document from Knowledge |
| `linked_from_knowledge` | Unlink | removes the link only; file stays in Knowledge |

A file linked to more than one product always unlinks, never deletes, and the row says so
(*"Shared with SORBIFY ALL, SORBIFY ULTRA"*).

### The two AI toggles, and how they are labelled

Both keep a document away from the models. They differ only in scope, so **label them by
scope, not by state** — otherwise people set the wrong one.

| Field | Scope | UI label |
|---|---|---|
| `feeds_studio` | this link, this product | **Use when writing about this product** |
| `visibility` | the document, everywhere | **Reference only, everywhere** |

**`feeds_studio`** is per link, not per document. A supplier contract belongs on the card as a
reference without ever being quotable in copy. Default on for every type except `Contract`.

**`visibility = 'reference_only'`** excludes the document from the Knowledge list, from Ask
retrieval, and from Studio regardless of `feeds_studio`. It is a property of the document, so
setting it on one link sets it everywhere; warn if the document is linked elsewhere.

**Do not call this "Private".** It does not hide the file from teammates — they still see it
on the product card and can open it. "Private" promises something about people that this does
not deliver, and someone will put an NDA or a salary document behind that word. The label says
what it actually does: the models never read it.

## Retrieval contract

When Studio or Ask builds context for a product, it pulls, in this order:

1. Product fields — name, description, category, tags
2. Specifications — verbatim, never paraphrased
3. Pinned notes, then unpinned notes (if the product's notes toggle is on)
4. Chunks from linked documents where `feeds_studio = true` and `visibility = 'shared'`
5. Pricing rules — floor price, max discount, minimum margin

Nothing with `visibility = 'private'` enters this set. Ever. That is the one hard assertion
worth a test.

## Upload pipeline

Card upload → write to the same store Knowledge uses → dedupe by content hash (if the hash
exists, link the existing document instead of storing a copy and tell the user) → create
`document_links` row → enqueue index job → row shows `Indexing…` then `Indexed ✓`, or
`Failed — retry` with the reason.

Images: same shape against the asset library, then `asset_links`.

## States to build

Every tab: empty, loading, error, saving, saved. Specifically —

- Files, empty: the drop zone alone, with the type list as its helper text
- Files: uploading (progress), indexing, index failed, file too large, wrong type
- Files: delete confirm (names the file, says it leaves Knowledge too)
- Media, empty: the `Link from asset library` tile alone
- Media: library picker open, nothing linked yet, unlink confirm on the primary image
- Notes, empty: composer + one line of helper text
- Pricing: each tile's missing-input state
- Whole card: unsaved changes → Revert enabled, footer reads `Save`; clean → `Saved` disabled

## Acceptance criteria

1. The products list route renders byte-identical to production. No list-side change ships
   in this work except the thumbnail reading `primary_asset_id`.
2. A file uploaded from the card appears in Knowledge › Documents, tagged to that product,
   with exactly one copy in storage.
3. **MERGE BLOCKER.** A file linked from Knowledge shows **Unlink**; unlinking leaves it in
   Knowledge.
4. **MERGE BLOCKER.** A file uploaded from the card shows **Delete**; deleting removes it from
   Knowledge, after a confirm that says so.

   Criteria 3 and 4 need a test in **both** directions. The `origin` branch getting reversed
   deletes a customer's file out of Knowledge from a screen that looked like it was tidying a
   product card — the one bug in this spec that loses data.
5. A file with `feeds_studio = false` never appears in a Studio generation's context.
6. **MERGE BLOCKER.** A document with `visibility = 'reference_only'` is absent from the
   Knowledge list, from Ask results, and from Studio context — asserted by test. This is the
   only criterion whose failure is *silent*: nobody notices until a supplier contract turns up
   quoted in marketing copy. Step 5 does not merge without it.
7. Images are links: unlinking an image from a product does not delete it from the library.
8. Exactly one image per product can be primary; setting a new one clears the old.
9. Pinned notes appear in generated copy's context; the "never write biodegradable" case is
   the fixture.
10. Description accepts and round-trips 2000 characters including blank lines.
11. Every tab renders its empty state without an error when the product is brand new.

## Build order

1. **Details** — enlarge description, add specifications table. Ships alone, no new tables
   beyond `product_specs`.
2. **Notes** — `product_notes`, composer, pin. Ships alone.
3. **Files**, in two commits. Largest slice; do not start before 1 and 2 are merged.
   - **3a — safe half.** `document_links`, upload → Knowledge (dedupe by hash), link-from-
     Knowledge picker, the row list, index states. Nothing destructive ships here.
   - **3b — risky half.** Origin-aware Delete vs Unlink, `feeds_studio`, reference-only.
     Its own review, with the both-directions test from criteria 3 and 4.
4. **Media** — `asset_links`, picker, primary.
5. **Retrieval** — wire 1–4 into the Studio/Ask context builder; add the private-exclusion test.
6. **Pricing + History** — move stock in, drop the Inventory tab, add the activity feed.
7. **Remove** Write about it / Make images / Ask about it from the header, add the link summary.

Step 7 last, so the card is worth opening before the shortcuts disappear.

## Decisions (settled — do not re-open)

**Reference-only hides from the models, not from teammates.** Same-brand users still see the
file on the card and can open it. Per-user visibility needs a permissions model that does not
exist, and a file a teammate cannot see but that counts in the header summary (`4 files`)
produces a ghost. Hence the labelling rule above.

**Unlinking a shared document is silent, with an Undo toast.** The row already discloses the
sharing (*"Shared with SORBIFY ALL, SORBIFY ULTRA"*), so a confirm is just a second reading of
the same sentence — and unlinking here does not touch the other products' links. Confirms are
reserved for the one action that removes a file from Knowledge.

**No per-product file cap. Cap retrieval and cap storage.** What degrades first is context
quality, not disk: twenty documents on one product is already more than a single generation
uses well.

- Soft warning at **20 files** on a product: *"Studio reads the most relevant few — more files
  here won't make copy better."* Warn, never block.
- Hard cap on **storage per brand**, tied to plan. Start at 2 GB.

**Replace keeps the old file, without a version tree.** Replacing creates a **new document**;
the links move to it; the old one stays in Knowledge marked *"Replaced by [name] on [date]"*
and is **de-indexed**. One pointer, no tree, nothing silently lost, and the superseded file
stops polluting retrieval. (Version trees remain out of scope — see Not building.)

## Not building

Version trees, per-file comments or approvals, folder hierarchy inside a product, OCR of
scanned contracts, per-note permissions.
