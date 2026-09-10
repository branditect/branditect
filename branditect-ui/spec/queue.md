# Work queue — unattended

**This replaces the earlier version of this file. The order has changed: four blocking security items
now come first, ahead of the notes work.**

Saara is not at the machine. Work top to bottom. **Do not skip ahead and do not batch.**

After each item, append to `branditect-ui/spec/queue-report.md`: what you did, which acceptance
criteria are now asserted, what you found that the spec got wrong, and anything you had to decide.
Commit after each item, one commit per item. That report is read by the design side without Saara
relaying it, so write it for someone who has the specs but has not seen your screen.

## Three hard rules while she is away

**1 · No migration runs.** You have PostgREST, not DDL. Where an item needs schema, write the `.sql`
file, stop that item there, say so in the report, and move to the next item. No workarounds.

**2 · Nothing destructive.** No dropped columns, no deleted rows, no deleted files outside your own
working output. Supabase Free has no point-in-time recovery, so anything lost is lost.

**3 · The service role key is not a tool for getting unblocked.** `SUPABASE_SERVICE_ROLE_KEY` is in
`.env.local` and bypasses RLS on the **live** database.

- `app/api/zz-*/`, `app/api/*-seed/` and `app/api/*-check/` are in `.gitignore`. **Do not remove
  those lines and do not force-add those paths.** An endpoint that creates users with a hardcoded
  password must never reach a deploy.
- **Delete `app/api/zz-note/route.ts` before the queue closes.** It is the last thing you do.
- **List every `zz-note-*` brand and every user you created in the report, by id.** Saara cannot
  remove what she was never told about.
- **No other write to production data.** No backfills, no "fixing" a row that looks wrong, no
  deletes. If a test needs data, seed it under a `zz-` brand and record it.

If an item is blocked for any other reason, write why in the report and move on. Do not stall the
whole queue on one thing.

---

## 0 · First: commit what is already in the tree

There are uncommitted changes to the notes editor, the image picker, `lib/notes.ts`,
`scripts/check-notes-race.mjs` and a new `lib/brand-image-upload.ts`, and no `queue-report.md`. Work
that is neither committed nor reported is work nobody can see.

Get the tree to a state you are willing to stand behind, commit it, and write the report entries for
what it covers. If some of it is half-done, say so in the report rather than finishing it now —
security comes first from here.

---

## 1 · Ownership on every API route — **the one that is leaking**

`spec/security-hardening.md`, part 1. Read the chain at the top of that spec before starting.

`/api/catalog` and `/api/numbers` take `brand_id` from the query string, query with the service-role
client, and check nothing at all. Not "a different tester can read it" — **anyone with the URL and no
account can read any brand's catalogue, costs and margins.** The brand id is handed out by the public
image URLs, which is item 3.

Twenty-three routes are listed in the spec. `lib/api-auth.ts` and `lib/authed-fetch.ts` already exist
and are already correct — this is wiring, not design.

Criterion 4 is the one that matters: a test that fails when a new file under `app/api` imports
`supabase-admin` without importing `api-auth`. Twenty-three routes drifted here one at a time.

Also delete the comment block at the top of `numbers/route.ts`. It asserts that nothing in the app
sends an Authorization header and that supplied-`brand_id` scoping is ownership enforcement. Both are
false, and it is why nobody looked again.

No migration.

## 2 · The loaded gun in `supabase/brand_images.sql`

`spec/security-hardening.md`, part 3. Two minutes.

Line 40 still creates `FOR ALL USING (true) WITH CHECK (true)` on `brand_images`. The live database
no longer has it, but PERMISSIVE policies are OR'd, so re-running that file re-opens the table to
every signed-in user in one statement while the scoped policy sits there looking correct.

Replace it with the brand-scoped policy, and add a test that fails if any file in `supabase/`
contains `USING (true)` on a table with a `brand_id` column.

No migration — you are editing a file, not running it.

## 3 · Private buckets and signed URLs

`spec/security-hardening.md`, part 2. **This one stops at the SQL**, per rule 1.

Three buckets, not one: `brand-images`, `brand-assets`, `brand-logos`. All three serve
`getPublicUrl`. Doing only the first leaves uploaded brand documents and logos public.

The trap: `file_url` stores the **full URL**, and a signed URL expires, so it cannot be stored.
Flipping the buckets without changing that breaks every image in the app at once. So:

- Add `storage_path`, backfill by parsing `file_url` — reuse the parse that already exists at
  `image-library.tsx:222`, do not write a second one.
- **Criterion 3 is the merge blocker:** every row has a non-NULL `storage_path` and every path
  resolves to an object that exists, asserted *before* anything is flipped.
- One `signedUrl` helper, one-hour expiry, batched with `createSignedUrls` for grids.
- Keep `file_url`. Do not drop it.

Write the `.sql` for the columns and the `storage.objects` policies, then **stop that part** and
report. The application code — the helper, the call sites, the backfill script, the tests — you can
write and commit now, as long as it reads `storage_path` with a fallback to `file_url` so nothing
breaks before the migration runs.

