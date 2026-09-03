# Tagging media and documents to a product

Attach images, videos and documents to a product, see them all on the product card, and download
them from there.

---

## What already exists

| | |
|---|---|
| `brand_images` | images **and videos**, separated by `category` (`product` · `brand` · `video`) |
| `brand_documents` | PDFs and other documents in Knowledge |
| `components/products/product-drawer.tsx` | the product card. This is where the new sections go — **no new route** |
| `Product.imageCount`, `Product.sourceFileCount` | already on the interface, read from `image_count` / `source_file_count` |

Those last two are the tell: the intent was there and the wiring never was. **Nothing populates them
from real links, so they are currently decorative.** They become derived counts in this work, or
they will keep quietly lying.

---

## The data model

**Two join tables, not one polymorphic table.**

```sql
CREATE TABLE product_images (
  product_id  UUID NOT NULL REFERENCES products(id)       ON DELETE CASCADE,
  image_id    UUID NOT NULL REFERENCES brand_images(id)   ON DELETE CASCADE,
  brand_id    TEXT NOT NULL,
  is_primary  BOOLEAN NOT NULL DEFAULT false,
  sort_order  INT     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (product_id, image_id)
);

CREATE TABLE product_documents (
  product_id   UUID NOT NULL REFERENCES products(id)          ON DELETE CASCADE,
  document_id  UUID NOT NULL REFERENCES brand_documents(id)   ON DELETE CASCADE,
  brand_id     TEXT NOT NULL,
  doc_role     TEXT,          -- 'safety_sheet' | 'spec' | 'manual' | 'certificate' | null
  created_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (product_id, document_id)
);

CREATE INDEX ON product_images (image_id);
CREATE INDEX ON product_documents (document_id);
```

RLS on both: `brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid())`.

### Why two tables rather than one `product_links(kind, asset_id)`

A polymorphic table cannot have foreign keys, so deleting an image leaves a link pointing at
nothing. Orphans then appear on the product card as broken thumbnails, which is exactly the bug
that makes people stop trusting the feature. `ON DELETE CASCADE` costs one extra table and removes
the whole class of problem.

### Why many-to-many

**A photograph can contain more than one product.** A lifestyle shot with the bottle, the mat and
the spill kit belongs to all three, and a single `product_id` column on the image would force you to
pick one and lie about the rest. The same PDF is often the safety sheet for a whole range.

### `is_primary` replaces `products.image_url`

The product's existing single `image_url` becomes the row with `is_primary = true`. Keep the column
for now, written by a trigger or on save, so nothing that reads it breaks — but the link table is
the truth. Exactly one primary per product; setting a new one clears the old.

### The counts must be derived, never stored

```sql
CREATE VIEW product_attachment_counts AS
SELECT p.id AS product_id,
       (SELECT count(*) FROM product_images    pi WHERE pi.product_id = p.id) AS image_count,
       (SELECT count(*) FROM product_documents pd WHERE pd.product_id = p.id) AS document_count
FROM products p;
```

A stored count needs every write path to remember to update it, and one that forgets is invisible
until someone notices the number is wrong. Derive it.

---

## Where tagging happens — three places, in order of value

### 1 · On generation, automatically

`spec/create-images.md` already has the user choose **A product picture** and pick the product in
step 1. When they then **Save** a generated image, **it links to that product with no extra step.**

This is the most important one and it is nearly free. Tagging that requires a second, separate
action does not happen — people are finished when the image is good, not when the metadata is
tidy. Getting the link at the moment of intent is the difference between a feature that works and
one that is technically present.

Show it on the saved card: `Saved to Knowledge · tagged to SORBIFY OIL`.

### 2 · On upload to Knowledge

The upload panel in `/knowledge/images` and `/knowledge/documents` gains one control:
**`Tag to a product (optional)`** — a searchable product picker, multi-select, applied to everything
in that upload batch.

**Suggest, never auto-apply.** A filename like `sorbify-500ml-front.jpg` may propose a match:

> Looks like **SORBIFY OIL**. Tag these 6 files to it? `Yes` · `No, choose another`

Silent auto-tagging on a filename guess is worse than no tagging, because nobody audits it and the
wrong link propagates into every product card and every generated description that reads it.

### 3 · On an item already in the library

Each Knowledge item's row and detail get **`Tag to product`**, opening the same picker.

And the reverse: **an item shows which products it is tagged to**, as chips, removable. One-way
tagging is how a library becomes untrustworthy — you can see what a product has, but never what a
file is for.

