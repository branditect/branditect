# Making the library's keyword tags count on the product card

An addendum to `spec/product-attachments.md`. Read that first — this changes section
**"Where tagging happens"** and adds one criterion.

---

## What is happening today

The image library already carries real tagging work. `brand_images.tags TEXT[]` is filled in by
hand, and `components/image-library.tsx` searches it:

```ts
const matchesTags     = img.tags.some((t) => t.toLowerCase().includes(search));
const matchesName     = img.file_name.toLowerCase().includes(search);
const matchesCampaign = img.campaign_name?.toLowerCase().includes(search);
```

The product card sees none of it. It renders one image, from `products.image_url`, chosen through
`components/products/image-picker.tsx` — whose callback is `onPick: (url: string | null) => void`.
One product, one URL string. That is the whole reason only the chosen image appears.

**There is also a plain bug in the picker.** Its `BrandImage` interface is:

```ts
interface BrandImage { id: string; file_url: string; file_name: string; category: string; }
```

No `tags`. So the picker's own search box cannot match a tag — it only matches file names, while
the search box two screens away matches tags, names and campaigns. Fix that regardless of
everything below: select `tags` and `campaign_name`, and use the same three-field match the library
uses. Same behaviour from the same-looking control.

---

## The decision: tags find images, links hold them

A keyword is a string. A product link is a row that references an id. It is tempting to skip the
link table and render the card from a string match, and it must not be done.

| | What goes wrong |
|---|---|
| **Rename a product** | Every match breaks at once and the card silently empties. Nothing errors — the photos are simply gone, and the person who notices is a customer |
| **Two products share a word** | "Oil" is on the 500ml and the refill. Each card shows the other's photography, and it reaches a generated ad before anyone checks |
| **Primary image** | A string match has no way to say which one leads, or in what order |
| **Removing one image** | The only way out is deleting the keyword in the library, where it is doing other work |

So the card keeps rendering from `product_images`. What changes is how rows get in there: **her
existing tags become the fastest way to create them, on one click, rather than something the card
ignores.**

---

## 1 · Matched from the library, on the product card

Media's empty state stops being a dead end. Rank every image in the brand's library by overlap
between the **product** — `name`, `sku`, and `catalog_products.tags` — and the **image** — `tags`,
`file_name`, `campaign_name`. The same three image fields the library search already reads, so a
match here means what a match there means.

```
No images tagged to this product yet.

7 images in your library mention  sorbify · oil          [ Review 7 ]
```

`Review` opens the picker with those seven pre-ticked and **the matched word shown on each tile**,
so it is obvious why each one is there and a wrong one is one click to untick. Confirming writes
seven rows to `product_images`. From that moment the card is exact and no longer depends on the
words.

Rank, do not filter: an exact `sku` match sorts above a `name` match, which sorts above a single
shared tag. Never auto-apply — the run happens when she opens the tab, the write happens when she
clicks.

### One button, deliberately

There is no `Add all`. It was considered and dropped.

Pre-ticked Review is already *open, confirm* — two clicks. `Add all` saves exactly one of them, and
for that one click it costs a rule about when the button may appear (only when every match is
exact), a match-strength predicate to implement it, an explanation for why it is sometimes missing,
and a path on which a wrong image is attached without anyone looking at it.

The asymmetry with the decision above is what settles it. String-matching on the card was refused
because its failures are **silent**. Review is the opposite: every candidate is on screen with the
word that matched it, so a bad match is caught by the glance the person is already giving. Removing
the button that skips that glance costs almost nothing.

Revisit at a hundred products, with evidence about how often matches are right — which nothing in
the app can currently answer.

## 2 · Offered in the library, where the tag is typed

The higher-value half, because it costs nothing extra at the moment she is already typing.

When a tag she saves in `image-library.tsx` equals a product's `name`, `sku`, or one of that
product's own tags:

> **sorbify oil** is a product. Tag this image to it as well?  `Yes` · `Not this one`

One line under the tag editor. Dismissing it does not ask again for that image and that product.

## 3 · Both directions visible

An image's detail shows the products it is linked to, as removable chips — already criterion 12 in
the parent spec. With matching in place it earns a second line: the chips are links, and beneath
them the keyword tags stay keyword tags. **They are different things on the screen because they are
different things in the database**, and a person who can see the difference will not be surprised
when renaming a product leaves the links alone.

---

## The chosen card image is not a separate idea

`products.image_url` becomes the row with `is_primary = true`, exactly as the parent spec says.
`ImagePicker` should return the image's `id` rather than its `file_url` and set the primary flag;
the column keeps being written so nothing that reads it breaks. That collapses "the picture on the
card" and "the images tagged to this product" into one list with a star on the first, rather than
two features that do not know about each other.

---

## Added acceptance criteria

13. `ImagePicker` matches tags, file names and campaign names — asserted against a fixture whose
    tag matches and whose filename does not.
14. Matching is ranked and pre-ticked, never written without a click — asserted by opening Media on
    a product with matches and expecting zero rows in `product_images`. **No control writes a match
    set without showing it first** — asserted by a test that finds no `Add all` affordance.
15. Renaming a product changes nothing on its card — asserted by a test that tags three images,
    renames the product, and expects the same three. **This is the criterion the whole design
    exists for.**
16. Two products sharing a tag word each show only their own linked images.
17. Setting the card image sets `is_primary` and writes `image_url`; both stay in step.

---

## Build order, revised

Slot these into `spec/product-attachments.md`'s order:

1. Tables, RLS, partial unique index, counts view. *(done)*
2. Product card Media, read-only, **plus the ImagePicker tag fix.** Criteria 1, 7, 13.
3. Matching on the card's empty state and in `Tag more`. Criteria 14–16.
4. Auto-link on save from Create images. Criterion 5.
5. The suggestion in the library tag editor. Criterion 2 of this addendum.
6. Downloads.

Step 3 moves up because it is what turns tagging she has **already done** into a populated card.
Every other step only helps images she has not uploaded yet.
