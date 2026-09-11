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

## Inbox 3 · Finnish — four of five parts done, and the fifth is bigger than the entry thinks

**Everything except the extraction is built and tested. The extraction is four
files of sixty-four, and the reason is a measurement, not a shortfall of
effort: the dictionary does not cover the interface.**

### What is done

**1 · `supabase/brand-language.sql`** — the two columns, `IF NOT EXISTS`, with
the reasoning for two rather than one kept in the file. **Written and not run,
per rule 1.** Every reader in the app defaults to `en` independently, so the
interface is correct before it is run as well as after; nothing waits on it.

**2 · `forLocale`** — `lib/onboarding-locale.ts`. Question number, track and
language in; one resolved question out. The fallback is **per field**: a
question with a translated prompt and an untranslated example shows the prompt
in Finnish, rather than throwing the whole question back to English. A question
in `QUESTIONS` and not in `QUESTIONS_FI` renders in English and does not throw.

It is not "beside `forTrack`" as the entry asked, and that is deliberate. If
`onboarding-questions.ts` imported the Finnish overlay, adding a third language
would mean editing the structure file — the dependency that lets two tables
start defining the same thing. Neither table imports the other; the new file
imports both.

**3 · The language switch** — `components/language-switch.tsx`, in a new
`/settings` page and on the onboarding welcome screen, before the twenty
questions rather than after them. It writes a cookie *and* the column. The
column does not exist yet, so the database write is allowed to fail and the
switch still works: the interface changes and the panel says plainly that the
choice is on this browser only. What it never does is change the language and
claim to have saved it.

**4 · The rubric, suspended by field** — `lib/tone-rubric.ts`. The inbox said
"suspend it for any brand whose `output_language` is not `en`"; `spec/finnish.md`
section 2 says an earlier draft said exactly that and it is too blunt, because
half the rubric is rhetoric and punctuation and holds in any language. I
followed the spec. Suspended: `sentence_words_avg`, `sentence_words_max`,
`sentences_per_para`, `contractions`, `banned_words`, `adjective_stacks`,
`cta_max_words`. Still enforced in Finnish: fragments, hedging, exclamations,
emoji, the em and en dash, markdown, banned constructions.

Each suspended field reports as suspended with its reason, never as passing.

**`cta_max_words` is mine, and it contradicts the spec's table.** The table
lists `cta_style` as surviving translation, and the style does — a bare
imperative is a bare imperative in any language. But the only part of it that
is mechanically checked is a word count, and word counts are exactly what
agglutination breaks. The test found it, not me reading the table.

### What is NOT done: the extraction, and why

Four files are extracted: `components/sidebar.tsx`, `components/account-menu.tsx`,
`components/language-switch.tsx`, `app/(app)/settings/page.tsx`, plus `lib/nav.ts`
which now carries a `key` beside every `label`.

**Sixty of sixty-four files are not, and the dictionary is the reason.**
Measured against the real files on 2026-09-10:

| | |
|---|---|
| User-facing literals in scope | **2,107** |
| Distinct strings with **no key at all** | **1,276** |
| `en` keys whose value appears verbatim in the code | **150 of 500** |

The entry says "The keys were derived from the real strings in those files, so
they should match what you find." Against most screens they do not.
`app/(app)/brand/channels/page.tsx` has sixty-nine user-facing strings and one
key. `BrandBookClient.tsx` has two hundred and seventy-five and one.

Finishing as specified would mean writing something over a thousand strings of
Finnish myself, which the entry forbids in the same paragraph that asks for the
extraction. So I stopped at the boundary and made the boundary legible instead
of guessing.

**`branditect-ui/spec/i18n-gap.md`** is generated by `npm run i18n:gap`: every
one of the 1,276 strings, grouped by the screen it appears on. Nothing is
truncated — a list that stopped at the first hundred would read as the whole
job. That file is what comes back through the inbox translated, and the
extraction is then mechanical.

### The check is two-sided, because a one-sided one would be a lie here

`lib/i18n-scope.ts` holds `EXTRACTED` and `OUTSTANDING`. Every extracted file
must scan clean, **and** the set of files that still hold English must equal
`OUTSTANDING` exactly. A new English screen fails because it is not on the
list; an extracted file fails until it moves lists. Criterion 2 of the entry
— every `en` key used at least once — cannot hold while 350 keys have no
matching string, so the suite records the size of the gap rather than
pretending it is zero.

### Two scanner bugs the negative controls found

**The scanner only looked between tags, and most of the interface is not
there.** The first version blanked every `{…}` expression and read what was
left. It found 207 strings. The wider scan finds 2,107. A check reporting 207
as "all of it" is the same shape as the CSS assertion that read the stylesheet
as text.

**Then the between-tags half stopped working entirely.** Blanking braced
expressions innermost-outwards deletes the component body, because a function
body *is* a braced expression, and a short component vanished whole. The
control that caught it: putting a bare `Pro plan` back between the tags of an
extracted file left the suite green. It now rejects captures containing a brace
instead of erasing them.

Twelve negative controls, each applied to working code and reverted:

| control | result |
|---|---|
| a Finnish key deleted | red |
| settled terminology changed (`Tieto` → `Tietämys`) | red |
| a blank string in `fi` | red |
| the overlay starts defining structure (`n:` on a question) | red |
| the word-count rule un-suspended for Finnish | red |
| English back into an extracted file, as JSX text | red |
| English back into an extracted file, as an attribute | red |
| a new English screen nobody listed | red |
| a new English screen, string in a prop | red |
| a file quietly dropped from `OUTSTANDING` | red |
| the scanner narrowed back to quoted strings only | red |
| a placeholder dropped from a Finnish string | red |

### One bug that rendered fine and was wrong

`LOCALE_COOKIE` started life in `lib/i18n/use-t.tsx`, which is `"use client"`.
A client module's exports reach a server component as client-reference proxies
rather than as their values, so `cookies().get(LOCALE_COOKIE)` was looking up a
proxy object and finding nothing. Every page rendered, nothing threw, and the
whole app was English with `bd_locale=fi` sitting in the request. Found by
printing the resolved locale into the page — reading the code would not have
shown it. The constant now lives in `lib/i18n/index.ts`.

**Verified in the browser, not asserted:** `curl -b "bd_locale=fi" /settings`
returns Etusivu, Brändi, Tieto, Laskurit, Asetukset and Käyttöliittymän kieli;
without the cookie the same page returns Home, Knowledge, Numbers, Settings and
Interface language.

### Thirteen keys I added, listed so nobody assumes they were reviewed

The entry says to add a missing key to both files and say so. These are mine,
and the Finnish in them has not been through the design side:

