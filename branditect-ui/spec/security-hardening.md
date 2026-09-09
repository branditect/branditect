# Security hardening — four blocking items

Audited against the code on `main` at `18013f2`, not against the specs. Every claim below names the
file it came from.

---

## Read this first: the three items are one chain

They were handed over as four separate things. Three of them join up, and the chain is worse than any
link in it:

1. An uploaded image is stored at `brand-images/${BRAND_ID}/${filename}`
   (`components/image-library.tsx:174`) and served from a **public** URL
   (`getPublicUrl`, line 184). So the public URL contains the brand id in plain text.
2. `app/api/catalog/route.ts:7` reads `brand_id` from the query string, queries with the
   **service-role** client, and **checks nothing** — no token, no session, no ownership. Same in
   `app/api/numbers/route.ts:31`.
3. So: take any image URL, read the brand id out of the path, call
   `/api/catalog?brand_id=<that>` and `/api/numbers?brand_id=<that>`, and you have that brand's
   entire catalogue, unit costs, freight, CAC, platform fees and margins.

**No account is required for step 3.** Not a different tester's account — no account at all.

The brand id is not otherwise guessable (`vetra-6zc3`, `sorbify-13t9` carry a random suffix), which
is the only reason this is not already trivial. The public bucket is what hands it out.

Fix the routes first. It is the shorter job and it is the end of the chain that actually leaks.

---

# 1 · Ownership on every API route — do this first

## What is already right

`lib/api-auth.ts` is correct and well-reasoned. It identifies the caller from **their own token**,
looks up the brand that user owns, returns **403 rather than 404** on a mismatch so the response
cannot be used to discover which brand ids exist, and prefers the session's brand over the parameter.

`lib/authed-fetch.ts` already attaches the bearer token on the client side.

**Both halves of the fix already exist. They are wired into six routes out of thirty-eight.**

## What is wrong

Twenty-three routes use the service-role client — which bypasses RLS completely, so closing RLS at
the database does nothing for them — and never check ownership:

| Route | Takes `brand_id` from the caller |
|---|---|
| `catalog/route.ts` | **query string** |
| `catalog/product/route.ts` | **query string** |
| `catalog/product/specs/route.ts` | **query string** |
| `numbers/route.ts` | **query string** |
| `tone/route.ts` | **query string** |
| `visual/route.ts` | **query string** |
| `social-strategy/route.ts` | **query string** |
| `templates/route.ts`, `templates/note/route.ts` | **query string** |
| `mission-board/goals`, `/notes`, `/tasks` | **query string** |
| `brand-guideline/index/route.ts` | **query string** |
| `brand/generate-from-reference/route.ts` | **query string** |
| `andy/route.ts` | body |
| `brand-book/delete`, `brand-book/upload` | body |
| `brand-guideline/brand-text`, `brand-guideline/upload-asset` | body |
| `copy-architect/route.ts` | body |
| `vault/extract/route.ts` | body |
| `zz-note/route.ts` | scratch — delete it |

Already correct, leave alone: `brand-assets/font`, `brand-assets/upload`, `brand-book/color`,
`notes/route.ts`, `notes/blocks/route.ts`, `products/attachments`.

No brand data at all, no change needed: `google-fonts`, `extract-colors`, `brand-book/chat`,
`brand-code-architect`, `brand-guideline/edit`, `brand-guideline/extract`, `brand-strategy`,
`brand/analyse-images`, `brand/generate-prompt`, `catalog/parse`, `tone/generate`. **Confirm each of
these individually rather than trusting this list** — a route that takes a prompt today can take an id
tomorrow.

## The comment in `numbers/route.ts` is the actual bug

```
 * A route handler carries no user session: nothing in this app sends an
 * Authorization header, so `auth.uid()` is null here. [...] Ownership is
 * enforced by the explicit brand_id scoping on every query instead.
```

