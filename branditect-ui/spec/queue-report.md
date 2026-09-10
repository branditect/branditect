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

## 2 · The loaded gun in `supabase/brand_images.sql` — done, and there were eight

**What I did.** Committed the `brand_images.sql` fix as it stood — the
discovery-based drop plus the brand-scoped policy — without redoing it, and
wrote the test the item asks for: any file in `supabase/` that creates a
`USING (true)` policy on a brand-scoped table fails the suite.

**The test found seven more files, not one.** The item names line 40 of
`brand_images.sql`. The same pattern was in:

| file | policy | tables |
|---|---|---|
| `brand_strategies.sql` | `Allow all for now` | `brand_strategies` |
| `brand_tone.sql` | `Allow all tone` | `brand_tone` |
| `brand_visual.sql` | `Allow all visual` | `brand_visual` |
| `brands.sql` | `Users can manage their brands` | `brands` |
| `catalog.sql` | `Allow all catalog`, `Allow all products`, `Allow all financial` | `brand_catalog`, `catalog_products`, `brand_financial_rules` |
| `catalog_products_v6.sql` | `Allow all product_history` | `product_history` |
| `social_strategy.sql` | `Allow all for now` ×4 | `social_strategy`, `content_pillars`, `platform_style_guides`, `social_calendar` |

All eleven policies are now a discovery-based drop and a brand-scoped policy —
`user_id = auth.uid()` for `brands`, which is keyed by user rather than brand.
**None of it has been run**, per rule 1. These are files, and the live database
was already closed by `close-rls-2.sql` and `close-rls-3.sql`; the risk was
re-running one of them.

**Two things worth knowing beyond the item.**

`supabase/social_strategy.sql` (underscore) and `supabase/social-strategy.sql`
(hyphen, written for queue item 5 of the previous ordering) both define
`social_strategy`, with opposite intentions — one opened it, one scopes it.
Two files, one table. Somebody should delete one, and I have not, because
deleting a file is outside rule 2 and the choice is not mine.

`content_pillars`, `platform_style_guides` and `social_calendar` are not read
or written anywhere in `app/`, `lib/` or `components/`, which is why
`scripts/cross-tenant.mjs` never checked them — its table list comes from a
grep of the application. A table nothing uses is still a table anyone can read.
Their RLS state on the live database is **unverified**.

**The storage half stays below the line**, untouched. A test asserts the
`DO NOT RUN YET` marker is there, that it says *why*, and that no `storage.*`
statement sits above it.

**A control caught my own assertion being too narrow.** It checked for
`storage.objects` only, so moving `UPDATE storage.buckets SET public = false`
above the line passed. The statement that actually breaks every image in the
app is the bucket one. Widened, and it fails now.

**Criteria now asserted.** Item 2 in full: the world-open policy is replaced,
and a test fails if any file in `supabase/` reintroduces one on a brand-scoped
table.

---

## Inbox 1 · Item 2 missed two files, and the criterion is why — done

**What I did.** Fixed `supabase/brand_guideline.sql` and
`supabase/product_specs.sql`, and widened the guard so the shape of a table no
longer decides whether it is inspected.

**The criterion was the bug, and the entry is right about why.** Item 2's test
looked for `USING (true)` *on a table with a `brand_id` column*.
`product_specs` has no `brand_id` — it scopes through
`product_id → catalog_products(id) → brands` — so the guard skipped it by
construction and would have skipped the next table shaped that way. That is the
same failure as the storage assertion that only checked `storage.objects`.

The guard now flags **any** `CREATE POLICY … USING (true)` in `supabase/`, on
any table, with an allowlist for anything genuinely public. The allowlist is
empty, and a test fails if an entry in it goes stale.

**The join was verified, not assumed.** The entry warned that `brands.id` is a
UUID and `brands.brand_id` is TEXT and the two have been confused before. I
probed the live database rather than trusting the warning or my memory:

| column | type |
|---|---|
| `product_specs.product_id` | UUID — rejects text |
| `catalog_products.id` | UUID |
| `catalog_products.brand_id` | TEXT |
| `brands.brand_id` | TEXT |
| `brands.id` | UUID — rejects text |

So `JOIN brands b ON b.brand_id = p.brand_id` is TEXT to TEXT and
`product_id IN (SELECT p.id …)` is UUID to UUID. A test fails if it is ever
rewritten to join `brands.id`.