`settings.breadcrumb`, `settings.title`, `settings.language`,
`settings.languageIntro`, `settings.interfaceLanguage`,
`settings.interfaceLanguageHelp`, `settings.languageSavedLocally`,
`sidebar.workspace`, `accountMenu.profile`, `accountMenu.settings`,
`accountMenu.help`, `accountMenu.logOut`, `accountMenu.signingOut`.

They follow the rules in the `fi.ts` header — written form, singular *sinä*,
none of the six machine-written tells — but they are the one part of that file
I wrote and they should be read.

### Three things flagged rather than changed

**The Finnish onboarding file is complete.** My first coverage check said two
of twenty questions were short. It was wrong: Q18 and Q19 carry `ex: ""` on
every track in the English table, so an overlay that omits them is complete
rather than partial. The check now ignores an English field that is empty. No
change was made to the Finnish.

**`lib/i18n/.add-en.txt` and `.add-fi.txt`** are in the working tree, 189 keys
each, and every one of them is already in `en.ts` and `fi.ts`. They look like
scratch from generating those files. I have not committed them and have not
deleted them — rule 2.

**`output_language` is stored but never asked.** The column exists in the
migration and the rubric reads it, but nothing in onboarding asks "what
language should we write in?" and no generation route states the language
explicitly. That is section 1 of `spec/finnish.md`, not item 3 of this entry,
so I have not built it — but a column nothing writes is worth naming.

---

## 3 · Private buckets and signed URLs — app code done, SQL written, **the flip is blocked and should be**

The merge blocker is doing its job. `npm run storage:audit` is red on four rows,
and until it is green no bucket can go private without breaking them.

### The spec's three buckets are not the four that exist

Measured against the live project rather than read off the spec:

| bucket | state | in the spec? |
|---|---|---|
| `brand-images` | **public** | yes |
| `brand-assets` | **public** | yes |
| `brand-reference-images` | **public** | **no — named nowhere** |
| `brand-documents` | private | no, and already correct |
| `brand-logos` | **does not exist** | yes |

`brand-logos` is in the spec and is not there. `app/onboarding/page.tsx:148`
uploads a founder's logo to it and discards the error, so that upload has been
failing silently since it was written. The logos that do exist arrived through
`/api/brand-assets/upload`, which writes to `brand-assets`. Creating the bucket
is not the fix; deleting the dead upload path is, and that is app code rather
than this item.

`brand-reference-images` is public, holds objects, and appears in no spec and
no code. It is covered by the migration rather than left alone: a bucket nobody
is watching is the one that stays open.

**Criterion 1 is asserted the way the spec asks** — a real object fetched with
no credentials at all, not the bucket's config flag. Both public buckets return
`200` today.

### Two more loaded guns, and the entry-1 guard could not see them

`supabase/brand_visual.sql` and `supabase/brands.sql` created policies of this
shape:

```sql
CREATE POLICY "Allow brand-assets reads" ON storage.objects
  FOR SELECT USING (bucket_id = 'brand-assets');
```

That names no user. Any signed-in person could read — and for `brand-assets`,
**update and delete** — every object in the bucket: 43 brand book pages, 15
logos, 5 template thumbnails and a guideline PDF, across every tenant.

It got past inbox entry 1's guard because the text is not literally `USING
(true)`. Both files also created their buckets **public**.

Worse than being open on its own: RLS policies are PERMISSIVE and **OR'd**, so
re-running either file after `private-buckets.sql` would sit an unscoped policy
beside the scoped one and defeat it, invisibly to a policy-reading audit. That
is inbox entry 1's failure again, one layer down.

Both files now create their buckets private and **drop** the open policies
rather than creating them. The scoped policies live in one file.

**The guard is widened from a word to a rule.** Not "does it say `true`" but:
every `CREATE POLICY … ON storage.objects` in `supabase/` must reference
`auth.uid()`; no file may create or flip a bucket to public; and the two files
that make a bucket private must carry the `DO NOT RUN YET` line with its
reason. Nine negative controls, all red.

### Criterion 3, the merge blocker: 4 rows would break

Eight columns across seven tables hold a public storage URL. They were found by
reading every table and scanning every string column, not by grepping the code
— two of them are written by routes that name no bucket near the insert.

```
table.column                      urls  parsed  prefix  exists  signed
brand_images.file_url              114     114     112     114       0
catalog_products.image_url          10      10      10      10       0
brand_book_pages.file_url           43      43      43      43       0
brand_logos.file_url                15      15      15      15       0
brand_templates.thumbnail_url        5       5       5       5       0
brands.logo_url                      3       3       2       3       0
brand_visual.guideline_url           1       1       0       1       0
mission_notes.content                3       3       3       3       0
```

Every URL parses and every one resolves to an object that exists. The failure
is the **prefix**, which is what the storage policies scope on:

- `brand_images` ×2 — `vetra/web/…`, the slug from before the `-6zc3` suffix.
- `brands.logo_url` ×1 — `logos/primary-logo-…`, a shared namespace with no brand in it.
- `brand_visual.guideline_url` ×1 — `guidelines/small Sorbify…`, the same.

**The five template thumbnails are not in that list, and nearly were.** They sit
under the brand's **UUID** rather than its slug — the same UUID-against-TEXT
confusion that made templates render nowhere until `brand-templates-key.sql`.
The objects are still on disk under the UUID, so the policies accept both keys.
A policy that took only the slug would have hidden five thumbnails on the day
the bucket went private, and nothing would have said so.

`scripts/storage-remediate.mjs` moves the four, copy-then-verify-then-update
then optionally remove — never move-then-update, because a move that succeeds
beside an update that fails leaves a row pointing at nothing. **It has not been
run.** The dry run lists exactly those four.

### `mission_notes.content` has no column that would help

Three notes have an image URL **inside prose**. There is no `storage_path`
column that fixes that — the cell is text with a markdown link in it. They are
in the registry with `pathColumn: null` and a reason, and a test fails if that
reason is ever dropped. Flagged, not migrated.

*(My first audit reported these three as pointing at objects that do not exist.
That was the audit: `\S+` swallowed the markdown closing bracket. The rows are
fine.)*

### The app code, which is safe to ship now

`lib/storage-paths.ts` is the **one** parse. It was
`split("/brand-images/")[1]` inline in `image-library.tsx` and again in
`file-library.tsx` — one per bucket, which is the shape that goes wrong when a
third bucket appears. Both call it now.

`lib/signed-url.ts` prefers `storage_path` and falls back to the stored
`file_url`, so it is correct **before** the migration (no column, public URL,
returned unchanged), **during** (path present, bucket still public, signed URL
works anyway) and **after** (bucket private, signing is the only thing that
works). Nothing has to be timed.

**Criterion 5 is a counted assertion, not a claim:** a fake signer records its
calls, and forty images produce **one**. The batch keeps the array the same
length and order — a caller zipping a shorter array back onto its rows would
shift every image by one, which looks like the grid working and shows the wrong
picture for every product.

**Criterion 4** — no signed URL is ever written to a table — is asserted twice:
a source check that no insert or update takes its value from a signing call,
and the live audit, which reports `signed = 0` on all eight columns.

### What is NOT done, and why

- **Nothing was flipped.** Rule 1, and criterion 3 is red anyway.
- **Criterion 2** (every image renders after the switch) and **criterion 6** (a
  second account cannot read across the prefix) cannot be asserted before the
  flip. `scripts/cross-tenant.mjs` is the place criterion 6 goes; it needs a
  storage arm added once the buckets are private.
- The four blocking rows are **not fixed**. Fixing them writes to production
  storage, which rule 2 puts out of reach. The script is written and dry-run.

---

## Inbox 4a · The work list was 40% source code — fixed, with the control it asked for

**Confirmed, and worse than reported.** 409 of the 1,276 entries were raw JSX,
not 375. The list is now **744 distinct strings across 58 files**, which sits
where the entry estimated it would.

### The cause, which was not the obvious one

It was not a weak filter. **One apostrophe in ordinary JSX text desynchronised
the entire scan.** The literal scanner paired quotes left to right, so
`you don't have to ask anyone` opened a string at the apostrophe that closed at
the next apostrophe further down the file — and from there every quote was off
by one. What it reported as "strings" from that point on was the code *between*
two real strings: `> <div className=`, `); setScreen(`, `: isActive ?`.

