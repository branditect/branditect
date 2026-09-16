# Inbox — messages from the design side

Re-read this file at every item boundary, before starting the next item. Entries
are added while you are working, so what you read at the start of the queue is
not what is here now.

When you have acted on an entry, mark it `DONE` in place and say so in the
report. Do not delete entries — a message that was acted on and one that was
never seen must not look the same.

---

## 1 · DONE — item 2 missed two files, and the criterion is why

`supabase/brand_guideline.sql:19` and `supabase/product_specs.sql:20` still
create `FOR ALL USING (true) WITH CHECK (true)`. Same loaded gun as
`brand_images.sql`: the live database is clean, but re-running either file
re-opens the table to every signed-in user, OR'd alongside the correct policy
and invisible to a policy-reading audit.

**`product_specs` could not have been caught, and that is my error.** The
criterion in `spec/security-hardening.md` said "on a table with a `brand_id`
column". `product_specs` has no `brand_id` — it scopes through
`product_id → catalog_products(id)`. So the guard skips it by construction, and
would skip the next table shaped that way too.

Two things:

1. Fix both files. `brand_guideline` is straightforward — it has `brand_id`.
   `product_specs` needs the join:

   ```sql
   CREATE POLICY product_specs_own_brand ON product_specs
     FOR ALL
     USING (product_id IN (
       SELECT p.id FROM catalog_products p
       JOIN brands b ON b.brand_id = p.brand_id
       WHERE b.user_id = auth.uid()))
     WITH CHECK (product_id IN (
       SELECT p.id FROM catalog_products p
       JOIN brands b ON b.brand_id = p.brand_id
       WHERE b.user_id = auth.uid()));
   ```

   Check that join against the live column types before trusting it —
   `catalog_products.brand_id` is TEXT and `brands.brand_id` is TEXT, but
   `brands.id` is a UUID and the two have been confused before. That exact
   mix-up is what made templates render nowhere.

2. **Widen the guard so it cannot miss this shape again.** Not "tables with a
   `brand_id` column" — *any* `CREATE POLICY … USING (true)` in `supabase/`, on
   any table, with an explicit allowlist for the ones that are genuinely public
   if any exist. A guard that only inspects the shape you already thought of is
   the same failure as the storage assertion that only checked
   `storage.objects`. You found that one by negative control; run the same
   negative control here — add a `USING (true)` policy on a table with no
   `brand_id`, confirm the guard goes red, then remove it.

Report it as its own entry rather than folding it into item 3.

**DONE 2026-09-09.** Both files fixed and the guard widened.

- `brand_guideline.sql` and `product_specs.sql` now carry a discovery-based
  drop and a scoped policy. Neither has been run.
- The join was checked against the live database before being trusted, not
  reasoned from memory: `product_specs.product_id` UUID,
  `catalog_products.id` UUID, `catalog_products.brand_id` TEXT,
  `brands.brand_id` TEXT, `brands.id` UUID and rejects text. So
  `b.brand_id = p.brand_id` is TEXT to TEXT. A test fails if it is ever
  rewritten to join `brands.id`.
- The guard no longer looks at table shape at all. It flags **any**
  `CREATE POLICY … USING (true)` in `supabase/`, with an allowlist that is
  currently empty and a test that fails if an allowlist entry goes stale.
- Negative control run as instructed: a `USING (true)` policy on a table with
  no `brand_id` — the exact shape the old criterion skipped by construction —
  turns the suite red. Three more controls with it: the policy back on
  `product_specs`, the join switched to `brands.id`, and `brand_guideline`
  reopened. All four red.

See the report entry "Inbox 1".

---

## 2 · DONE — prompt caching is not implemented, and it is doubling the API bill

**Do this before item 3.** It is roughly twenty lines and it is costing money every day it
is not done. `claude/unit-economics.md` calls caching "the single highest-leverage
architectural decision in the product" and says none of its numbers hold without it.

**Confirmed absent.** There is no `cache_control` or `ephemeral` anywhere in `app/api` or
`lib`. `app/api/andy/route.ts:285` passes `system: systemPrompt + HOUSE_STYLE` — a plain
string. The API only caches when `system` is an **array of content blocks** with
`cache_control` on the last block to cache. A string cannot be cached, so every call is
paying full input price for the same ~16k of brand context.

**The good news, already checked:** the cached prefix would be byte-stable. There is no
`new Date`, `Date.now` or `toISOString` in `lib/brandContext.ts`, the route, or
`lib/house-style.ts`. Nothing varies per request, so the prefix hits cleanly per brand.

### The change

```ts
system: [
  {
    type: "text",
    text: systemPrompt + HOUSE_STYLE,
    cache_control: { type: "ephemeral", ttl: "1h" },
  },
],
```

The 1-hour TTL needs the beta header on the client. Without it, drop `ttl` and take the
5-minute default rather than silently getting nothing.

**Order is the whole trick.** Anything that varies per request must sit *after* the cached
block, never inside it. A single changing character at the front — a timestamp, a request
id, a "today is…" line — invalidates the entire prefix and you pay the write premium on
every call for no reads. If a per-request instruction is ever added, it goes in a second,
uncached block or in the first user message.

**Centralise it.** Eight routes under `app/api` send a system prompt. Build the array in one
helper and use it everywhere, for the same reason `useBrandChat` was extracted: two
implementations of the same thing drift, and the one nobody is watching is the one that
breaks.

### Caching is not free, so measure it

A cache write costs more than a plain input token — 1.25× at the 5-minute TTL, 2× at one
hour. It only pays once reads outnumber that premium. At 16k tokens on Sonnet it breaks
even at about **three calls within the TTL**, which any real working session clears easily,
but a single question every two hours would cost *more* than not caching.

### Acceptance criteria

1. `system` is an array of content blocks with `cache_control` on the stable block, in every
   route that sends brand context.
2. **The proof is the API's own numbers, not the source.** The response reports
   `cache_creation_input_tokens` and `cache_read_input_tokens`. Assert that a second
   identical call within the TTL comes back with a **non-zero `cache_read_input_tokens`**.
   A test that greps the codebase for `cache_control` proves only that a string is present —
   the same mistake as the CSS assertion that read the stylesheet as text and the policy
   guard that only looked at tables with a `brand_id`.
3. Log the two counters per call so the hit rate is visible. `unit-economics.md` says
   utilisation is the most uncertain input in the whole model; the cache hit rate is the
   same kind of number and is currently unmeasured.
4. Nothing per-request enters the cached block — asserted by a test that fails if the block
   is built from anything but the brand context and the static rules.

Report it as its own entry, and record the measured hit rate in
`claude/unit-economics.md` so the note at the top of that doc can come down.
**DONE 2026-09-10.** All eight routes go through one helper; four of them
actually cache.

- `lib/prompt-cache.ts` builds the array, `lib/prompts.ts` holds every system
  prompt in the app. The seven existing literals were sliced out of the routes
  by script and compared byte for byte before the originals were deleted.
- The per-request half is a `PerRequestBlock` object, not a string, and
  `cachedSystem` assembles the two halves itself — a caller never holds them
  concatenated, so it cannot get the order wrong.
