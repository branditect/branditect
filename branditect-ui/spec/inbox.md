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