That is why the fragments came in runs rather than one at a time, and why they
were concentrated in the long screens.

Both halves are fixed:

- **An apostrophe only opens a string where a string can start** — after `=`,
  `(`, `,`, `:`, `[` or whitespace. `don't` no longer opens anything.
- **`isSourceFragment` rejects what is still recognisably code**: anything
  carrying `<`, `>`, `{`, `}`, an operator, a React identifier, or starting or
  ending mid-expression.

Two smaller ones found on the way out:

- **Class lists with arbitrary values read as copy.** `bg-[#FFF2EE]` and
  `drop-shadow-[0_5px_10px_rgba(232,73,32,.3)]` failed the old charset, so the
  whole string fell through to the list. Widening the charset alone then went
  too far and swallowed `One check left: upload your brand guideline.` — a
  sentence with a colon in it. It now needs a Tailwind-shaped token *and* most
  of its words carrying a class separator, which a sentence does not have.
- **`\'` reached the list as a backslash.** A translator would have copied
  `you\'re` into the Finnish. Escapes are unescaped now.

**And one rule I had to delete rather than tighten.** `starts with a digit` was
in the technical list. `124 of 6 required` is real sublabel copy — CLAUDE.md
names that exact shape as what sublabels must carry. Only a string that is
*nothing but* a number is configuration now.

### The negative control the entry asked for

A file was added with a class list, a `{…}` ternary, an `onClick` arrow, a
`useState` call, JSX text containing an apostrophe, and four real strings —
including one in an `aria-label` and both branches of a ternary.

Regenerated:

```
## app/(app)/zz4a/page.tsx

- Zebra control panel
- Zebra opens the drawer
- Zebra collapsed view
- Zebra expanded view
```

Four real strings in, zero source fragments anywhere in the file — and the
apostrophe text did not eat the strings after it. The file was removed and the
list regenerates **byte-for-byte identical** to before it existed.

Six assertions cover it in `npm test`, including one that reads the committed
`i18n-gap.md` itself and fails if any entry is a fragment — which is the check
that would have caught this in the first place.

### The numbers these replace

`OUTSTANDING` in `lib/i18n-scope.ts` is regenerated: **1,514 literal
occurrences across 62 files**, 744 of them distinct and unkeyed. The figures in
the Inbox 3 entry above — 2,107 and 1,276 — were measured with the broken
scanner and are superseded by these. I have left that entry as written rather
than editing it, so the record shows what was believed at the time.

---

## Inbox 4b · `output_language` is asked, stated and proved to change the output

The entry is right that this is the half that matters, and it is done except
for the part the unrun migration blocks.

### Asked, once, in onboarding

A fourth step in `/start/profile` — *"What language should we write in?"*,
English or Suomi. Four taps, no typing, same as the other three.

It is a **separate question from the interface setting**, which stays in
Settings, and it writes a **separate column**. A founder who has read English
software for fifteen years may well want English on screen and Finnish in the
copy, because Finnish is what her customers read. One shared value forces a
wrong answer on half of them, and a test fails if onboarding ever writes both
from one answer.

The answer goes to `brands.output_language` **and** into the onboarding profile.
The column does not exist until `supabase/brand-language.sql` is run, so that
write is allowed to fail; the profile keeps the answer either way and every
reader defaults to English until the column is there.

`Profile.output_language` is **optional and not part of the gate**. It arrived
after brands existed, and gating a founder's workspace on a question she was
never asked is a regression, not a feature.

### Stated, not inferred

`lib/output-language.ts` is the one place. `outputLanguageFor(client, brandId)`
reads the column and returns English on every failure path — no brand, no
column, an unknown value, a throw. `languageDirective(locale)` returns the line
that goes into the prompt.

Wired into **`/api/andy`** and **`/api/copy-architect`**: the two routes that
write brand copy and know which brand they are writing for.

**English gets no directive at all**, and that is deliberate rather than lazy.
Every one of these prompts was written and tuned against English; adding "write
in English" to a prompt that already produces English changes the cached prefix
for every existing brand and buys nothing. A test pins it both ways.

The directive sits in the **cached** block, not beside the request. It is brand
state and byte-stable per brand, so it costs nothing there — and a test fails if
it moves, because a per-request directive would write a new cache entry on every
call.

Two details in the directive that are load-bearing:

- **"that is the material, not the instruction."** The brand's own vault is
  usually English. Without that sentence the model treats the sources as a
  signal about language and hedges.
- **JSON keys stay English.** Several of these routes parse their own output. A
  translated `drafts` key comes back unparseable and reads as the model failing.

### Asserted end to end, and honest about which end

`npm run lang:probe` builds the real system prompt with the real builders, sets
the language each way, and sends both to the real API with an **English** brand
context:

```
output_language = en  ->  EN (en markers 4, fi markers 0)
  The 20 litre granule from ZZ Probe absorbs 12 times its own weight, enough to
  clear a spill before the shift ends. 42.00 EUR.

output_language = fi  ->  FI (en markers 0, fi markers 9)
  Vuoto sattuu aina kesken vuoron. ZZ Proben 20 litran rae imee 12 kertaa oman
  painonsa nesteestä, ja lattia on siisti ennen työpäivän loppua. Hinta 42,00 euroa.
```