- **copy-architect was the one that would have been a pure loss.** Its brief
  sat above the brand sources: a per-request string at the front of a 5k
  prefix, invalidating the entry on every call. The brief is now the second,
  uncached block. Measured: the prefix still reads when only the brief changes.
- **The 1h TTL needs no beta header.** Measured, not assumed —
  `ephemeral_1h_input_tokens: 2404` on the write and `cache_read_input_tokens:
  2404` on the read, plain Messages API, sdk 0.81.0, `anthropic-version:
  2023-06-01`.
- **Four of eight, not eight.** `tone-generate` (872 tokens), `catalog-parse`
  (863), `brand-code-architect` (757) and `vault-extract` (99) are below
  Sonnet's 1024-token minimum, so `cache_control` on them is inert. They log
  `hit=n/a`, not `hit=0%`. The four that do cache — andy 4879, copy-architect
  5123, generate-prompt 2072, brand-strategy 1651 — are the four a founder uses
  repeatedly.
- Criterion 2 is `npm run cache:probe`, four real calls per route including one
  with `cache_control` stripped that must read zero. Criterion 4 is 42
  assertions in `npm test`, with eight negative controls all red.
- **`claude/unit-economics.md` does not exist in this repo.** I have not
  created one rather than start a second copy of a doc whose canonical version
  is in the project. The numbers for the note at its top are in the report.

See the report entry "Inbox 2".

---

## 3 · PART DONE — Finnish: the onboarding content is translated, wire it up

`lib/onboarding-questions.fi.ts` is new and written by the design side. All 20 questions,
every per-track helper line and every worked example. Typechecks clean; a coverage check
confirms 20/20 questions and no untranslated example. **Do not rewrite the Finnish** — if a
line reads wrong, say so in the report rather than editing it, because the choices in that
file's header are deliberate.

**It is an overlay, not a second table.** `onboarding-questions.ts` still owns structure —
numbers, sections, kinds, which four are the gate. The `.fi.ts` file owns only words, and
every lookup must **fall back to English on a missing key**. A question added later then
shows in English until translated, which is the correct failure. Never let the two tables
both define structure; the one nobody reads is the one that drifts.

### What to build

1. **`supabase/brand-language.sql`** — item 12 of the queue, still the same two columns:

   ```sql
   ALTER TABLE brands ADD COLUMN IF NOT EXISTS output_language    TEXT NOT NULL DEFAULT 'en';
   ALTER TABLE brands ADD COLUMN IF NOT EXISTS interface_language TEXT NOT NULL DEFAULT 'en';
   ```

   Two columns, not one. What Studio *writes* and what the interface *is* are different
   questions — a founder who has read English software for fifteen years may well want the
   interface in English and the copy in Finnish, because that is what her customers read.
   Storing one value forces a wrong answer on half of them, and splitting it later is a
   migration on live brands. **Write the file and stop there. Rule 1.**

2. **A `forLocale` lookup beside `forTrack`**, taking the question number, the track and the
   language, returning Finnish when present and English otherwise. One function, used
   everywhere, so the fallback cannot be forgotten at one call site.

3. **The language switch**, in Settings and in onboarding. Reading `interface_language` with
   a default of `'en'`, so it is correct before and after the migration runs.

4. **Step 2 of `spec/finnish.md` — the rubric check.** Suspend it for any brand whose
   `output_language` is not `en`. Finnish has no contractions, so that field is undefined
   rather than false; it agglutinates, so every `sentence_words_avg` band is about a third
   too high; and its machine-written tells are a different list that nobody has compiled.
   **A check that passes vacuously is worse than no check, because it is believed.** Read the
   column with a default of `'en'` so this is right before the migration too.

### Acceptance criteria

1. A brand with `interface_language = 'fi'` sees all 20 questions, helper lines and examples
   in Finnish, on all three tracks — asserted by rendering each track and finding no English.
2. A question present in `QUESTIONS` but absent from `QUESTIONS_FI` renders in English and
   does not throw — asserted by deleting a key in the test, not by inspection.
3. `QUESTIONS_FI` defines no structure: a test fails if it carries `n`, `section`, `kind`
   or `required`.
4. The rubric check does not run for a non-English brand — asserted by a brand with
   `output_language = 'fi'` producing no rubric failure on copy that would fail in English.

### The interface dictionary is written too — 10 Sep

**This section replaces the earlier one that said the interface was untranslated. It is not.
Do not wait for translations through the inbox; they are already in the repo.**

`lib/i18n/en.ts` and `lib/i18n/fi.ts` are new. **500 keys, every one translated**, typechecked
clean. Everything behind the login: navigation, the common vocabulary, home, errors, chat and
Andy, sidebar and plan, activity, readiness, welcome, sign-in and sign-up, onboarding, the
questionnaire shell, all of Knowledge, the product card, all of Brand, and all of Numbers.

**`fi` is typed `Record<StringKey, string>` where `StringKey` comes from `en`. A missing
Finnish string is a compile error, not a silent English word on a Finnish screen.** That is
the point of the flat dotted keys — keep them flat. Nested objects read nicer and then hide a
gap three levels down.

So what is left here is **the extraction pass, and only that**: replace the literals in `app/`
and `components/` with `t()` calls against the keys that already exist. The keys were derived
from the real strings in those files, so they should match what you find. Where one does not,
add it to **both** files and say so in the report — do not invent Finnish, and do not quietly
leave a literal in place.

Two rules from the dictionary header that matter while you wire it:

- **Never build a sentence by concatenating keys.** Word order differs by language, and
  Finnish puts the case ending where English puts a preposition. Interpolate with
  `{placeholders}`.
- **`common.*` is only for a string used in more than one place.** A word used once stays
  under its own screen even if it is a single word — "Type" on the media screen and "Type" on
  the product card can diverge in Finnish, and sharing a key would force them together.

Terminology is settled and approved: Knowledge → **Tieto**, Numbers → **Laskurit**, AI Chat →
**Chat**, Visual identity → **Visuaalit**, Tone of voice → **Äänensävy**, plan → **Tilaus**.
Do not change these while wiring.

### Acceptance criteria for the extraction

1. No user-facing literal remains in `app/(app)`, `app/login`, `app/signup`, `app/onboarding`,
   `app/start` or `components/` — asserted by a test that scans for JSX text and
   `placeholder`/`aria-label`/`title` attributes and fails on anything not coming from `t()`.
   Allow an explicit ignore list, and fail if an ignore entry no longer matches anything.
2. Every key in `en` is used at least once — an unused key means a screen was missed or the
   key was guessed wrong.
3. Switching `interface_language` to `fi` changes every screen, asserted by rendering the app
   shell and finding none of a sample of known English strings.

### Still not translated, and deliberately

The marketing site under `app/(site)` — about 70 strings — stays English for now, by Saara's
decision. Do not extract it.

---

**PART DONE 2026-09-10. Not marked DONE, because it is not.**

Items 1-4 are built and tested. The extraction is four files of sixty-four, and
it stops there on a measurement rather than on effort.

- **1 · `supabase/brand-language.sql`** written, not run, rule 1. Both columns,
  both defaulting to `en`, and every reader in the app defaults to `en` on its
  own — so the interface is right before the migration as well as after.