**Negative control, as instructed.** A `USING (true)` policy on a table with no
`brand_id` — the exact shape the old criterion could not see — turns the suite
red. Three more with it: the policy back on `product_specs`, the join switched
to `brands.id`, and `brand_guideline` reopened. All four red, all four restored.

**Neither file has been run.** Rule 1.

Inbox entry 1 is marked DONE in place.

---

## 6 · Notes step 3 — REOPENED, criterion 5 was not met

**What was wrong.** Text could never run beside a half-width image, and both
tests passed anyway because neither looked at layout.

- Every block was wrapped in `<div key={b.id ?? i}>`, so the figure floated
  inside its own wrapper and the next paragraph was a sibling below it.
- `.body` was `display: flex`, and floats do not apply to flex items at all.
- The unit test read the CSS file as a string and asserted `float: left`
  appeared in the `.half` rule.
- The browser probe read `getComputedStyle(figure).float`, which returned
  `left` truthfully — the figure's parent was the wrapper, not the flex
  container.

**The new assertion measures rectangles**: insert a half-width image, put a
paragraph after it, and assert the paragraph's top is above the image's bottom
and its left is right of the image's right edge. It was run against the
unfixed code first and failed — text top 518 against image bottom 500, text
left 595 against image right 999, width 404px.

**Fixed.** The figure and the textarea are keyed directly and the wrapper is
gone; `.body` is `display: block` with margin spacing; `.half` is a fixed 250px.
One more change was needed that the brief did not name: a full-width block box
overlaps a float — only *line* boxes shorten around one — so `.block` moved from
`width: 100%` to `width: auto; overflow: hidden`, which gives it its own
formatting context. Without that the text still sat below.

Now measured: text top 209 against image bottom 416, text left 886 against
image right 870, 250px.

**Styling, against `reference/studio-notes.html`.** Both columns are white
panels, 18px radius with the panel shadow, on the page background; the rule
down the middle is gone. The body is a document — 15px at 1.7, max-width 760px,
headings 17px with space above — not a stack of bordered textareas. The
duplicate `.imageBlock` rule is removed. Real `pin` and `more` icons were added
to `components/icon.tsx`; the toolbar had been rendering a target for Pinned
and an arrow for More because neither glyph existed.

**Two things I had to decide.** Removing the ＋ Paragraph button left an empty
note with nothing to type into, so a note now opens with one empty paragraph
ready. And Return only worked from the last block, which meant a picture could
never have a paragraph after it — Return now inserts after the current block,
and an image inserts at the cursor rather than at the end. Both are how a
document behaves, and criterion 10 needs text on both sides of an image to be
reachable at all.

**Criteria now asserted.** 4, 5 and 10, all measured in a browser. The two
string-reading assertions are replaced: what remains in `notes.test.ts` checks
only the structure that makes the layout possible — no wrapper element, `.body`
not flex, `.block` not full-width — which is something a string search can
answer honestly.

---

## Inbox 2 · Prompt caching — done, and the API's own numbers are below

**Confirmed as described.** No `cache_control` anywhere in `app/api` or `lib`.
All eight routes passed `system` a plain string, so nothing has ever been
cached. Nothing errors when you do that — you simply pay full input price
forever, which is why it survived this long.

**`lib/prompt-cache.ts`** builds the array. **`lib/prompts.ts`** now holds every
system prompt in the app, one file, moved verbatim: a script sliced the seven
existing literals out of the routes and a byte-for-byte comparison confirmed
they came across unchanged before the originals were deleted. All eight routes
call the helper.

### The split, and why copy-architect changed

`cachedSystem(stable, varying)` takes the two halves separately and assembles
them itself. A caller never holds them concatenated, so it cannot put them in
the wrong order. The per-request half is a `PerRequestBlock` object rather than
a string, so gluing it onto the prefix produces a visible `[object Object]`
instead of a silent doubling of the bill.

`app/api/copy-architect/route.ts` is the one route whose prompt changed shape.
The brief — `WRITE: 3 separate drafts of a long-form email`, the length, the
chosen product — used to sit between "You are the copywriter for X" and the
brand sources. That is a per-request string at the front of a five-thousand
token prefix: it would have invalidated the entry on every single call and
turned caching into a pure loss. The brief is now a second, uncached block after
the brand sources.

Everything else is byte-identical to what it sent yesterday.

### Criterion 2 — measured, not asserted from the source

`npm run cache:probe` sends the real system arrays, built by the real builders,
to the real API and reads the counters back. Four calls per route: a write, an
identical call that must read, a call where only the per-request block changed
that must still read, and the same call with `cache_control` stripped that must
read zero.

