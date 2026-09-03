# One brand guideline

**"Brand book" and "brand guideline" are the same thing.** Saara confirmed it: brand guideline is
the correct name. The word "brand book" retires.

That decision is easy. What it exposes is not: the same concept currently has **two pages and three
storage homes**, and neither page is reachable from the nav.

---

## What is actually there

| | Route | Size | Data |
|---|---|---|---|
| A | `/studio/brand-guideline` | 1213 lines | `brand_images`, `/api/brand-guideline/{upload-asset,extract,edit,brand-text}` |
| B | `/studio/brand-book` | 647 lines | `brand_book_pages`, `brand_book_assets`, `brand_book_colors`, `/api/brand-book/{upload,delete,color,chat}` |
| C | Brand ▸ Visual identity | — | `brand_visual.guideline_url` |

Neither A nor B is in `lib/nav.ts`. Both were reachable only from the Studio Brand assets tab that
was retired on 2026-09-03; B is now referenced by nothing but a test file.

Upload a guideline into A and C shows nothing. Upload into B and A shows nothing. C's download
button reads a URL neither of the others writes.

## The one thing already shared, which must not be broken

`brand_book_colors` is **not** part of B's private world, despite the name:

```
app/(app)/brand/visual-identity/page.tsx:133   reads it
app/api/brand-assets/upload/route.ts:97        writes it
app/api/andy/route.ts:19                       reads it (AI Chat)
app/(app)/studio/brand-book/BrandBookClient.tsx  reads and writes it
```

It is the live colour store for the whole app. **Deleting page B must not delete this table.** The
name is wrong and the name is all that is wrong; renaming it is a separate, optional, low-value
migration.

## And it explains the "Extracted" colours

`BrandBookClient.tsx:309`:

```js
const toAdd = newOnes.map((hex) => ({ id: Date.now() + Math.random(), hex, name: 'Extracted' }))
```

Every colour the brand-book chat finds is written with the literal name `Extracted`, into the table
Visual identity renders. That is the open item from the visual identity work, and it has been sitting
in an unreachable page the whole time.

**Fix it at the source, not at the display.** A colour with no name should carry its hex as its
name — `#F0562A` is a usable label and `Extracted` is not — and the row should record that it was
found rather than typed, so the page can offer *"name this colour"* instead of pretending it has one.

---

## The decisions

**1 · One name.** "Brand guideline" in every label, heading, route and comment. No surface says
"brand book" after this.

**2 · One home: Brand ▸ Visual identity.** Not Studio. A guideline is something the brand *has*, not
something Studio makes, and Visual identity is already where logos, colours and typefaces live —
`CLAUDE.md`'s one-home rule and the Define → Feed → Make test both land there.

**3 · One page — but do not pick it from a grep.**

A is nearly twice the size and does extraction and editing. B holds uploaded pages and renders them
back, which is the half the retired Studio tab got wrong. They are not the same feature with two
skins, and deleting the wrong one loses working behaviour.

So this step is **compare, then report, then delete** — not delete and see. Open both, and answer:

- Which one, given a PDF, stores it and shows it back after a reload? (The retired tab failed
  exactly here.)
- Which one writes something Visual identity or AI Chat already reads?
- What can A do that B cannot, and the reverse?
- Is `brand_visual.guideline_url` written by either of them, or by nothing?

Then take the page that survives, keep the capabilities the other one had, and delete the loser
along with its unused endpoints — **but not `brand_book_colors`.**

**4 · Two other orphans, already decided.**

- `/studio/brand-bases` — 85 lines of template cards with `progress: 100` hardcoded. Delete.
- Home's `More` card says *"Explore all studio tools"* and links to `/studio/code`, one image tool.
  `CLAUDE.md` names this exact pattern as the old app's worst habit. Point it at a real destination
  or remove the card.

---

## Acceptance criteria

1. The string "brand book" appears in no rendered label, heading or nav entry — asserted by a test
   over the route list's rendered text.
2. Exactly one route serves the brand guideline, and it is under `/brand/`. Any old Studio path
   permanently redirects to it, as `/studio/brand-assets` already does.
3. That route is reachable from the nav or from Visual identity — asserted by the existing
   "every page is reachable" test, extended to cover it.
4. Uploading a guideline, reloading, and returning shows the same guideline. **This is the one the
   retired tab failed.**
5. `brand_book_colors` still exists and Visual identity, AI Chat and `/api/brand-assets/upload` all
   still read or write it — asserted before and after the deletion.
6. A colour discovered by extraction is never named `Extracted`; it carries its hex and is marked as
   unnamed so it can be named.
7. `/studio/brand-bases` returns a redirect or 404, and nothing links to it.
8. No card on Home links to a page that does not do what the card says.

---

## Order

1. The comparison in decision 3, **reported before anything is deleted.**
2. Merge into the surviving page; move it under `/brand/`; redirect the old paths.
3. The `Extracted` fix. Criterion 6 — smallest change here and the only one Saara has actually seen.
4. `brand-bases` and the Home `More` card.

Step 3 could go first if the comparison takes a while. It is independent of all of it and it fixes
something visible on a page she uses.