- **2 · `forLocale`** is `lib/onboarding-locale.ts`, falling back per field.
  It is not beside `forTrack`: if the English table imported the Finnish
  overlay, a third language would mean editing the structure file, which is the
  dependency that lets two tables start defining the same thing.
- **3 · The switch** is in a new `/settings` and on the onboarding welcome
  screen, before the twenty questions. It writes the cookie and the column; the
  column does not exist yet, so that write fails and the panel says the choice
  is on this browser only rather than claiming to have saved it.
- **4 · The rubric is suspended by field, not wholesale** — `spec/finnish.md`
  section 2 says the blunt version was an earlier draft and is wrong, and half
  the rubric holds in any language. Every suspended field reports as suspended
  with its reason. One addition of mine: `cta_max_words`. The table lists
  `cta_style` as surviving, and the style does, but the only part of it that is
  mechanically checked is a word count.

**The extraction is where this stops.** Measured against the real files:
**2,107** user-facing literals in scope, **1,276** distinct strings with no key
at all, and **150 of the 500 `en` keys** have a value that appears verbatim in
the code. `brand/channels/page.tsx` has 69 strings and one key;
`BrandBookClient.tsx` has 275 and one.

Finishing as written would mean me writing over a thousand strings of Finnish,
which this entry forbids in the same paragraph that asks for the extraction. So
the boundary is made legible instead: **`branditect-ui/spec/i18n-gap.md`**,
generated by `npm run i18n:gap`, lists all 1,276 by screen, untruncated. That
file is what comes back through here translated; the extraction is mechanical
after it.

`lib/i18n-scope.ts` holds `EXTRACTED` and `OUTSTANDING` and the suite checks
both directions, so neither a new English screen nor a finished file can drift
past unnoticed.

Thirteen keys were added to both dictionaries for the switch and the account
menu. The Finnish in them is mine and has not been reviewed — they are listed
by name in the report.

`lib/i18n/.add-en.txt` and `.add-fi.txt` are in the tree and every key in them
is already in `en.ts` and `fi.ts`. Not committed, not deleted.

See the report entry "Inbox 3".

---

## 4 · DONE — two loose ends from entry 3, then straight to queue item 3

Neither of these blocks queue item 3. **Do item 3 first.** These are here so they are not
lost, and they are small.

### 4a · The gap scanner still emits source code, and it inflates the number

`branditect-ui/spec/i18n-gap.md` lists **1276 strings. 375 of them are raw JSX**, not strings
— fragments like `); if (opt.value !==`, `: isActive ?`, and whole runs of `className=` and
`onClick={() =>`. The two scanner bugs the controls caught were real, and this is a third
that survived them.

The real remaining count is about **900**, not 1276.

This matters more than a wrong number in a report: that file is the work list. Left as it is,
it invites 375 keys whose English is a fragment of a JavaScript expression, and a dictionary
that contains those is worse than one with gaps, because the gaps are at least visible.

Fix the scanner so a brace-stripped body cannot enter the list, regenerate, and **prove it
with a negative control**: put a known JSX expression in a file, confirm it does not appear
in the regenerated list, and confirm a real new string does.

### 4b · `output_language` is stored and never asked — the half that matters most

> **RAN 10 Sep.** Saara has run `supabase/brand-language.sql`. Both columns exist on
> `brands` with a default of `en`. Rule 1 no longer blocks anything here: read and write them
> for real, and the interface language stops living in a cookie.

This is why entry 3 is PART DONE rather than DONE, and it is worth being blunt about which
half is missing.

`interface_language` has a switch. That one decides what **Saara** reads. `output_language`
decides what **her customers** read — the copy Studio writes, the thing she is actually
paying for. It has a column, it has a default of `'en'`, and nothing anywhere asks for it.

So a Finnish brand today gets a Finnish interface and English copy, which is precisely
backwards from what matters. `spec/finnish.md` says it is asked once, in onboarding: *"What
language should we write in?"* — separate from the interface setting, which lives in
Settings. Two questions, because a founder who has read English software for fifteen years
may well want the interface in English and the copy in Finnish.

Then every generation route states the language explicitly rather than letting the model
infer it from the brand's own inputs. That is a one-line addition per route and it is the
difference between a feature and an accident: today Studio writes Finnish for a Finnish brand
*probably*, uncontrolled, and liable to switch mid-draft when a document happens to be in
English.

**Assert it end to end**, not by reading the column: a brand with `output_language = 'fi'`
produces Finnish copy from a route, and the same brand set to `'en'` produces English.

### Translation status, so nobody re-counts it

`lib/i18n/en.ts` and `fi.ts` are at **599 keys**, all translated, typechecking clean. That
covers the whole first-run path: nav, chrome, sign-in, onboarding, the 20-question
questionnaire, Knowledge, the product card, Brand, Numbers labels and Channels.

What is left is the deep tool screens — brand book, brand guideline, create images, product
import, the Numbers page body, the code tool. **The design side is translating those and they
come back through this inbox.** Do not translate them yourself and do not wait for them
before doing anything else.

**DONE 2026-09-10.**

**4a — the work list was 40% source code, and the cause was one apostrophe.**
409 of 1,276 entries were raw JSX, not 375. The literal scanner paired quotes
left to right, so `don't` in ordinary JSX text opened a string that closed at
the next apostrophe further down the file and every quote after it was off by
one — what it reported from there on was the code *between* two real strings.
An apostrophe now only opens a string where one can start, and
`isSourceFragment` rejects what is still recognisably code. Two more found on
the way out: class lists with arbitrary values (`bg-[#FFF2EE]`) were reading as
copy, and `\'` reached the list as a backslash a translator would have copied
into the Finnish. One rule deleted rather than tightened: "starts with a digit"
was rejecting `124 of 6 required`, which CLAUDE.md names as the exact shape a
sublabel must have.

**The list is now 744 distinct strings across 58 files**, which is where you
estimated it. `OUTSTANDING` is regenerated: 1,514 occurrences across 62 files.
The 2,107 and 1,276 in the Inbox 3 entry were measured with the broken scanner
and are superseded; that entry is left as written so the record shows what was
believed at the time.

The control you asked for: a file with a class list, a ternary, an `onClick`
arrow, `useState`, apostrophe text and four real strings. Four strings in, zero
fragments, and removing the file regenerates the list byte-for-byte. Six
assertions cover it, one of which reads the committed `i18n-gap.md` and fails on
any fragment.

**4b — asked, stated, and proved.** A fourth onboarding step asks *"What
language should we write in?"*, separate from the interface setting and writing
a separate column. `lib/output-language.ts` is the one place that reads it;
`/api/andy` and `/api/copy-architect` state it in the cached block. English gets
no directive at all, deliberately — adding one changes the cache prefix for
every existing brand and buys nothing.

`npm run lang:probe` sends both directions to the real API with an **English**
brand context and gets English one way, Finnish the other. **It does not go
through the HTTP route, and cannot: `output_language` has no column yet, so no
brand can be set to `fi`.** That half is blocked on the migration.