Language is classified by two independent signals that must agree — Finnish
letters and function words, English stopwords. Letters alone would call an
English sentence with a Finnish product name Finnish; stopwords alone would call
a Finnish sentence quoting an English spec English.

**What it is not:** it does not go through the HTTP route with a signed-in
brand, and it cannot. `output_language` does not exist as a column, so there is
no way to set a brand to `fi`. That half is blocked on the migration, not on
effort — and it belongs in `scripts/route-ownership.mjs`'s shape once the column
is there: a seeded `zz-` brand, a real token, a POST. The probe says so in its
own header, and a test fails if that admission is ever deleted.

### The two routes not wired, and why

`/api/brand-strategy` and `/api/tone/generate` also produce brand copy and are
**not** wired. Neither resolves a brand — they read the request body and nothing
else, so there is no brand id to look the language up from. That is an ownership
gap as much as a language one, and fixing it means giving them `resolveBrand`
first. Named here rather than half-done.

`/api/catalog/parse` and `/api/vault/extract` are extraction, not writing, and
`/api/brand-code-architect` emits HTML. None of them should state a language.

### Nine negative controls, all red

| control | result |
|---|---|
| English gets a directive too | red |
| the directive stops overriding the sources | red |
| JSON keys get translated too | red |
| an em dash back in the directive | red |
| an unknown language stops meaning English | red |
| the directive moves to the per-request block | red |
| a route stops asking | red |
| onboarding stops asking | red |
| onboarding conflates the two settings | red |

The em-dash one is not fussiness: prompt rules leak, and `HOUSE_STYLE` bans the
em dash two paragraphs above where my directive originally used one.

---

## Inbox 5a · The migration was run, and the probe was still saying it was not

**You were right, and the admission was the smaller half of it.** The claim was
in eight files, not one.

### The column is there

Read straight off the live database rather than from the entry:
`brands.output_language` and `brands.interface_language` both exist, both
default to `'en'`, and every brand row carries them. So the half entry 4b
correctly refused to claim is provable, and now is.

### `npm run lang:probe` has a second phase

Phase 1 is unchanged — the real builders, straight to the API, proving that
stating the language changes the output. Phase 2 is the one that was missing:

- a seeded `zz-lang-…` user, a real password grant, a real bearer token
- a seeded brand with **English** material — a product with a description,
  `ideal_client` and a price, in the columns `buildBrandContext` actually reads
- `output_language` flipped on the brand row between the two calls, and
  nothing else changed
- a real `POST /api/copy-architect`, classified by the same two-signal test

Both directions pass. The English call comes back English, the Finnish call
comes back Finnish, from the same English brand material:

```
PASS  POST /api/copy-architect with output_language='en' -> EN — en markers 7, fi markers 1
      Granule 20L is an industrial absorbent built for spills that cannot wait...
PASS  POST /api/copy-architect with output_language='fi' -> FI — en markers 0, fi markers 16
      Granule 20L on teollisuuskäyttöön suunniteltu imeytysrae. Se imee...
```

The user, brand and product are deleted in a `finally`, and I confirmed by
enumerating rather than trusting it: zero `zz-lang-` brands, products or
accounts left.

**Three things in phase 2 exist only so it cannot pass vacuously**, which is the
failure this probe is most exposed to — every one of them ends with the reply
in English, which is also what a broken directive looks like:

1. It checks the two columns exist before it trusts anything. A missing column
   makes `outputLanguageFor` return `"en"`, so the `fi` call would come back
   English and read as a broken feature rather than a missing migration.
2. It reads `output_language` back after setting it, so an update that quietly
   matched no rows is reported as itself.
3. It checks the seeded product is readable through `buildBrandContext`'s own
   column list. My first version inserted `price`, which that builder does not
   read — the route got no material and answered "there are no confirmed
   details" in two languages. That classified correctly and proved nothing.

### The admission is gone, and so is the test that guarded it

`lib/i18n.test.ts` no longer asserts the probe says what it cannot do. It
asserts the opposite: that the probe POSTs to the route, sends a bearer token,
sets the column, and no longer carries the sentence.

**That assertion was wrong twice before it was right**, both times in the way
this queue keeps finding:

- It matched `/api/copy-architect` anywhere in the file, and the probe's own
  header names the route. Pointing the `fetch` elsewhere left it green.
  Comments are stripped now.
- With comments stripped it still matched two `console.log` strings that name
  the route. It matches the `fetch` call itself now.

Found by running the control, not by reading the assertion.

### The same stale fact in seven other places

Nothing went red when the migration ran, and nothing would go red if it were
reverted, because every reader defaults to English on its own. That is correct
behaviour and it is exactly why the prose drifted unnoticed.

| file | what it said |
|---|---|
| `lib/output-language.ts` | "written and not run, so today this always returns en" |
| `lib/useBrand.ts` | "both undefined until brand-language.sql is run" |
| `lib/i18n/index.ts` | "the column does not exist until…" |
| `lib/i18n/use-t.tsx` | "undefined until brand-language.sql is run" |
| `app/api/andy/route.ts` | "while brand-language.sql is unrun and the column does not exist" |
| `app/start/profile/[step]/page.tsx` | "this write is allowed to fail" |
| `components/language-switch.tsx` | "the column does not exist yet" |

All corrected, and a test now fails on any **present-tense** claim that
`brand-language.sql` is unrun. Past tense passes: a file recording why a check
used to be weaker is history, not a claim, and a guard that cannot tell those
apart gets loosened until it stops working. It skips `lib/i18n.test.ts`, which
would otherwise flag its own test name.

### Two behaviour changes that came out of the prose, not with it

Both were code written to be correct while the column was missing, and both are
the discarded-`{ error }` shape entry 5c names.

- **`app/start/profile/[step]/page.tsx`** discarded the result of the
  `output_language` write, deliberately, because the column might not exist.
  It does. The error is logged now rather than dropped. The answer is still
  kept in the onboarding profile, so this does not block the step — a visible
  error state for it is not built, and I have not built one here.
- **`components/language-switch.tsx`** had an `isMissingColumn` helper that
  relabelled a failed write as "saved in this browser". That branch now guards
  nothing and would hide a real write failure behind a reassuring note, so it
  is deleted. The browser-only note survives for the case that is still real —
  no brand row yet — and any other error surfaces as an error.

`settings.languageSavedLocally` said "It will follow your account once language
settings go live", which is no longer true. **Both strings are rewritten and the
Finnish is mine, unreviewed** — same standing as the thirteen keys in the Inbox 3
entry:

- en: "Saved in this browser only. There is no brand on this account yet to save it to."
- fi: "Tallennettu vain tähän selaimeen. Tällä tilillä ei ole vielä brändiä, johon valinnan voisi tallentaa."

