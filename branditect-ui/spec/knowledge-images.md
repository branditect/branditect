# Knowledge ▸ Images — tagging, and a screen that looks like the app

Reference: `reference/knowledge-images.html`.

Two things at once, because they are the same screen: **make tagging possible**, and rebuild the page
in the design system.

---

## 1 · The bug first: nothing can tag anything

`product_images` exists. `app/api/products/attachments/route.ts` reads it. The product card's Media
tab renders it.

**Nothing in the application writes a row to it.** There is no insert anywhere in `app/` or
`components/`. The table has been shipped, read and rendered, and is structurally unable to contain
data. So Media is permanently empty, and correctly so.

This is what `spec/product-attachments.md` calls step 3 and it was skipped. Everything below is that
step, plus the redesign the screen needs anyway.

---

## 2 · Tagging, on the Images screen

### Every tile shows what it belongs to

Under the filename and keyword tags, a bordered-off section: **On these products**, then chips, then
either more chips or a dashed `Tag to a product` button.

This is the half that is usually left out, and it is the half that makes the library trustworthy.
Without it you can see what a product has but never what a file is for, and the only way to audit
your tagging is to open every product card in turn. Each chip carries an `×` that removes the link —
never the file.

### Select many, tag once

Click a tile to select it. A dark bar appears: **`3 selected` · Tag to a product · Download · ✕`**.

This is the difference between a feature that gets used and one that does not. There is an existing
library of untagged images; one-at-a-time tagging of forty files is not something a person does
twice.

### The picker is one component, used in three places

Search by name or SKU, tick, confirm. The same component opens from:

- this screen's `Tag to a product`, on a tile or on a selection,
- the product card's `Tag more`,
- the upload panel, once `spec/document-upload-asks.md` lands its equivalent for documents.

Three entry points, one component, one behaviour. Building it three times is how they drift.

### Matching, from the tags already typed

Per `spec/product-attachments-tags.md`: rank products by overlap between the product
(`name`, `sku`, `catalog_products.tags`) and the image (`tags`, `file_name`, `campaign_name`) — the
same three fields `image-library.tsx` already searches.

In the picker the matching rows carry `matches "sorbify"` and sort to the top. On a tile with no
products and a confident match, one line offers it:

> Its tags match **SORBIFY REFILL**. One click in the picker adds it.

**It opens the picker. It does not tag.** Same rule as everywhere else: suggest, never auto-apply.

### Two filters that are really one question

`All products ▾` and an **`Untagged 14`** toggle. Between them they answer *"what have I not done
yet"*, which is the only question this screen gets asked twice.

### `Primary` is set here too

The tile carrying `is_primary` for a product shows a `Primary` flag. Setting a different one clears
the old — enforced by the partial unique index, not by application code.

---

## 3 · The redesign

The layout and the flow are right and do not change: dropzone, filters, grid. What changes is that
the page currently looks like nothing else in the app.

| What is there | What the design system says |
|---|---|
| `font-mono text-[0.65rem] uppercase` on every button and label — **10.4px monospace** | 14px body, 12px meta, Plus Jakarta Sans. There is no monospace in the type scale |
| `text-[0.55rem]` on the counts — **8.8px** | `--fs-xs`, 12px |
| `🖼` as the empty-state icon | Filled 24×24 SVG from `components/icon.tsx`, `fill="currentColor"`, `--accent` |
| `bg-brand-orange`, `border-light`, ad-hoc utilities | The tokens in `design/tokens.css` |
| Plain `<select>` and `<input>` with bespoke padding | The field styling in the reference — 9px radius, `--rule-2` border, `--tint-4` focus ring, matching every other form in the app |

Copy changes with it. `"No images uploaded yet. Drop some files above to get started."` becomes the
diagnosis rather than the description, per `CLAUDE.md`:

> **Nothing here yet.** Drop product photography in and tag it to a product — it will show on that
> product's card and Studio will use it.

---

## Acceptance criteria

1. Selecting images and confirming the picker writes rows to `product_images`, and the product card's
   Media tab shows them without a reload. **This is the criterion the feature exists for.**
2. One image tags to three products and shows three chips.
3. Removing a chip deletes the link and leaves the row in `brand_images` — asserted by a test that
   counts both tables before and after.
4. The `Untagged` filter shows exactly the images with no row in `product_images`, and its count
   matches the number of tiles rendered.
5. Filtering by a product shows exactly that product's tagged images.
6. Matching is ranked and shown with the matched word; opening the picker writes nothing — asserted
   by a test that opens it on a matching image and expects zero new rows.
7. Setting a new primary clears the previous one, enforced by the partial unique index.
8. The picker component is imported by both this screen and the product card — asserted by a test
   that fails if two separate picker implementations exist.
9. No rendered text on the page is below 12px, and no element uses a monospace family — asserted
   against the computed styles.
10. No emoji is used as an icon anywhere on the page.

---

## Build order

1. The picker component, and the write path. Criteria 1, 2, 3, 8.
2. Tile chips and the selection bar. Criteria 1, 2.
3. The two filters. Criteria 4, 5.
4. Matching. Criterion 6.
5. The restyle. Criteria 9, 10.
6. `is_primary` from this screen. Criterion 7.

Steps 1 and 2 are the whole point; if anything slips, it is 4 and 6.

---

## Not building

Folders, drag-to-reorder, cropping or editing, bulk retagging across products, an approval step, or
AI auto-tagging without confirmation. Tagging costs one click; anything that makes it a workflow
means it stops happening.
