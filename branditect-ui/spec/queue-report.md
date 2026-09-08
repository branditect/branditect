# Queue report

Written for someone who has the specs and has not seen my screen. One entry per
item, in the order of `spec/queue.md`.

---

## 0 · Commit what was already in the tree — done, `34ed93f`

That commit was made before this report existed, which is why the report starts
here rather than covering it retrospectively in its own words.

**What it covers.** Notes step 3: images, insert and width. `lib/notes.ts`
gained `nextWidth`/`widthLabel`; `lib/brand-image-upload.ts` is new;
`components/products/image-picker.tsx` now returns `{ id, url }` rather than a
URL, with its one caller updated; the notes page gained insert, drag-drop
upload and the width toggle; `scripts/check-note-images.mjs` and the image
writer in `scripts/check-notes-race.mjs` are new.

**Criteria now asserted.** studio-notes 4, 5 and 10 — verified in a browser,
not only by unit test. Criterion 10, the merge blocker: a paragraph, an image,
a paragraph; the image deleted from Knowledge; on reload the block survived,
`image_id` was null rather than the row cascaded away, both paragraphs read
back exactly as typed, and the note said the image was gone.

**Nothing half-done in it**, with one honest gap carried into item 7 below.

---

## 1 · Ownership on every API route — done

**What I did.** Audited `app/api` rather than trusting the spec's table. The
spec says twenty-three routes; the code had **21** files importing
`supabase-admin` without importing `api-auth`, out of 38 route files and 27
that hold the service key. Every one of the 21 took a brand id. All 21 now
resolve the brand from the caller's token and use `auth.brandId` for every
query — the supplied id is checked, never trusted as the scope.

Handlers, not files, was the real unit: several routes had a guarded GET and an
unguarded POST, PATCH or DELETE beside it. 42 handler-level failures at the
start, 0 now.

**Criteria now asserted.**

- **1** — every route under `app/api` either takes no brand id or calls
  `resolveBrand` before its first query. `lib/api-ownership.test.ts` walks
  `app/api` and fails per handler.
- **2** — `scripts/route-ownership.mjs`, two real accounts, real password
  grants, real tokens, nothing mocked: nine GET routes each return **401** with
  no account and **403** for another user's brand.
- **3** — an unowned brand id and a non-existent one return the same status and
  the same body, compared byte for byte, so the response cannot be used to
  discover which brand ids exist.
- **4** — the one that matters. A test fails when a file under `app/api`
  imports `supabase-admin` without importing `api-auth`. Exemptions are a named
  list with a reason each, and a further test fails if an exemption goes stale.
  The list is currently empty.
- **5** — the comment in `numbers/route.ts` is gone, replaced by one saying
  what is true and why the old one was wrong.

The end of the chain is closed, asserted directly:
`/api/catalog?brand_id=<someone else's>` with no account no longer returns
their catalogue. And user A can still read **its own** catalogue, so that pass
is not vacuous.

**What the spec got wrong, or where the code differed.**

1. **`products/attachments` is listed as "already correct". It was not.** It
   checked ownership by comparing the product's `brand_id` to a *caller-supplied*
   brand id, so supplying both ids passed the check. Now guarded.
2. **`vault/extract` never used the brand id at all.** It works from a
   `documentId` and a `storagePath`, so any signed-in user could extract, and
   mark as errored, any document in the system. Adding `resolveBrand` alone
   would not have fixed it — the route now confirms the document belongs to the
   caller's brand and returns 404 otherwise.
3. **`mission-board` PATCH/DELETE and `templates` PATCH/DELETE take only an
   `id`.** There was nothing to check an id against, so `resolveBrand` alone
   would have been decoration. Every write is now additionally scoped
   `.eq('brand_id', auth.brandId)`.
4. Route count: 21, not 23. `zz-note` is one of the spec's 23 and is gitignored
   scratch; the remainder is a naming difference, not a missed route.

**What I had to decide.**

- `tone/route.ts` defaulted an absent brand id to the string `"default"`. That
  is now the caller's own brand. A request with no id used to read a shared
  `"default"` row; it now reads the caller's, which is the only interpretation
  that is not a shared bucket.
- 46 client call sites across 20 files moved from `fetch` to `authedFetch`.
  Routes that take no brand id — `catalog/parse`, `tone/generate`,
  `brand-guideline/edit` and `extract`, `brand-book/chat` and `color` — were
  left alone deliberately.

**Not done, and outside this item:** `/api/brand-book/color` and the other
"already correct" routes were confirmed individually as the spec asks, and are
unchanged.

---

## Test accounts to clean up

Created by me, still present at the time of writing. Everything under a `zz-`
brand; no production row was written.

| user id | email | brand |
|---|---|---|
| `b7c35a68-e7bd-4f81-a517-c992fa955a39` | `zz-doc-1788437872-6064@branditect-test.invalid` | `zz-doc-mtlhqez6` |
| `77e6b63b-7506-45ad-b146-8b324748af48` | `zz-doc-1788437645@branditect-test.invalid` | `zz-doc-mtlhlj17` |
| `012d068c-53f0-43ce-b8e8-e01e3f2a6549` | `zz-doc-1788430774-22824@branditect-test.invalid` | `zz-doc-mtldi9fp` |
| `140acf3d-8da8-40c9-be5a-614e8960ea4e` | `zz-doc-1788430710-24@branditect-test.invalid` | `zz-doc-mtldgwku` |

Four accounts from the document-upload work leaked past their own cleanup —
each run deletes the account it created, and these are the ones where a run
ended early. Every other `zz-` account created across this queue deleted itself:
the cross-tenant, route-ownership, notes and template checks all remove their
users in a `finally` block, and I confirmed the list above by enumerating
`auth.users` rather than by remembering.

`app/api/zz-note/route.ts` is **not** deleted yet — per the queue it is the
last thing before close.