### Controls

| control | result |
|---|---|
| the route ignores the column (`outputLanguageFor` pinned to `en`) | phase 2 `fi` red |
| the probe's `fetch` pointed at another path | red |
| the admission sentence put back in the probe | red |
| a present-tense "written and not run" put back in `lib/output-language.ts` | red |
| a column that does not exist, to prove the column guard is not inert | errors as required |

1089 tests, all passing. `npx tsc --noEmit` is clean apart from six
pre-existing `--target` errors in unrelated test files.

---

## 4 · Account deletion that actually deletes — done

`POST /api/account/delete`, a panel at the foot of Settings, and two probes.
All seven criteria met, with one substitution and one criterion that had
nowhere to land. Both are below.

### What it deletes, and how it knows

Storage first, rows second, the auth user last. Every step is verified by
**re-reading**, not by the absence of an error — the whole failure mode here is
a deletion that returns 200 and leaves the files behind, and that is invisible
from the caller's side.

`lib/account-deletion.ts` holds the decisions and **contains no table name at
all** — a test asserts that, because a name here is a list and a list goes
stale. The relations come from PostgREST's own OpenAPI document, which it
generates from the live catalogue and refreshes when the schema changes. 27
relations carry a `brand_id` today; a 28th added tomorrow is deleted tomorrow
with nothing edited.

**This is not `information_schema`, which the spec names.** Reaching that
through PostgREST needs a SECURITY DEFINER function, which needs a migration,
and rule 1 allows none — while the queue entry says this item needs no schema
at all. The OpenAPI document is the same fact from the same catalogue, read
without DDL. Saying so rather than quietly substituting it.

### It does not try to tell a table from a view, and that is deliberate

`product_attachment_counts` is a view with a `brand_id`, and it is
auto-updatable, so a DELETE through it reaches `catalog_products`. The obvious
move is to classify relations and skip the views. **Nothing in the schema
document says which is which.** The one available signal — an absent
`required` array — is also absent from any table whose columns all have
defaults, and skipping a real table is exactly the silent failure this item is
about.

So it does not classify. Every delete is `WHERE brand_id = <this brand>`, and
that is the property that makes it safe: whatever relation the name resolves
to, it can only remove rows belonging to the brand being deleted. A view is
then redundant rather than dangerous. This is the note at the end of inbox
entry 5 applied — name the property, not the shape of the example — and a test
asserts every `.delete()` in the route carries the filter.

### Two prefixes, not one

`brand-assets` holds objects under the brand's **UUID** as well as its slug —
the same slug/UUID confusion that made templates render nowhere. The spec's
"the brand's prefix" describes half of what is on disk. `storagePrefixesFor`
returns both, and the probe places an object under each in all four buckets.

**Four buckets, not the three the spec names**: `brand-images`,
`brand-assets`, `brand-documents` and `brand-reference-images`. The last is the
one inbox entry 5c asks about; deletion enumerates buckets at run time rather
than from a list, so it is covered either way.

### The probes

`npm run delete:probe` — two real accounts, two real brands, a real token, a
real POST. It seeds a row in **every** relation with a `brand_id`, generically:

- a **template row** copied from one that already exists in the table, because
  half these columns carry CHECK constraints (`catalog_products.type`,
  `brand_images.format`, `note_blocks.kind`) and nothing in the schema says
  what they allow. The copy lives under a `zz-del-` brand for the run and is
  deleted in the `finally`; nothing is written to the row it copied from.
- the **FK annotation** PostgREST puts in each column description, so a
  `*_id` is filled with the id of the row the seeder already made in the table
  it points at. No map of parents here to go stale.

25 of 26 insertable relations seed; the 26th is the view. All 27 come back
zero. It also seeds a `product_specs` row — no `brand_id`, scoped through
`catalog_products` with ON DELETE CASCADE, so it is precisely the row a
brand_id-shaped deletion strands — and confirms the cascade took it.

`npm run delete:ui` — the same thing through a browser, because criterion 4 is
a statement about one: sign in, open Settings, watch the button stay disabled
until the brand name matches, press it, land signed out on `/`, and fail to
sign in again.

### Criterion by criterion

| # | criterion | how |
|---|---|---|
| 1 | every relation with a `brand_id`, enumerated at run time | 27 seeded and cleared in `delete:probe`; the throwaway table is a unit test, see below |
| 2 | every storage object under the prefix, all buckets | 8 objects, 4 buckets, both prefixes, all gone |
| 3 | the auth user is gone and the email can sign up again | both asserted |
| 4 | a clean signup afterwards, not a broken session | `delete:ui`: signed out to `/`, old password refused |
| 5 | brand B completely untouched | counted in all 27 relations before and after, plus its 8 storage objects |
| 6 | logged with table names and counts | `formatDeletionLog`, one line per relation and per bucket, including the empty ones |
| 7 | `/privacy` no longer promises an email route | **the page does not exist** — see below |

**Criterion 1's own proof needed DDL, so it is in two halves.** The spec asks
for a throwaway table with a `brand_id`, confirmed cleared with the deletion
code untouched. Rule 1 allows no DDL, so the throwaway table is created in a
synthetic schema document in `lib/account-deletion.test.ts` — a table this
codebase has never heard of, appearing in the plan with nothing edited — and
the live half is the probe clearing all 27 real relations.

**Criterion 7 has nowhere to land: there is no `/privacy` page.** Queue item 11
has not been built and `spec/privacy-and-terms.md` says so itself. So the
policy text in that spec is what changed, since it is what item 11 will copy
from, and a test fails if the page ever appears carrying the old promise.

While rewriting it: the retention paragraph promised removal "from encrypted
backups within a further 60 days". **There are no backups.** Supabase Free has
no scheduled backups and no point-in-time recovery, so deletion is immediate
and there is nothing to restore from. A policy describing a 60-day backup
sweep describes a system that does not exist, which is the same error as
promising a button that does not exist.

### Four controls, and three of them found something

| control | result | what it found |
|---|---|---|
| the route skips storage entirely | **green, then red** | with no buckets enumerated the route reported success having looked at nothing. `deletionComplete` now fails on an empty bucket list |
| a listing that errors | red | `objectsUnder` returned the keys it had so far, before **and** after, so the verification agreed with the deletion because both were blind the same way. It returns the error now |
| one table dropped from the enumeration | **green, then red** | the probe was calling the same function as the route, so removing a table removed it from the check too. The probe enumerates for itself now — a verification that shares its subject's reasoning verifies nothing |
| the confirm button armed unconditionally | red | as intended |

Not run as a control, deliberately: a delete with the `brand_id` filter
removed. That statement empties a table for every brand in the live database
and there is no recovery. It is asserted by reading the route source instead.