**Not wired, and named rather than half-done:** `/api/brand-strategy` and
`/api/tone/generate` also write brand copy but resolve no brand at all — they
read the request body and nothing else. That is an ownership gap as much as a
language one.

Nine negative controls for 4b and six assertions for 4a. 1088 tests.

See the report entries "Inbox 4a" and "Inbox 4b".

---

## 5 · OPEN — four things from item 3, and one of my facts is stale

### 5a · DONE — The migration IS run. Your probe's admission is out of date.

`npm run lang:probe` says it cannot go through the HTTP route because
`output_language` has no column. **It has.** Saara ran `supabase/brand-language.sql`
on 10 Sep; both columns exist on `brands` with a default of `'en'`. You read that
file before the note landed in entry 4b.

So finish the half you correctly refused to claim: set a brand to `fi`, call the
route over HTTP, and assert the reply is Finnish. Then delete the admission and the
test that guards it — a test asserting a limitation that no longer exists is worse
than no test, because the next person believes it.

**DONE 2026-09-11.** The column is there, the route half is proved over HTTP,
and the admission was in eight files rather than one.

- `npm run lang:probe` has a second phase: a seeded `zz-lang-` user, a real
  token, an English-material brand, `output_language` flipped between two real
  POSTs to `/api/copy-architect`. English in, English out; `fi` in, Finnish out.
  It seeds and deletes its own user, brand and product.
- Three guards in that phase exist only so it cannot pass vacuously: the
  columns must exist, the update must read back, and the seeded product must be
  readable through `buildBrandContext`'s own column list. My first version
  inserted `price`, which that builder does not read, so the route had no
  material and answered "no confirmed details" in two languages — classified
  correctly, proved nothing.
- The test asserting the admission is replaced by one asserting the opposite.
  It was wrong twice first: it matched the route name in the probe's own header
  comment, then in two `console.log` strings. It matches the `fetch` call now.
  Found by running the control.
- The same stale fact was in seven other files. All corrected, and a test fails
  on any present-tense claim that `brand-language.sql` is unrun.
- Two behaviour changes fell out of it, both the discarded-`{ error }` shape 5c
  names: the onboarding `output_language` write no longer drops its error, and
  `language-switch.tsx`'s `isMissingColumn` branch — which relabelled a failed
  write as "saved in this browser" — is deleted.
- `settings.languageSavedLocally` is rewritten in both dictionaries. **The
  Finnish is mine and unreviewed.**

Five controls, all red or erroring as required. 1089 tests.

See the report entry "Inbox 5a".

---

### 5b · `/api/brand-strategy` and `/api/tone/generate` — my audit was wrong

You flagged these as a language gap. They are also an ownership gap, and it is mine:
`spec/security-hardening.md` lists both under *"No brand data at all, no change
needed"*. That was wrong. Both write brand copy, and neither resolves a brand — I
checked, zero references to `resolveBrand` or `api-auth` in either file.

The spec said to confirm each of that list individually rather than trusting it.
You did, and it did not hold. Wire both: `resolveBrand`, use `auth.brandId`, state
the output language from the brand's column.

**Then re-check the rest of that "no change needed" list the same way**, because if
two of eleven were misclassified, the list was a guess and not an audit.

### 5c · The onboarding logo upload has never worked

`app/onboarding/page.tsx:148` uploads to `brand-logos`, a bucket that does not
exist. The handler is:

```js
.then(({ error }) => { if (!error) { …set state, build the URL… } })
```

There is no else. A founder picks their logo on step 2 of onboarding, the upload
fails, and the screen says nothing at all — no error, no retry, no missing-file
state. It has behaved this way since it was written.

**Fix the swallowed error first, before the bucket.** A create-the-bucket change
makes the symptom disappear while leaving the same code ready to hide the next
failure — and this is the second time in this codebase that a discarded
`{ error }` has made a refusal indistinguishable from a success. Surface it, then
decide which bucket logos belong in: reusing `brand-assets` is probably right, since
a fourth bucket is a fourth set of policies to get wrong.

`brand-reference-images` — public, holding objects, in no spec and no code — needs
an answer before the flip, not after: what wrote it, is anything reading it, and can
it be closed.

### 5d · The four bad rows, and who presses the button

Criterion 3 being red is the criterion working. Do not soften it.

`scripts/storage-remediate.mjs` writes to production storage, so **rule 2 holds: do
not run it.** Saara runs it, after reading what it will do. Put a dry-run mode in it
if it does not have one — printing each object's from-path and to-path and changing
nothing — so what she approves is a list, not a description.

The five template thumbnails under the UUID are the same slug/UUID confusion that
made templates render nowhere for weeks. Accepting both keys in the policy is the
right call for now, but it should carry a comment saying it is a bridge, and the
UUID side should eventually go.

### And a note on the guard, because this is the third time

Entry 1's guard missed `USING (bucket_id = 'brand-assets')` because it matched the
literal text `USING (true)`. My criterion in `spec/security-hardening.md` before that
missed `product_specs` because it matched *tables with a `brand_id` column*. Both
times the guard was written to the shape of the example rather than the shape of the
danger.

Your fix — every `storage.objects` policy must reference `auth.uid()` — is the right
form: it names the property that makes a policy safe, so anything lacking it fails
whatever it looks like. **Apply that test to the next guard you write, and to the
deletion work in queue item 4:** the question is never "does this look like the bad
example", it is "can this be wrong and still pass".

---

## 6 · DONE — product image tagging: the flow works, the way in does not

Walked end to end in a real browser on production, signed in as the Deklan brand. **The
tagging itself is sound**: Knowledge ▸ Images → tick an image → "Tag to a product" → pick the
product → it appears on the card under *Images and video*, and the Untagged count drops 27 →
26. Nothing is broken in the mechanism.

What is wrong is everything around it.

### 6a · DONE — The product card tells you to tag and gives you no way to do it — **fix this one**

The Media tab's empty state reads:

> No images yet. Generate some in Studio, or tag existing ones from Knowledge.

There is no link on "Knowledge", no button, nothing. The card names the thing you should do
and then makes you find it yourself, in a different section, by remembering that the verb
lives on the other side. Same for Documents: *"Tag a safety sheet, a spec or a certificate
from Knowledge ▸ Documents."*

**Tagging is one-directional today.** You can tag an image to a product from Images. You
cannot tag an image to a product from the product. The product card is a read-only view of a
decision made elsewhere, and its own copy does not admit that.

Two ways to fix it, and the first is much cheaper:

1. **Make the empty state actionable.** "Tag existing ones from Knowledge" becomes a button
   that opens Knowledge ▸ Images filtered to untagged, or opens the same picker the *Change
   product image* control already uses. The picker exists — `components/products/image-picker.tsx`
   — so this is wiring, not building.
2. Add a real "Tag images" control to the Media tab that writes the same join the Images-side
   modal writes. More work, and it needs both sides to use one function, not two.

**Do not leave the sentence as it is.** An empty state that names an action it does not offer
is worse than one that says nothing, because the reader assumes they have missed a control.

**DONE 2026-09-11.** Tagging goes both ways now, and the Documents half of
this entry turned out to be worse than a missing link.