Every sentence of that is wrong now, and the last one was never right. `lib/authed-fetch.ts` sends
the header. Six routes read it. And scoping a query by a `brand_id` **that the caller supplied** is
not ownership enforcement — it is doing exactly what the caller asked.

**Delete that comment as part of the fix.** A wrong belief written down in a comment is worse than no
comment, because the next person reads it and stops looking.

## How

For each route: `const auth = await resolveBrand(req, requested)` — and then **use `auth.brandId`,
not the parameter**, for every query. Where a route does not genuinely need a caller-supplied id, omit
the second argument entirely so there is nothing to spoof.

Client side: any `fetch` to a changed route becomes `authedFetch`. Grep for the route path to find
the call sites; a missed one is a 401 in the browser, which is loud and immediate.

## Acceptance criteria

1. Every route under `app/api` either takes no brand id, or calls `resolveBrand` before its first
   query.
2. `/api/catalog?brand_id=<someone else's>` returns **403** when signed in as a different user, and
   **401** when signed in as nobody. Asserted against a real second account, not mocked.
3. A route that receives a brand id it does not own returns the same status and message as one that
   receives an id that does not exist — asserted by comparing both responses byte for byte.
4. **A test fails when a new file under `app/api` imports `supabase-admin` without importing
   `api-auth`.** This is the criterion that matters. Twenty-three routes drifted into this state one
   at a time, and the twenty-fourth will too.
5. The wrong comment in `numbers/route.ts` is gone.

---

# 2 · Private buckets and signed URLs

## There are three buckets, not one

| Bucket | Used by |
|---|---|
| `brand-images` | `image-library.tsx`, `file-library.tsx`, `studio/create-images`, `lib/brand-image-upload.ts` |
| `brand-assets` | `knowledge/links`, `brand-assets/upload`, `brand-guideline/upload-asset` |
| `brand-logos` | `onboarding/page.tsx` |

All three call `getPublicUrl`. All three need the same treatment. Doing only `brand-images` leaves
uploaded brand documents and logos public.

## The part that will break if it is rushed

**`brand_images.file_url` stores the full public URL** (`supabase/brand_images.sql:26`), and every
other table does the same. A signed URL expires. **It therefore cannot be stored**, and switching the
bucket to private without changing this turns every image in the app into a broken link — all at
once, for everyone, with no way back except making the bucket public again.

So the change is: **store the object path, sign at read time.**

1. Add `storage_path TEXT` to `brand_images` and to every other table holding a bucket URL.
2. Backfill it by parsing the existing `file_url`. The parse already exists in the codebase —
   `components/image-library.tsx:222` and `file-library.tsx:131` both do
   `split("/brand-images/")` to get the path for deletion. Reuse it, do not write a second one.
3. **Assert the backfill left no NULL and no row whose parsed path does not exist in the bucket**
   before flipping anything. A row that cannot be parsed is an image that will disappear.
4. Only then switch the buckets to private and add storage policies on `storage.objects` allowing a
   user to read and write only under their own brand's prefix.
5. Signing: one helper, `signedUrl(bucket, path)`, used everywhere. Expiry one hour. Sign in batches
   when rendering a grid — `createSignedUrls` (plural) takes a list, and signing forty images one
   call at a time is forty round trips before the library paints.

Keep `file_url` for now, unused. Dropping a column is irreversible on the Free plan and it is not in
the way.

## Acceptance criteria

1. All three buckets are private. Asserted by fetching a known object URL **with no credentials** and
   expecting a failure — not by reading the bucket's config.
2. Every image and document in the app renders after the switch: Knowledge ▸ Media, the product card,
   the image picker, notes, the brand book, onboarding's logo.
3. `storage_path` is non-NULL on every existing row, and every path resolves to an object that
   exists. **MERGE BLOCKER** — this is the assertion that stops a silent mass breakage.
4. A signed URL is never written to any table. Asserted by a test that finds no `token=` in stored
   URL columns.
5. A grid of forty images issues one signing call, not forty.
6. A user cannot read an object under another brand's prefix even with a valid session — asserted
   against a real second account.