### Two bugs of mine, for the record

- The route's pre-check called `deletionFailures` before attempting the auth
  user, and that function reports the auth user, so the pre-check always
  failed and the user was never deleted. Caught by the probe on its first run.
- The UI check cleared the confirmation field with the native value setter and
  a synthetic input event. It drove React state only sometimes, so one run
  found `not the nameZZ UI Delete` in the box and reported that the right name
  does not arm the button — the exact trap CLAUDE.md names. It selects the
  text and types over it now.

### One thing outside the item, because the feature is not shipped without it

`spec/settings.md` arrived untracked in the tree while this was being built,
and it names a bug that lands squarely on this work: `components/account-menu.tsx`
tagged **Settings** `soon: true` over a page that already existed, so
`/settings` could be reached by typing the URL and no other way. Putting an
irreversible delete on a page nobody can click to is not a shipped feature, so
Settings is a real link now, with no Soon tag. Profile and Help keep theirs —
the rest of that spec is its own piece of work and is not done here.

Two things fell out of it: the keyboard walk queried `HTMLButtonElement` and
would have skipped an anchor, and the browser check now reaches Settings
through the menu rather than by URL, so the link is exercised rather than
asserted in source alone.

`branditect-ui/spec/settings.md` and `branditect-ui/reference/settings.html`
are committed as they arrived, unedited, in their own commit — an untracked
spec is the thing CLAUDE.md records going wrong before.

### Accounts and data

Every account these probes create deletes itself in a `finally`, including the
one the UI check deletes through the interface. Confirmed by enumerating
`auth.users` and `brands` afterwards: no `zz-del-` or `zz-uidel-` residue, and
the only `zz-` accounts left are the four `zz-doc-` ones already listed at the
foot of this report.

**One thing that is missing and was not mine.** CLAUDE.md names a scratch
product `ZZ TEST — do not use` (`43655187-c36a-445c-ab29-1b485f7e60f5`, brand
`sorbify-13t9`) and says to insert one directly if it is gone. It is gone —
`sorbify-13t9` has SORBIFY OIL, ALL, ULTRA and a soft-deleted PUSSI, and 10
products exist in total. I have not inserted it: nothing here needed it, and
writing a row to a real brand is the thing rule 2 forbids. Flagging it so the
next person does not discover it mid-test.

1121 tests. `npx tsc --noEmit` clean apart from six pre-existing `--target`
errors in unrelated test files.

---

## Settings phase 1 — done, and the reference has three colours that do not exist

`spec/settings.md` and `reference/settings.html`. All eight criteria met. The
account-menu line the entry asked about had already gone out with queue item 4,
so `/settings` has been clickable since `54e5aac`.

### The page

Hero, then You, Brand, Language, Account, then the line and five named rows.
A server component with client islands, `app/(app)/settings/page.tsx`, and the
panels under `components/settings/`.

- **You** — name into `user_metadata.full_name`, email read-only with the
  sentence saying why. `lib/useUser.ts` has always *read* that field and
  nothing had ever written it, so it was empty for everyone and Home greeted
  people by their email address.
- **Brand** — `brand_name`, `website`, `industry`, the three asked in
  onboarding and never editable since. A typed `sorbify.fi` is stored as
  `https://sorbify.fi`; an empty field clears rather than failing, which is
  why `normaliseWebsite` returns a three-state result instead of a string or
  null.
- **Language** — two cards, one component. `LanguageSwitch` took a `field`
  prop rather than being copied, so there is one implementation of
  read-the-brand, write-the-column, report-the-result. **This is the first
  place `output_language` can be changed after onboarding.**
- **Account** — sign out, then deletion. The reference shows an email route
  and a 30-day promise here with "self-service is coming"; it came, so the
  note is replaced by the control it stood in for.
- **Profile** now links to `/settings` too. One destination, per the spec.

### Three colours in the reference are not in the palette

`--violet: #6b53ac`, `--violet-2: #9b83d8` and the hero's `#8a5fb0` mid stop
are in neither `branditect-ui/design/tokens.css` nor the v6 block in
`tailwind.config.ts`, although the reference's own comment says "straight from
tokens.css — nothing invented". CLAUDE.md: a colour missing from the palette
is a design decision, not a CSS one. So they are not added.

| reference | built with | where |
|---|---|---|
| orange → violet hero gradient | `grad-mark` | the hero |
| `--violet` section tile | `lavender` with `lav-ink` | Language |
| `--violet` eyebrow and edge | `lav-ink`, `lav-line` → `lavender` | Coming up |

The contrast the reference is arguing for — violet for you, orange for your
customers — survives, because `lav-ink` against `accent-dark` reads as two
different things. **If the violet is wanted, it needs adding to the v6 block
first.** Say so and I will move the page onto it.

### One colour was promoted, and it was already broken

`text-danger` was in `components/language-switch.tsx` against a token that
does not exist. **An undefined Tailwind colour renders nothing at all** — no
error, no warning — so that error message had been the inherited body colour
since it was written, and I copied the same class into the delete panel in
item 4 without noticing.

`danger` is now in the v6 block as `#c8402a` with a `wash` of `#fdeeea`. That
is promotion rather than invention: `components/account-menu.tsx` has rendered
Log out in exactly those two hexes as arbitrary values since it was ported.
Naming them removed two arbitrary values instead of adding one.

**`lib/tokens.test.ts` is new and it found four more.** It reads the colour
and font-size names out of `tailwind.config.ts` and fails on any class naming
something that is not there:

| class | file | what it rendered |
|---|---|---|
| `text-page-title`, `text-section` | the old Settings page | nothing — the v6 scale has `display` and `h2` |
| `border-primary-mid` | `brand/tone-of-voice` | nothing — `primary` has no `mid` |
| `bg-amber-50`, `text-amber-700`, `border-amber-200` | `products/import` | nothing — the v6 block redefines `amber` as one colour, which kills Tailwind's scale |
| `text-amber-600`, `bg-amber-400` | `knowledge/documents` | same |

All fixed. The amber case is why the guard computes which built-in families
are still usable rather than listing them: a family the config redefines as a
single colour silently loses its 50..950 scale, and a list would have hidden
exactly that.

Writing that guard took three passes. It first flagged `text-mid` across six
files — the config puts several colours on one line, `dark: … , mid: … ,
subtle: …`, and a line-anchored regex sees only the first. It is a depth-aware
parse now, with a sanity assertion that fails if the parse stops finding
colours it should.

### Criterion 4 found a real bug, by forcing a failure

The criterion asks for a forced failure and a visible message, so
`npm run settings:ui` deletes the brand's owner out from under the page
between typing and saving. What came back was **"Saved"**.