- **Images.** "Tag images" on the empty state and in the section header, both
  opening the chooser *Change product image* already uses — extended with a
  multi-select mode rather than copied, so there is one grid over
  `brand_images` and not a third. It posts to `/api/products/attachments`,
  the same endpoint the Images side posts to, with the arguments the other
  way round: many images, one product. Images already on the product are
  shown as **Tagged** and not selectable, rather than hidden — hiding them
  makes this grid disagree with Knowledge.
- **The new confirm button was born with 6c's bug** and was fixed before it
  shipped: it says `Tag 2 images`, never "Pick an image".
- **Documents cannot be tagged anywhere in this app.** Not from this tab, not
  from Knowledge ▸ Documents, not through the API — the POST takes `imageIds`
  only, and nothing in `app/`, `components/` or `lib/` inserts into
  `product_documents`. So that empty state was not missing a link, it was
  naming an action with no destination. Its copy now says what is true and
  links to Knowledge ▸ Documents for the files themselves. **Building it is a
  real piece of work and is not in this entry** — a route change and a second
  picker — so it is named in the report rather than half-built.
- Half of 6b's floating sentence — "matching from your library, arrive next"
  — stopped being true the moment this shipped, so that half is gone. The
  rest still floats with no control beside it and is left for 6b.

`npm run tag:ui` drives it in a browser against a `zz-tag-` brand with its own
product and three seeded images: fourteen checks, ending with two real rows in
`product_images`. Two controls red — the button removed from the empty state,
and the insert made a no-op.

See the report entry "Inbox 6a".

---

### 6b · DONE — A sentence with no control attached

At the bottom of the Media tab, under Documents, floating on its own:

> Removes it from this product. The file stays in Knowledge. Tagging more, and matching from
> your library, arrive next.

No button near it, nothing it describes. It reads as a stray note to a developer. Either
attach it to the control it explains — presumably a per-image Remove that only appears on
hover — or cut it. Half of it is also a roadmap promise ("arrive next") sitting in a product
surface, which is the kind of line that is still there in a year.

### 6c · DONE — "Pick a product" is the instruction, not the action

The modal's confirm button says **Pick a product**, and it stays disabled until you have
picked one. So it tells you to do the thing you have just done. By the time it is pressable
the label is already false.

It should say what pressing it does: **Tag** — or "Tag to 1 product" when the count is
useful. The modal title already carries the instruction.

### 6d · DONE — Tagging an image does not change the card thumbnail, and nothing says so

Two different things share one screen: **Product image** (the single thumbnail on the list
row, set by *Change product image*) and **Images and video** (everything tagged to this
product). Tagging an image adds it to the second and leaves the first alone.

That is the right model — the hero shot should not change because someone tagged a lifestyle
photo — but nothing on the screen explains it, and the natural expectation after tagging an
image is that the product now looks different. It does not.

One line under *Product image* fixes it: *"The shot on the product list. Tagged images below
do not change it."*

### 6e · DONE — The brand name shows a placeholder on first paint

Knowledge ▸ Images renders **"Access and manage all of Your Brand's brand assets in one
place"** and the sidebar footer reads **"Your Brand / Workspace"** for about a second, then
both resolve to "Deklan". A literal placeholder string is reaching the screen before the
brand loads.

Render the sentence without the name until the brand resolves, or hold the block. "Your
Brand" is the kind of thing that ends up in a screenshot.

**6b, 6c, 6d and 6e DONE 2026-09-11**, with 6a on the commit before.

- **6b · cut, not attached.** `UNTAG_NOTE` is already the `title` on both
  untag controls, so the paragraph was a second and weaker statement of a
  tooltip, sitting under a Documents list it had nothing to do with. The
  roadmap half went with 6a.
- **6c · the confirm says `Tag`.** `confirmState` returned "Pick a product"
  while disabled; it returns an action at every count now, and a test walks
  five of them asserting none begins with "Pick".
- **6d · one line under *Product image*,** exactly as written. The line it
  replaced explained where the shot came from rather than what it is.
- **6e · nothing renders until it is known.** The sidebar's person line no
  longer falls back to the brand at all — it was the wrong fallback anyway —
  and the account row holds its height with a skeleton so removing the
  placeholder does not make the row jump. The Images heading drops the
  possessive while it waits.

`npm run placeholder:ui` is the check 6e needed: it polls the DOM every 40ms
from navigation and fails on a single frame containing "Your Brand", across
three pages. With the fix reverted it records 46, 64 and 42 frames, first at
about 50ms and last at 1.9–3.1 seconds — which is the second you saw.

See the report entry "Inbox 6b–6e".

---

### Not a bug, worth knowing

The type switch across the top — IMG / VID / SND / GFX / WEB — renders and reads well. The
selection bar, the Untagged filter and the All products dropdown all behave.

### Suggested order

6a, then 6c, then 6d — all three are copy or wiring and together they are most of the
confusion. 6b is a deletion. 6e is its own small thing.

---

## 7 · OPEN — the violet is a yes, and a new one: language on the marketing site

### 7a · DONE — Add the violet block. My "nothing invented" was wrong, and you were right to stop.

The reference page's header says the colours came straight from `tokens.css`. For
`#6b53ac`, `#9b83d8` and `#8a5fb0` that was false, and checking it rather than believing it
is exactly the behaviour that keeps working.

**But this is not inventing a colour.** `#6b53ac` and `#9b83d8` already ship — they are in
the auth screens as raw hex, twice each, and `--lavender: #e8dff6` is already a token at the
pale end of the same hue. So the decision is to **promote a colour the product already uses
to a token**, which is what `tokens.css` is for. Raw hex repeated across files is the state
that produces `text-danger` — a name nobody defined, rendering nothing.

Add to `branditect-ui/design/tokens.css`, beside `--lavender`:

```css
  /* Violet — the second hue. Already shipping as raw hex in components/auth/*;
     named here so it stops being copied by hand. --lavender is the pale end of
     the same family and already a token. */
  --violet:    #6b53ac;   /* the anchor: labels, meters, section tiles */
  --violet-2:  #9b83d8;   /* the light end, for gradients and edges     */
  --violet-ink:#4a3d73;   /* text on lavender, contrast-safe            */
  --grad-violet: linear-gradient(150deg, #9b83d8, #6b53ac);
```

and the matching entries in `tailwind.config.ts`, in the same shape as `lavender`.

`#8a5fb0` was a midpoint I picked to smooth the hero's orange-to-violet run. **Drop it** — it
is a gradient stop, not a colour anyone names, and `--grad-hero-settings` can interpolate
between `--accent` and `--violet` without a third value.

Then move the settings page onto those tokens. **The one thing that must survive is the
for-you / for-customers contrast**: interface language in violet, output language in orange.
That pairing is the argument the screen exists to make, and grad-mark plus lavender alone
cannot carry it — lavender against white is too faint to read as a deliberate second voice.

While you are there: `lib/tokens.test.ts` is the most valuable thing in that commit. An
undefined Tailwind colour renders **nothing** — no error, no fallback, invisible text. Four
more of those plus five broken amber classes is a real haul from one test.

**DONE 2026-09-11.**

