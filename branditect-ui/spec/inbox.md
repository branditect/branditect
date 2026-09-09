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