**An UPDATE that RLS filters out resolves `{ error: null }` and changes
nothing.** supabase-js cannot tell "you are not allowed" from "done", so
checking the error is not enough — the panel has to read back what it wrote.
`.select("id")` on both the brand update and the language update, with zero
rows treated as a failure. That would have shipped as the third silent failure
the spec names, and no amount of reading the code would have shown it.

`components/settings/save-state.tsx` is the other half: a panel cannot render
a save button without rendering somewhere for the answer to go, because both
come from the same component. A throw is reported too, not only a resolved
`{ error }`.

One more, in my own item-4 code: `delete-account.tsx` discarded the error from
`supabase.auth.signOut()` after a successful deletion. Bound and logged now —
it cannot be shown to anyone, since the account is gone by then.

### Criterion by criterion

| # | how |
|---|---|
| 1 | menu link asserted in source and clicked in the browser; Profile links there too, Help keeps its tag |
| 2 | `settings:ui` types a name, saves, loads Home and reads "Good afternoon, Aino" off the screen |
| 3 | brand fields saved, read back from the database, then re-read from a reloaded page |
| 4 | forced failure, described above |
| 5 | five rows, each with its line, none focusable or linked — asserted in source and in the browser |
| 6 | `readOnly` and the sentence, both checked live |
| 7 | see below |
| 8 | every key used exists in `en` and `fi`; all eight files are on `EXTRACTED` |

**Criterion 7, taken literally, fails the real button.** "A test fails on a
disabled control whose label contains delete" — but the delete button *is*
disabled until the brand name is typed, which is a guard rather than a
placeholder. The test is on the reason instead: a delete control disabled by a
constant, or with no handler, or not calling the route. If the literal
reading was meant, say so and I will change it.

### Controls

| control | result |
|---|---|
| the read-back dropped from the brand save | criterion 4 red |
| a coming row given `onClick` and `tabIndex` | criterion 5 red |
| `readOnly` removed from the email | criterion 6 red |
| Settings re-tagged `soon` | criterion 1 red (from item 4) |

The browser harness was wrong three times before it was right, each time in a
way that would have passed something broken: it clicked the first **Save** on
the page, which is the You panel's, so every Brand assertion was reporting on
the wrong section; it searched `main` for section names, and `main` contains
the sidebar, whose nav has a "Brand" item; and it slept two seconds for
`useBrand` instead of waiting for it, which reported the brand panel as empty
and disabled. Found by running it, not by reading it.

### Not done, and deliberately

The industry list is in `lib/industries.ts` and `app/onboarding/page.tsx`
still holds its own copy. That screen is one of the 62 unextracted files, and
importing a shared list into it would half-extract it. A test asserts the two
lists match exactly, in order, and fails if either drifts; when onboarding is
extracted it imports from here and the test becomes trivially true.

The stored value is the English label — `"Food & Beverage"`, not a slug —
because that is what onboarding has always written into `brands.industry`.
Changing it to a slug needs a backfill of live rows, and rule 1 allows no
migration.

### Finnish

Thirty-seven keys added to both dictionaries. The Finnish for the section
titles, labels and the five coming rows is **lifted from
`reference/settings.html`**, which the design side wrote — `Sinä`, `Brändi`,
`Tili`, `Tulossa`, `Krediittien käyttö` and the rest. The ones with no
counterpart in the reference are mine and unreviewed:
`settings.saveFailed`, `settings.websiteInvalid`, `settings.saving`,
`settings.signingOut`, `settings.industry`, `industry.ecommerce`.

1162 tests, `npx tsc --noEmit` clean apart from the six pre-existing
`--target` errors, `npm run lint` clean apart from one pre-existing `<img>`
warning in onboarding.

---

## Inbox 6a · Tagging goes both ways now — and Documents was worse than a missing link

### The images half

"Tag images" appears on the Media tab's empty state and, once there are
images, in the section header — both places, because the empty state
disappears after the first tag and adding a second should not mean emptying
the first.

It opens the chooser that already exists. `components/products/image-picker.tsx`
gained a **multi-select mode** rather than being copied: `single` still
returns one image for the product hero, which is what *Change product image*
has always used and which is unchanged. A second modal browsing
`brand_images` would have been the third grid over that table and the one
nobody keeps in step — the same reason `ProductPicker` is one component with
three entry points.

It posts to `/api/products/attachments`, the endpoint the Images side already
posts to, with the arguments the other way round: many images, one product.
The route needed no change. It already skips pairs that exist, so a
double-tag is a no-op rather than a failed batch.

**Images already on the product are shown as Tagged and not selectable, not
hidden.** Hiding them makes this grid disagree with Knowledge, and someone
looking for an image they know they have concludes it is gone.

### The new confirm button was born with 6c's bug

6c is about the Images-side modal saying **Pick a product** on a button that
is disabled until you have picked one. The button I added here would have said
"Pick an image" for exactly the same reason, so it says what pressing it does
instead: `Tag image`, `Tag 2 images`, `Tagging…`. Fixed before it shipped
rather than added to the list.

### Documents cannot be tagged. Anywhere.

The entry reads the Documents empty state as the same shape as the images one
— a sentence with no link. It is worse than that.

**Nothing in this application inserts into `product_documents`.** Not the
Media tab, not Knowledge ▸ Documents, not the API: the POST takes `imageIds`
and `productIds` only, and a grep across `app/`, `components/` and `lib/`
finds one file touching that table at all — the attachments route, which
selects from it and deletes from it. The untag button on the Documents list
can only ever act on rows nothing can create.

So the empty state was not missing a link to a screen that does the job. It
named an action with no destination, and adding a link would have sent
someone to a screen that cannot do it either.

The copy says what is true now, and links to Knowledge ▸ Documents for the
files themselves. **Building document tagging is a real piece of work and is
not in this entry** — the route needs a `documentIds` path with its own
ownership check, and a picker over `brand_documents` with the `doc_role` the
schema already carries. Named rather than half-built. Say the word and it is
the next thing.

A test asserts the claim rather than remembering it: if anything ever inserts
into `product_documents`, or a `documentIds` parameter appears, the suite
fails and the copy has to be updated in the same commit.

### Half of 6b went with it

"Tagging more, and matching from your library, arrive next" — the second half
stopped being true the moment this shipped, so it is gone. The rest of that
sentence still floats with no control beside it and is left for 6b, which is
its own item.

### `npm run tag:ui`

Fourteen checks in a real browser, against a `zz-tag-` brand with its own
product and three seeded library images. **No real product or image is
touched.** It ends on two actual rows in `product_images`, read back from the
database rather than from the screen.

Worth recording: **CLAUDE.md's scratch product `ZZ TEST — do not use` is still
missing**, which is why this seeds its own brand rather than using it. Flagged
in the item 4 entry too.