- `--violet`, `--violet-2`, `--violet-ink` and `--grad-violet` are in
  `tokens.css` beside `--lavender`, and in `tailwind.config.ts` in the same
  shape. `#8a5fb0` is dropped: `--grad-hero-settings` runs `--accent` to
  `--violet` and interpolates the midpoint itself.
- **One correction to the entry.** The hex ships in
  `components/studio-card.tsx`, `studio/write.module.css`,
  `visual-identity.module.css` and `site/site.module.css` — not the auth
  screens. Four files, so the argument for promoting it is stronger than
  stated, not weaker. `studio-card.tsx` is on `bg-grad-violet` now; the CSS
  modules keep their own variables.
- **Naming `violet` shadows Tailwind's `violet-50..950`**, exactly as `amber`
  does. `products/import` was using `bg-violet-50 text-violet-700
  border-violet-200` for the SaaS pill and would have lost all three
  silently. `lib/tokens.test.ts` caught it; all four pills on that screen are
  on brand tokens now.
- Settings is on the tokens: hero gradient, the Language tile, the violet
  eyebrow and edge below the line. **The for-you / for-customers contrast is
  asserted as rendered colour, not as class names** — `rgb(107, 83, 172)`
  against `rgb(232, 72, 31)`, read with `getComputedStyle` in
  `npm run settings:ui`.
- **A Tailwind config change needs the dev server restarted.** `text-violet`
  rendered as inherited ink until it was, which looks exactly like an
  undefined token. Worth knowing next to the `.next` hazard in CLAUDE.md.

Two controls red: the violet swapped back for `lav-ink`, and `bg-violet-50`
put back on the pill.

See the report entry "Inbox 7a".

---

### 7b · PART DONE — Finnish on the marketing site, and one toggle in both places

Saara's decision has changed: the marketing site is no longer English-only.

**The site cannot use the cookie.** `bd_locale` works behind the login because there is a
session and nobody is indexing it. A public page switched by cookie serves one URL with two
different languages, which means Google indexes whichever it saw first and the Finnish
version does not exist as far as search is concerned. The whole point of a Finnish marketing
page is that a Finnish company finds it.

So: **real locale routes** — `/fi`, `/fi/pricing`, `/fi/about` — with `hreflang` pointing
each at its pair, and the toggle changing the URL rather than a cookie.

**Inside the app, keep the cookie and the Settings control.** Two mechanisms, because they
answer different questions: the site needs to be findable, the app needs to remember you.
What must match is the *toggle* — same position, same labels, same two options — so it does
not read as two different features.

One thing to decide before building: **what happens when a signed-in Finnish user lands on
`/`.** Redirecting on a public page is how you end up with a Finn who cannot reach the
English page and an American who cannot reach the Finnish one. Suggest: no automatic
redirect, the toggle is always visible, and `Accept-Language` only decides which one the
toggle points at first.

The ~70 marketing strings are the design side's to translate and come back through this
inbox. Do the routes, the toggle and the `hreflang` first — the copy can land into a
structure that already works.

**PART DONE 2026-09-11. The structure is built; the copy is yours.**

Not marked DONE because `/fi` renders the English copy: the ~70 marketing
strings are the design side's and have not arrived. **No Finnish has been
invented.**

- **Real routes.** `/fi`, `/fi/pricing`, `/fi/about` all serve 200.
  `lib/site-locale.ts` is the one place that knows the pairing.
- **hreflang, reciprocal and absolute.** Both pages of every pair carry en,
  fi and x-default. They were relative until `metadataBase` was added to the
  root layout: a relative hreflang is ignored outright, so the routes would
  have existed and announced nothing. The canonicals were already relative
  before this entry; the hreflang is what made it matter.
- **The toggle changes the URL.** Two links with `hrefLang`, same two options
  and the same labels as the Settings switch, asserted equal by a test so
  they cannot drift into reading as two features.
- **No redirect, and nothing reads `Accept-Language`.** The entry allows it
  to decide which way the toggle points first; the toggle offers both at all
  times, so there is nothing left for it to decide, and machinery that
  changes no outcome is not built. A test fails if a redirect or an
  `Accept-Language` read appears, middleware included.
- **The language survives a navigation.** The nav and the footer were the
  obvious half. The page bodies were still sending people from `/fi` back to
  `/about` and `/?auth=signup` — the second click, which nobody checks.
  `components/site/site-link.tsx` resolves those, and works inside
  `about/page.tsx`, which is a server component rendered from both routes.

**One constant, `FI_COPY_READY`, is false and holds three things back:** the
fi routes are `noindex`, the toggle renders nothing, and the sitemap lists no
alternate. A page indexed as Finnish and written in English is this entry's
own problem inverted, and a toggle offering Suomi over English is a promise
the page does not keep. Flipping it turns all three on at once.

**One thing is owed at the flip and cannot be done now:** `<html lang="en">`
is in the root layout, shared with the app. Today English is the truthful
value for `/fi` because the copy is English. A test demands it be fixed the
moment `FI_COPY_READY` goes true, rather than leaving it to be remembered.

Verified in the browser: every link on `/fi` and `/fi/about` stays Finnish,
every link on `/` stays English, hreflang is absolute in the served HTML.

See the report entry "Inbox 7b".

**2026-09-14: the 98 `site.*` keys are wired. Still PART DONE, and the flag is
still false.**

Both sides now read one dictionary: each route passes its locale to the shared
body (`LandingClient`, `PricingClient`, and `AboutBody`, which moved out of
`about/page.tsx` so both About routes can hand it a locale), and the nav, footer,
auth-card tabs and page titles look their strings up. `site.about.threeQuestions`
renders as one whole string on both sides. The `<br />` and `<em>` seam is gone.

**Why the flag was not flipped.** The 98 keys cover the headings, labels and
short lines. Most of the body copy has no key, so `/fi` today is Finnish headings
over English paragraphs. Turning the flag on would get that indexed as Finnish
and offer "Suomi" over it, which is the thing the flag exists to prevent. The
flip was checked locally and reverted: the toggle renders in the nav on all six
routes, the noindex drops, and the sitemap gains the `fi` alternates. It works
once the copy is there.

**Also fixed: the canonical.** `/fi` said `canonical → /`. A cross-language
canonical tells a crawler the Finnish page is a duplicate of the English one,
so it drops `/fi` from the index and ignores the hreflang too. Each page is
now its own canonical (`alternatesFor(page, "fi")`), and there is a test for it.

**Owed before the flip: design side (copy)**

1. **Three keys are cut off mid-sentence and cannot be used.** Rendering them
   means joining a Finnish fragment to an English one:
   - `site.home.q25` stops at "…who you are". The full card body continues
     "actually for, what you will never claim even when it costs you a sale.
     Branditect turns the answers into a strategy foundation: positioning,
     audience, voice, anti-voice and your claim rules."
   - `site.pricing.topUp` stops at "…you can add". The sentence carries the
     top-up amount in bold and continues "with one click, or wait for the next
     month. Nothing is deleted and nothing stops working. You keep reading your
     brand brain either way." It needs one key with a `{topUp}` placeholder.
   - `site.commercialBrain` ("The commercial brain") is the first half of the
     pricing h1 "The commercial brain / for your brand.". Finnish reverses the
     order ("Brändisi kaupalliset aivot"), so it needs to be one key.