## 4 · Account deletion that actually deletes

`spec/security-hardening.md`, part 4. No migration needed.

Rows in every brand-scoped table, storage objects in all three buckets, then the auth user — in that
order, so a half-failure leaves a retryable account rather than stranded files.

**Enumerate the tables from `information_schema`, never from a list in the code.** A hand-maintained
list goes stale the first time a table is added and the failure is silent: data that should be gone,
isn't. Criterion 1 asserts this by adding a throwaway table with a `brand_id` and confirming it is
cleared without the deletion code being touched.

Update `/privacy` in the same commit — it currently promises an email route and a 30-day answer, and
that stops being true the moment this ships.

## 5 · Re-run the cross-tenant check

`scripts/cross-tenant.mjs`. Items 1, 3 and 4 all touch access paths. Report the same shape as
`082c26f`: closed, leaking, unverified, total.

---

# Then, and only then: the notes work

## 6 · Notes, step 3 — images

`spec/studio-notes.md` build order step 3. Criteria 4, 5, 10. Schema is already live — `image_id`,
`width`, `caption` and `note_blocks_image_idx` all exist. **No migration.**

Insert from the library picker; a dragged file uploads to Knowledge ▸ Media **before** it is placed,
asserted by dropping a file and finding the row in `brand_images`. Half width floats left and runs
text beside it. **Criterion 10 is the merge blocker:** deleting an image from Knowledge leaves the
block and the surrounding text intact and says the image is gone.

## 7 · The race probe has no failing test

Add **image insert as a second writer** to `scripts/check-notes-race.mjs`, then confirm the probe
goes red with client-side serialisation removed. If it stays green, the probe is wrong, not the code
— say so.

## 8 · Notes, step 4 — collecting and pinning

Criteria 7, 8, 9. No migration. `source` and `source_ref` stored, rendered nowhere. One collecting
note per brand, asserted by a direct second update expecting rejection from the partial unique index.
**Opening a note does not make it the collecting note** — assert that explicitly.

## 9 · Notes, step 5 — search

Criterion 2, and re-assert criterion 11 now that images write blocks too.

## 10 · Notes, step 6 — PDF

Criterion 6, server-side, never assembled in the browser. Plus criterion 13: exactly six toolbar
controls, asserted by a test.

## 11 · Privacy and terms

`spec/privacy-and-terms.md`. Build `/privacy`, `/terms`, the `(site)` footer, the signup links, and
`"regions": ["dub1"]` in `vercel.json`.

Confirmed blanks: Creativegoodlife Oy · 3439261-2 · Aurorankatu 11 A 2, 00100 Helsinki, Finland ·
saara@cgl.agency · Supabase West EU (Ireland) · Vercel Dublin · Gemini paid tier.

Not confirmed, do not invent: the postcode — use `00100`, and flag in the report that Saara wrote
`0010`, which is not a Finnish postcode. And **clause 9, Liability** — leave the placeholder, do not
draft a cap. That makes criterion 3 fail on `/terms`, which is correct: ship `/privacy` and link only
`/privacy` until her lawyer returns clause 9.

Criterion 7, the processor drift test, is the one worth having.

## 12 · Finnish, steps 1 and 2 — prepare only

**Stops at the SQL.** Write `supabase/brand-language.sql`:

```sql
ALTER TABLE brands ADD COLUMN IF NOT EXISTS output_language    TEXT NOT NULL DEFAULT 'en';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS interface_language TEXT NOT NULL DEFAULT 'en';
```

Two columns, not one — different questions, and splitting them later is a migration on live brands.
Then stop; a route reading a column that does not exist is a broken generate button for every brand.

What you **can** do now is step 2: disable the voice rubric check for any brand whose output language
is not English, reading a default of `'en'` so it is correct before and after the migration. Finnish
has no contractions, agglutinates so every `sentence_words_avg` band is about a third too high, and
has its own tells that nobody has listed. A check that passes vacuously is worse than no check,
because it is believed.

---

## When the queue is done

Delete `app/api/zz-note/route.ts`. Stop. Do not start anything not on this list and do not go back to
improve items already reported. Leave the tree committed and clean, and close the report with which
items completed, which stopped at a migration, which were blocked, and the full list of `zz-` brands
and users to clean up.

---

# ADDED MID-RUN — rule 4, the inbox

**4 · Re-read `branditect-ui/spec/inbox.md` at every item boundary**, before
starting the next item and after finishing the previous one.

Entries are written there while you are working, so what you read at the start
of the queue is not what is there now. An entry may correct an item you have
already reported as done — that is the point of it, and reopening a closed item
because the inbox says so is correct behaviour, not churn.

Mark an entry `DONE` in place once acted on, and give it its own entry in the
report. Never delete one: an entry that was acted on and one that was never seen
must not look the same.

This is the only channel back. There is no terminal between us — headless runs
are disabled and the platform blocks typing into terminals — so a file at a
known path, re-read on a fixed schedule, is the whole protocol.