---

# 3 · RLS — done, with one trap still in the repo

**This one is already finished** and should not be redone. Commit `082c26f`: 27 tables, 0 leaking, 0
unverified, and *verified* meant user A could read its own row and none of user B's — found by
actually trying it, after two policy-reading audits had passed.

One thing is left, and it would undo the lot:

`supabase/brand_images.sql:40` still contains

```sql
CREATE POLICY "Allow all for authenticated users" ON brand_images
  FOR ALL USING (true) WITH CHECK (true);
```

The live database no longer has it — the cross-tenant test could not pass otherwise. But **the file
that recreates it is still sitting in `supabase/`**, and PERMISSIVE policies are OR'd, so re-running
that file re-opens `brand_images` to every signed-in user in a single statement, with the scoped
policy still in place and looking fine.

Fix: replace that block in the file with the brand-scoped policy, and add a test that fails if any
file in `supabase/` contains `USING (true)` on a table holding `brand_id`.

Then re-run `scripts/cross-tenant.mjs` once at the end of this whole piece of work, because items 1
and 2 both touch access paths.

---

# 4 · Account deletion that actually deletes

Nothing exists today. No route, nothing in Settings — `app/(app)/settings/` contains only `plan`.

## What has to go

Three things, and a flag is none of them:

1. **Rows** in all 27 brand-scoped tables, plus the `brands` row itself.
2. **Storage objects** in all three buckets under that brand's prefix. Deleting rows and leaving the
   files is the most common way this is got wrong, and the files are the part that was actually
   private.
3. **The auth user**, via `auth.admin.deleteUser`. Leaving it means the email cannot sign up again
   and the person is still in your user count.

## How to make it survive being wrong

- **Enumerate the tables from the database, not from a list in the code.** A hand-maintained list
  goes stale the first time a table is added, and the failure is silent — data that should be gone,
  isn't. Query `information_schema.columns` for tables with a `brand_id` column and delete from each.
- **Delete storage first, rows second, auth user last.** If it fails halfway, the account still
  exists and can be retried. The other order strands files nobody can find or reach.
- **Log what was deleted**: table names and row counts, bucket and object counts. GDPR asks you to
  demonstrate erasure, and *"we ran the function"* is not a demonstration.
- Confirmation is typing the brand name, not a checkbox. Then the button, then it is gone.

## The privacy policy changes with this

`spec/privacy-and-terms.md` currently says *"A self-service button is coming; until it does, this is
the route and we answer it."* When this ships, that sentence becomes the self-serve route and the
30-day promise becomes immediate. **Update the policy in the same commit** — a policy describing a
route that no longer exists is the same category of error as the comment in `numbers/route.ts`.

## Acceptance criteria

1. Deletion removes rows from every table with a `brand_id` column, enumerated from the database at
   run time — asserted by adding a throwaway table with a `brand_id` and confirming it is cleared
   without the deletion code being edited.
2. Every storage object under the brand's prefix is gone from all three buckets.
3. The auth user is gone and the email can sign up again.
4. Signing in afterwards gives a clean signup, not a broken session or a half-empty dashboard.
5. Deleting brand A leaves brand B **completely** untouched — asserted by counting B's rows in every
   table before and after.
6. The operation is logged with table names and counts.
7. `/privacy` no longer promises an email route, in the same commit.

---

## Order, and why

1. **API ownership.** Shortest job, and the only one of the four that is currently leaking to someone
   with no account.
2. **The `brand_images.sql` policy line.** Two minutes, and it is a loaded gun in the repo.
3. **Buckets private.** Bigger, and the backfill assertion in criterion 3 is what makes it safe.
4. **Account deletion.** Real work, and nothing else depends on it.
5. Re-run `scripts/cross-tenant.mjs` at the end.

Items 1, 2 and 3 need no migration beyond the `storage_path` columns and the storage policies. Item 4
needs none at all.