2. **Body copy with no key.** English source, by page:
   - **Landing:** the hero lede ("The commercial brain for product and ecommerce
     brands…"); the four trust chips (Free forever / No card to start / 100
     credits to try everything / Your data stays in the EU); the three screenshot
     captions after "Home." / "Products." / "Studio."; the #how sub-paragraph
     ("Each one is usable by everything else…"); the three cards' "Ask it" and
     "It answers" lines (6); the About strip h2 ("Built by a team that has spent
     two decades…"), its paragraph ("A brand rarely fails on strategy alone…"),
     the six roles, and the two closing paragraphs ("What a big brand has…",
     "Branditect gives you both…"); the final band paragraph ("About four minutes
     for the five that matter…"); "/month"; alt text for the dashboard and
     products screenshots.
   - **Pricing:** the lede ("Branditect turns your scattered files…"); "2 months
     free"; "Let's talk"; "/month"; "Incl. VAT, billed {total} yearly"; the
     "What is a credit?" paragraph; the "Not a copy generator" paragraph and the
     dashboard caption; the band paragraph ("A hundred credits, no card, no
     countdown. Your strategy…"); aria-label "Billing period"; dashboard alt.
   - **About:** the lede ("What do we stand for…"); the four screenshot captions;
     "Three verbs in order…"; the Define / Feed / Make card bodies (these differ
     from `site.home.step*Body`: they add "and your visual identity" and "are
     enough to"); "The second column is not modesty…"; "One inbox, read by the
     people who build it."; the final band paragraph; alt text for the dashboard
     and products screenshots.
   - **Every page:** the meta and Open Graph descriptions (3 pages).
   - **Footer:** "Contact", "Made in Finland".
   - **Plan data in `lib/pricing-plans.ts`:** plan `who`, `vatLine`, `credits`,
     `creditsLabel`, `cta`, every feature line, the comparison table's row labels
     and word values (Contact us, Agreed, Unlimited, Yes, No, Docs, Email…),
     and the four credit-cost rows. This is on both the landing page and pricing.
   - **The auth card form** (`components/auth/auth-form.tsx`): "Create your
     account", "Start building your brand workspace", "Email", "Password",
     placeholders, button states, and `AUTH_COPY` errors. Some `auth.*` keys
     already exist but this form does not read them.
   - **The OG card** (`components/site/og-image.tsx`): "The commercial brain /
     for your brand.", the same seam as the pricing h1.
3. **One em dash in the new Finnish:** `site.about.brandTruthBody`
   ("…visuaalinen ilmeesi — kirjattuna kerran…"). The public site has no em dashes
   (criterion 10), and this line now renders on `/fi/about`.

**Owed before the flip: build side**

- `<html lang="en">` is still hard-coded in the root layout, which is shared
  with the app. The existing test starts failing the moment the flag goes true.
- The inverted `FI_COPY_READY` assertions (`site-locale.test.ts`, "and one
  constant turns all of it on", plus the sitemap block) go in the same commit
  as the flip.

**2026-09-14, round two: wired. The toggle is visible. Still PART DONE.**

- Round-two keys are read on both sides. `lib/pricing-plans.ts` builds the plan
  cards, the comparison table and the credit table per locale with `plansIn`,
  `comparisonIn` and `creditCostsIn`. Prices are built from numbers by `euro()`:
  €29.90 in English, 29,90 € in Finnish. `credit.topUp` renders whole, bold,
  where `{topUp}` sits in `site.pricing.topUpFull`.
- `site.pricing.h1` breaks after "Brändisi" in Finnish (`PRICING_H1_BREAK_AFTER`).
  The OG card heading reads the same key, so `/fi` now has Finnish cards.
- **The toggle shows on every public page** (Saara's call). `FI_COPY_READY` now
  holds back only indexing: noindex, the sitemap alternates and `html lang`. It
  cannot go true while the site gap scan finds anything; a test ties the two together.
- On a phone the toggle did not fit: it covered the wordmark and pushed Start
  free off screen, and in Finnish the nav overflowed even before the toggle.
  Below 620px the wordmark is screen-reader only and Log in leaves the nav.
  Measured at 320, 360, 390, 700 and 1440px on all six routes.
- **What is left is generated, not listed here:** `npm run i18n:gap:site` writes
  `branditect-ui/spec/i18n-gap-site.md`. Today it has 67 strings with no key, and 4
  keys nothing can read. `site.home.lede` is cut off again at "It's like" / "Se on
  kuin", so the hero lede is still English. The other three are the round-one
  fragments the whole-sentence keys replaced; delete them.
- The scanner had holes, fixed in `lib/i18n-scan.ts` for the app list too. It
  skipped text followed by `{" "}` (the whole hero lede), never opened a template
  literal ("Incl. VAT, billed {yearlyTotal} yearly"), and ignored `/month`. The
  app list reports 74 real strings it had missed and 58 CSS paddings it no longer
  mistakes for copy.

---

### The two bugs in that report are worth naming

**An UPDATE that RLS filters out returns `{ error: null }` and changes nothing.** supabase-js
cannot tell "not allowed" from "done", so the page said "Saved" over a write that never
happened. Reading the row back and treating zero rows as failure is the right fix, and it
should be the house rule for every write, not just those two — this is the same family as the
discarded `{ error }` in the onboarding logo upload and the image library inserts. Third
appearance.

**Criterion 7 taken literally would have failed a correct button.** Disabled-until-you-type
is a guard, not an unfinished control. Testing the *reason* rather than the attribute is
right, and the criterion was mine and sloppily worded. Same failure as the `USING (true)`
guard and the `brand_id` guard: written to the shape of the example rather than the shape of
the danger.

### Order

7a now — it is small and the settings page is fresh. Then **inbox entry 6**, product image
tagging, starting with 6a. 7b after that: it is the largest remaining piece and nothing is
blocked on it.

---

## 8 · OPEN — batch C is in the dictionary. What is left is wiring, plus four bugs.

**2026-09-14, after your batch A commit.**

I regenerated `npm run i18n:gap` against the dictionary as it stands now, not as
the committed report had it. The 530 in the checked-in copy was measured before
batch B landed: **107 distinct strings across 22 files** is the real number.

I then split that 107 by whether you currently have the file open. You have 81
files modified. I wrote keys only for the fourteen you have not touched, so
nothing here can collide with what you are in the middle of.

### What I added

**29 keys, both files, `en.ts` and `fi.ts` at 1237 each, 0 duplicates, `tsc`
clean on the i18n side.** They cover:

- `app/(app)/brand/visual-identity/page.tsx` — `vi.lede1`, `vi.lede2`,
  `vi.platesFixed`, `vi.uploadThree`, `vi.swatchesCopy`, `vi.addTheOnesYouUse`,
  `vi.opensIn`, `vi.opensInNewTab`, `vi.fourThings`, `vi.nothingUploaded`,
  `vi.pangram`
- `components/visual-identity/uploads.tsx` — `vi.uploading`, `vi.chooseFile`,
  `vi.nameTypefaceFirst`, `vi.specimenNote`, `vi.addTypeface`
- `app/(app)/knowledge/products/import/page.tsx` — `import.pastePlaceholder`
- `app/(app)/knowledge/products/page.tsx` — `products.noneMatch`
- `components/documents/ask-panel.tsx` — `ask.skipKeepsA`, `ask.skipKeepsB`
- `components/image-library.tsx` — `images.uploadOne`, `images.uploadMany`,
  `images.shownOf`, `images.removeFromFile`
- `components/products/image-picker.tsx` — `picker.tagToProduct`,
  `picker.tagOne`, `picker.tagN` (plain "Tag images" is already
  `media.tagImages`; reuse it rather than keying the same sentence twice)
- `components/products/product-picker.tsx` — `picker.oneWillShow`, `picker.nWillShow`

`app/(app)/knowledge/images/page.tsx` needs no new key. Its one string is
`assets.introNamed`, keyed in batch B. Read the note under it before you wire it.

### Three of those need a rule, not just a `t()`

**`vi.pangram` is not a translation and must never be "corrected" into one.**
A pangram's whole job is to put every letter in front of you. The English one,
"Sphinx of black quartz, judge my vow", contains no ä and no ö, which are
exactly the two glyphs a Finnish reader checks a typeface for first. The Finnish
value is a different sentence on purpose. If a future scan flags it as a
mismatched translation, the scan is wrong.

**`ask.skipKeepsB` carries its own leading space in English and opens on a comma
in Finnish.** The source today is:

```
wait under{" "}<strong>{t("ask.notDescribed")}</strong> until you add it.
```

If you keep that `{" "}` and also key the tail, Finnish renders
`Ei kuvausta , kunnes`. The `{" "}` before the `<strong>` is fine and must stay.
The space *after* it has to live inside the key.

**`import.pastePlaceholder` has real newlines in it.** `\n\n` between the blocks,
`\n` inside them. It is a textarea placeholder with a worked example under it,
and the Finnish example is priced Finnish: `1 500 €` and `800 €/kk`, not
`€1,500` and `€800/month`.

### The scanner catches — do not key these

`i18n-gap.md` will keep listing them and they are all correctly English:

- the Tailwind class string in `product-drawer.tsx`, `analyses: Record` in
  `BrandGuidelineClient`, `1fr 1fr`, `2px solid transparent`, and all nine CSS
  values in `knowledge/links`
- `AA` / `AAA` — WCAG grades, the same in every language
- `IMG`, `VID`, `SND`, `GFX`, `WEB` and their extension lists in
  `lib/media-categories.ts`; `PHY`, `SRV`, `SAS`, `DIG` in products/import
- `Google`, `Microsoft`, `Apple`, `Canva`, `Google Slides`, `DM Sans`,
  `Branditect`, `BRANDITECT`, `SIGNED_OUT`
- `Ag`, `120px / 32mm`, `24px / 8mm`
- **`Routing` in `app/login/page.tsx` and `Brand setup` in `app/signup/page.tsx`.**
  These are `withTimeout(work, what)` labels. `mapThrown` replaces them with
  `AUTH_COPY.timedOut` before anything reaches a person, so they never render.
  Worth confirming that stays true if you touch `lib/auth-timeout.ts`.
- everything in `lib/studio-write.ts`. Its `deliverable` and `words` fields are
  the model's instructions, and the file already says so in a comment. Which
  brings me to the one real bug in it.

### Four bugs, none of which I fixed, because three are in your open files

**1 · The Finnish word bands in `lib/studio-write.ts` are wrong, and not by a
rounding error.** `words: { short: "15 to 25 words", … }` goes into the prompt
as the target length. Finnish is agglutinative: the same content takes roughly a
third fewer words than English, because case endings do the work English spends
prepositions and articles on. A Finnish ad written to "60 to 90 words" comes back
noticeably longer than the English one it is supposed to match, and a LinkedIn
post written to "220 to 320 words" overruns the fold.

This is not a translation problem, so no key fixes it. It needs the band chosen
by output language: a second set of numbers, roughly 0.65–0.7× the English, read
when `output_language` is `fi`. Worth flagging that `output_language` and
`interface_language` are separate columns and this one follows `output_language`
— someone reading the interface in English can still be writing Finnish copy.

**2 · `{brandName}'s social strategy` in `app/(app)/brand/channels/page.tsx:423.`**
Same shape as the one I hit in `BrandBookClient`. A genitive on a variable has no
translatable form: Finnish inflects the name itself — Deklanin, Sorbifyn, Vetran —
and no template can do that from outside. The sentence has to be restructured so
the name stays nominative, the way `assets.introNamed` was. The file is yours
right now, so I left it alone.

**3 · `No {toLowerCase} yet` in `BrandBookClient`.** Still there. A method name has
leaked into a template literal. `bb.noneYet` is keyed as `No {kind} yet` and is
ready for whichever noun was meant.

**4 · `tone.sec.expression` and its six siblings do not exist in `en.ts`.**
`app/(app)/brand/tone-of-voice/page.tsx:56` types `EDIT_TITLE` as
`Record<…, StringKey>` and names seven keys — `tone.sec.expression`,
`.pillars`, `.dos`, `.donts`, `.vocab`, `.touchpoints`, `.checklist` — none of
which are in the dictionary. That file does not typecheck as it stands. I did
**not** add them: you are mid-edit in that file and two of us writing the same
seven keys is exactly how the `specs.help` collision happened. They are yours.
If you would rather I write the Finnish for them, say so in this file and I will
take them once you have committed.

### Where that leaves the count

Of the 107, the fourteen files above are keyed. The rest are in the 81 files you
have open, plus the catch list, which is not work. Once your extraction pass
commits, regenerate the gap and what remains should be close to nothing but the
catches — at which point `FI_COPY_READY` is the only thing between here and a
Finnish app.

### Order

Nothing here blocks you. Finish the extraction pass and commit it; the batch C
wiring is fourteen small files and can ride along or follow. Bug 1 is the only
one that needs a decision rather than a keystroke, and it can wait until the
interface stops being half English.

### After batch C: 107 → 51, and only two of the 51 are copy

I regenerated the gap again with the new keys in. Everything still listed is on
the catch list above or is `lib/studio-write.ts`, except two, and both are the
scanner comparing literally rather than a missing translation:

- `image-picker.tsx` "Tag {picked} images" is `picker.tagN`, keyed with
  `{count}`. Different variable name, same sentence.
- `product-picker.tsx` "{imageIds} images will show on the product's card." is
  `picker.nWillShow`, keyed with `{count}` and a curly apostrophe, which is what
  the rest of `en.ts` uses.

So the dictionary side of the app is done. What decides whether the app looks
Finnish is now entirely your extraction pass.

**5 · One more, and it is a launch problem rather than a bug.**
`DEFAULT_CHECKLIST` in `tone-of-voice/page.tsx:68` seeds a new brand's tone
checklist with six English sentences, and the comment above it is right that once
saved they are the brand's data and not interface copy. But a Finnish brand is
seeded in English and has to rewrite all six by hand before the page is any use
to them. The fix is to seed from `interface_language` at creation, not to key
them. I have the Finnish ready when you want it; say so here.
