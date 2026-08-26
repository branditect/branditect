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

CREATE POLICY product_specs_all ON product_specs FOR ALL USING (true) WITH CHECK (true);

-- No confirmation query here on purpose: the editor mangled `ORDER BY` into
-- `ORDER B`, and because it runs the paste as one transaction that syntax
-- error rolled back the CREATE TABLE with it. Existence is verified from the
-- app instead, with a write and a read-back — a bare count returns no error
-- against a table that does not exist.