---

## The product card

Two new sections in `components/products/product-drawer.tsx`, below the existing detail and above
the money.

### Media

A grid of square thumbnails, 5 across at drawer width. Videos carry a duration badge and a play
glyph. The primary image carries a small `Primary` tag.

```
Media  6                                    [ Tag more ]  [ Download all ]
┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
│ ★  │ │    │ │ ▶  │ │    │ │    │
└────┘ └────┘ └────┘ └────┘ └────┘
 front   pack   0:24   detail  lifestyle
```

Hover on a tile: `Download` and `Untag`. Click: the existing lightbox.

**Untag never deletes the file.** It removes the link. The file stays in Knowledge, where it may
belong to another product. Say so in the confirm: *"Removes it from this product. The file stays in
Knowledge."*

### Documents

A list, not a grid — documents are read by their names.

```
Documents  3                                [ Tag more ]  [ Download all ]
📄  SORBIFY OIL safety data sheet.pdf     Safety sheet   2.1 MB   ↓
📄  Absorbency test, TÜV 2025.pdf         Certificate    840 KB   ↓
📄  500ml spec sheet.pdf                  Spec           310 KB   ↓
```

`doc_role` is a plain dropdown set when tagging, and it is worth having: **it is what lets Studio
know that the safety sheet is the source for a hazard claim** and the certificate is the source for
a performance claim. Optional, and blank is fine.

### Downloads

- **Per file** — a direct link to the stored object.
- **Download all** — one zip per section, named `SORBIFY-OIL-media.zip` / `-documents.zip`.

Build the zip **server-side and streamed**, in `app/api/products/[id]/download/route.ts`. Never
fetch every file into the browser and zip it there: a product with forty images is a hundred
megabytes of memory in a tab, and it fails silently on a phone.

Ownership is checked with the helper from `0832b5b` before a single byte is read. **Downloads cost
nothing in credits** — this is egress on files the customer already owns, and charging for it would
be charging twice.

### Empty states

Never an empty grid. Media with nothing in it says:

> No images yet. Generate some in Studio, or tag existing ones from Knowledge.
> `Create images →` `Tag from Knowledge →`

The first button matters: the product card is where someone notices a product has no photography,
and it should be one click from noticing to fixing.

---

## What this unlocks beyond the card

Worth building with this in mind even though it is not in scope now:

`spec/create-images.md` passes product identity into the prompt. Once documents are linked,
**Studio can cite the safety sheet when it writes about the product**, and the provenance chip on a
generated claim can point at the actual PDF. The link table is the join that makes closed-book
citation work at the product level rather than the brand level.

Do not build that here. Build the links so it becomes possible.

---

## Acceptance criteria

1. One image can be tagged to three products and appears on all three cards.
2. Deleting an image from Knowledge removes its links and leaves no broken thumbnail on any product
   card — asserted by test.
3. Deleting a product removes its links and **deletes no files** — asserted by test.
4. Untagging removes the link only; the file is still in Knowledge.
5. Saving a generated image with a product selected creates the link with no further action.
6. Filename suggestion is offered and never applied without a click — asserted against a fixture
   whose filename matches a product.
7. `image_count` and `document_count` on the product card match the link tables exactly, including
   after an untag, with no page reload.
8. Exactly one `is_primary` per product; setting a new one clears the previous — enforced by a
   partial unique index, not by application code.
9. `Download all` streams a zip from the server and never assembles it in the browser.
10. A product id belonging to another brand returns 404 from the download route. **MERGE BLOCKER.**
11. Downloads debit no credits and no cost budget.
12. Every Knowledge item shows the products it is tagged to, and the chips remove the link.

---

## Build order

1. The two tables, the RLS, the partial unique index on `is_primary`, and the counts view.
2. The product card sections, read-only. Criteria 1, 7.
3. Tagging: the picker component, used from Knowledge upload, Knowledge item, and the card's
   `Tag more`. Criteria 4, 6, 12.
4. Auto-link on save from Create images. Criterion 5.
5. Downloads, per file then zip. Criteria 9, 10, 11.

Step 4 is small and has the highest return of the five. If time runs short, do it before step 3.

---

## Not building

Folders or collections, drag-to-reorder beyond `sort_order`, image cropping or editing, version
history on an attachment, bulk retagging across products, or an approval step. Tagging should cost
one click; anything that makes it a workflow means it stops happening.