```
model claude-sonnet-5 · ttl 1h

CACHES         andy                  wrote 4879, read 4879; control read 0
CACHES         copy-architect        wrote 5123, read 5123, 5123 on a different brief; control read 0
CACHES         generate-prompt       wrote 2072, read 2072; control read 0
CACHES         brand-strategy        wrote 1651, read 1651; control read 0
BELOW-MINIMUM  tone-generate         872 input tokens, under the 1024 Sonnet needs
BELOW-MINIMUM  catalog-parse         863 input tokens, under the 1024 Sonnet needs
BELOW-MINIMUM  brand-code-architect  757 input tokens, under the 1024 Sonnet needs
BELOW-MINIMUM  vault-extract         99 input tokens, under the 1024 Sonnet needs
```

The stripped-`cache_control` control is the part that makes the rest mean
anything: without it, `read > 0` could be a counter that is never zero.

**Four of eight routes cache, not eight.** Sonnet caches nothing below 1024
tokens, and four of these prompts are shorter than that. `cache_control` on
them is inert — no write premium, no error, no saving. They go through the same
helper for uniformity, and their log line will read `hit=n/a` forever, which is
the honest signal rather than a 0% that looks like a fault. Anything that grows
one of them past 1024 tokens starts caching with no further change.

**The four that cache are the four that matter.** They are AI Chat, Studio ▸
Write, Studio ▸ Create images and Brand ▸ Strategy — everything a founder uses
repeatedly. The four that do not are one-shot ingestion: parse a catalogue,
extract a PDF, read a screenshot.

### The 1-hour TTL needs no beta header

The entry expected one. It does not: `ttl: "1h"` is accepted on the plain
Messages API, measured on 2026-09-10 against `claude-sonnet-5` with
`@anthropic-ai/sdk` 0.81.0 and `anthropic-version: 2023-06-01`. The write came
back as `cache_creation.ephemeral_1h_input_tokens: 2404` and the second call as
`cache_read_input_tokens: 2404`. One hour is chosen over five minutes because
an expired entry costs *more* than not caching — a miss pays 1× to re-read and
1.25× to re-write — and a founder coming back to a draft twenty minutes later
is a normal thing to do, not an edge case.

### Criterion 3 — the counters are logged per call

Every route prints one greppable line: `[cache] andy write=0 read=4879
uncached=214 hit=100%`. Streaming routes take theirs from `message_start`,
which is where a streamed call reports usage. A prompt too short to cache logs
`hit=n/a` rather than `hit=0%`.

### Criterion 4 — nothing per-request in the cached block

`lib/prompt-cache.test.ts`, 42 assertions, run in `npm test` (989 total, all
green). The load-bearing ones build the full system array twice for one brand
with two different briefs and assert block 0 is byte-identical while block 1
differs; assert `lib/prompts.ts` contains no `Date`, `Math.random`,
`performance.now` or `randomUUID` with comments stripped first; and walk every
route asserting none passes a string, none concatenates inside the
`cachedSystem(` call, and none has stopped logging.

Eight negative controls, each applied to working code and reverted:

| control | result |
|---|---|
| a clock inside the cached prefix | red |
| `cache_control` on the per-request block | red |
| per-request concatenated inside the helper | red |
| one route back to a plain string | red |
| one route stops logging | red |
| `andyStable` ignores its brand context | red |
| a route glues a varying string onto the prefix | red |
| the house style dropped from a stable prompt | red |

**One claim I made and then had to withdraw.** I wrote that the object type
makes `copyStable(x) + copyPerRequest(y)` a compile error. It is not —
TypeScript permits `+` between a string and an object. I found that by running
`tsc` against the broken version rather than by reasoning about it, and the
comment in `lib/prompt-cache.ts` now says so. The test is what catches it.

### Two things not done

**`claude/unit-economics.md` is not in this repo** — no file of that name
exists anywhere under it. I have not created one, because a second copy of a
doc whose canonical version lives in the project is exactly the drift this
codebase keeps getting bitten by. The numbers above are the ones for the note
at the top of it.

**`next build` was not run.** A dev server was listening on port 3000 and
CLAUDE.md forbids building underneath one. Instead: `tsc --noEmit` clean across
the project, `next lint` clean on `app` and `lib`, 989 tests green, and all
eight changed routes exercised through the running dev server — each returned
its own handler's 401 or 400 rather than a compile error, and
`/api/brand/generate-prompt` returned a real 200 with the cached array in
flight.

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
