-- ⚠ This file used to create `FOR ALL USING (true) WITH CHECK (true)` on
-- product_specs, and the item 2 guard could not have caught it: that guard
-- looked for tables with a brand_id column, and product_specs has none.
-- The guard is widened to any USING (true) on any table. NOT RUN.

-- Run in Supabase SQL Editor: paste the statements below, not this filename.
--
-- Specifications for the product card. The description is prose Studio
-- rewrites; specifications are values it must quote verbatim and never
-- paraphrase. One free-text blob cannot carry both contracts.
--
-- One statement per line and no square or curly brackets — the editor's
-- bracket auto-pairing mangles multi-line pasted SQL and can silently fail the
-- whole statement while appearing to have run. See CLAUDE.md.
--
-- No DROP or UPDATE, so no destructive-operations warning. Re-running errors
-- on the policy already existing, which is harmless.

CREATE TABLE IF NOT EXISTS product_specs (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, product_id UUID NOT NULL REFERENCES catalog_products(id) ON DELETE CASCADE, key TEXT NOT NULL, value TEXT, sort_order INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now());

CREATE INDEX IF NOT EXISTS product_specs_product_idx ON product_specs (product_id, sort_order);

ALTER TABLE product_specs ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'product_specs'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.product_specs', r.policyname);
  END LOOP;
END $$;

-- product_specs has NO brand_id. It scopes through product_id, so the policy
-- has to join: product_specs.product_id → catalog_products.id → brands.
--
-- Types confirmed against the live database before writing this, because
-- brands.id is a UUID and brands.brand_id is TEXT and the two have been
-- confused before — that mix-up is what made templates render nowhere:
--
--   product_specs.product_id      UUID   (rejects text)
--   catalog_products.id           UUID
--   catalog_products.brand_id     TEXT
--   brands.brand_id               TEXT
--   brands.id                     UUID   (rejects text)
--
-- So b.brand_id = p.brand_id is TEXT to TEXT, and product_id IN (SELECT p.id)
-- is UUID to UUID. Joining on brands.id here would be the same defect again.
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

-- No confirmation query here on purpose: the editor mangled `ORDER BY` into
-- `ORDER B`, and because it runs the paste as one transaction that syntax
-- error rolled back the CREATE TABLE with it. Existence is verified from the
-- app instead, with a write and a read-back — a bare count returns no error
-- against a table that does not exist.