| control | result |
|---|---|
| the button removed from the empty state, sentence left | 8 red |
| the insert made a no-op, so the POST reports success and writes nothing | 2 red |

The harness was wrong four times before it was right, each time in a way that
would have reported a working feature as broken:

- it asserted before the Media tab had loaded, so neither the empty state nor
  the header button existed yet;
- the product drawer is also `role="dialog"` and its tab strip has
  `aria-pressed` buttons, so an unscoped query clicked drawer tabs instead of
  image tiles and read the drawer's control as the confirm;
- the page's own "Tag images" button sits behind the modal, and matching it
  reported the confirm as enabled with nothing picked;
- it read `product_images` on a fixed four-second wait and found the table
  empty two rows before it was.

All four found by running it.

### Not translated

`components/products/media-tab.tsx` is one of the 62 files on `OUTSTANDING`
and stays there: it holds its own English literals, and the strings added here
are English beside them. Extracting the file is the i18n job, not this one.
`lib/i18n-scope.ts` is unchanged, and the two-sided scope test still passes.

1172 tests, tsc and lint clean.

---

## Inbox 7a · The violet is a token

`--violet #6b53ac`, `--violet-2 #9b83d8`, `--violet-ink #4a3d73` and
`--grad-violet` in `branditect-ui/design/tokens.css` beside `--lavender`, and
the matching entries in `tailwind.config.ts`. `#8a5fb0` is dropped —
`--grad-hero-settings` runs accent to violet and interpolates the midpoint on
its own, because a gradient stop is not a colour anyone names.

**One correction.** The entry says the hex already ships "in the auth screens,
twice each". It ships in `components/studio-card.tsx`,
`components/studio/write.module.css`, `visual-identity.module.css` and
`components/site/site.module.css` — four files, none of them auth. That makes
the case for promoting it stronger, not weaker. `studio-card.tsx` is on
`bg-grad-violet` now; the CSS modules keep their own variables, since they are
not Tailwind and converting them is a different job.

### Naming it broke a screen, and the guard caught it

`violet` shadows Tailwind's own `violet-50..950`, the same way `amber` does.
`app/(app)/knowledge/products/import/page.tsx` styled its SaaS pill
`bg-violet-50 text-violet-700 border-violet-200`, and all three would have
rendered nothing the moment the token landed — invisibly, which is the whole
hazard.

`lib/tokens.test.ts` failed on exactly those three lines. All four pills on
that screen are on brand tokens now rather than one row of the table being on
Tailwind's defaults. **Third instance of this shape**: `text-danger` naming
nothing, `amber` shadowing its scale, now `violet`.

### The contrast is asserted as colour, not as class names

7a is explicit that the for-you / for-customers pairing is the argument the
screen exists to make, and that lavender against white is too faint to carry
it. Both cards now take their hue at the same weight — violet eyebrow and
edge against accent eyebrow and edge.

`npm run settings:ui` reads it with `getComputedStyle`:

```
PASS  7a · for-you renders in the violet token — rgb(107, 83, 172)
PASS  7a · for-your-customers renders in the accent — rgb(232, 72, 31)
PASS  7a · and the two are visibly different, which is the argument
```

Class names would not have been enough. `lib/tokens.test.ts` catches a name
nothing defines; this catches a name that is defined and still does not reach
the screen — which is what happened below.

### A Tailwind config change needs the dev server restarted

`text-violet` rendered as inherited ink after the token was added, on a dev
server that had been up since before the config changed. The symptom is
identical to an undefined token: correct class, no colour. Stopping dev,
clearing `.next` and restarting fixed it.

That belongs beside the `npm run build` hazard in CLAUDE.md — same family, and
the same wasted hour if it is diagnosed as a Tailwind bug.

| control | result |
|---|---|
| the violet swapped back for `lav-ink` | red — `rgb(91, 74, 128)` |
| `bg-violet-50` put back on the SaaS pill | red — three classes flagged |

1179 tests. `npm run settings:ui` all pass.

---

## Inbox 6b–6e · The rest of the tagging walk-through

6a shipped on the commit before this one. These are the other four.

### 6b · cut

`UNTAG_NOTE` — "Removes it from this product. The file stays in Knowledge." —
is already the `title` on both untag controls, the × on an image and the × on
a document. The floating paragraph was a second, weaker statement of a
tooltip, placed under the Documents list and describing buttons two sections
up. Cut. A test asserts both halves: no paragraph, and the controls still
carry the note.

The roadmap half — "Tagging more, and matching from your library, arrive
next" — went with 6a, when it stopped being true.

### 6c · the button says what pressing it does

`confirmState` returned `Pick a product` while disabled, so it instructed you
to do the thing you had just done, and by the time it was pressable the label
was false. It returns `Tag` now, and `Tag 3 images to 2 products` once there
is a count worth showing.

The test walks five (images, products) combinations and asserts no label
begins with "Pick" and every one begins with "Tag" — rather than pinning the
one string, which is how the next variant gets added without anyone noticing.

### 6d · one line

*"The shot on the product list. Tagged images below do not change it."*

The line it replaced said where the shot came from — "Picked from your image
library in Knowledge ▸ Images" — which answers a question nobody was asking
in place of the one they were.

### 6e · the placeholder, and why the check is a timing check

`useBrand` answers `"Your Brand"` whenever it has no row, which includes the
whole time it is loading. Two surfaces rendered it: the sidebar footer, on
every page behind the login, and the Knowledge ▸ Images heading.

- The sidebar's person line fell back to the brand name last. That was the
  wrong fallback regardless — the line is a person — so it falls back to
  nothing now.
- `AccountMenu` holds the height of both lines with a skeleton. Without it,
  removing the placeholder makes the row jump as the name arrives, which is
  exactly the reason a placeholder string gets put back.
- The Images heading drops the possessive while it waits rather than showing
  a name it does not have.

`useBrand` still invents the string, deliberately: `brandName` is typed
`string` and read in a dozen template literals, and changing the type would
ripple through all of them to fix two surfaces. A test records that decision
so the next person does not read it as an oversight.

**The check had to be a timing check.** A test that loads the page and then
asserts proves nothing about a string that is gone by the time it looks.
`npm run placeholder:ui` polls `document.body.innerText` every 40ms from the
moment navigation starts, across three pages, and fails on one frame
containing the placeholder. It also requires the real name to appear, or a
page that never loads would pass by rendering nothing.

| control | result |
|---|---|
| the sidebar fallback and the possessive heading put back | 46, 64 and 42 frames, first at ~50ms, last at 1.9–3.1s |

That last column is the bug as the entry described it — "about a second" —
measured rather than agreed with.

1188 tests. `npm run tag:ui` now covers 6b and 6d in the browser as well:
seventeen checks, all passing.

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
