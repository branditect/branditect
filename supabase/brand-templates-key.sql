-- brand_templates keys brands by UUID while every other table keys them by
-- TEXT. Nothing in the app has ever read it.
--
-- Paste this whole block into the Supabase SQL editor and run it once.
--
-- WHAT WAS FOUND. scripts/cross-tenant.mjs could not seed brand_templates —
-- "invalid input syntax for type uuid" — which left its RLS UNVERIFIED. The
-- reason turned out to be worse than a test inconvenience:
--
--   brand_templates.brand_id is UUID, with a foreign key, and holds brands.id
--   The app queries it with brands.brand_id, the TEXT slug
--
-- So every read errors rather than returning nothing. Visual identity's
-- Templates section, Knowledge ▸ Links and /api/templates have never shown a
-- template. Eight rows are in there, belonging to three real brands.
--
-- Aligning the column with the rest of the schema, rather than changing four
-- call sites to resolve a slug to a UUID first: every other table keys by TEXT
-- brand_id, and every RLS policy in this directory is written against that
-- shape.
--
-- ORDERING, which the first version of this file got wrong and which cost a
-- failed run. brand_templates_own_brand already exists from close-rls-2.sql,
-- and a policy that references a column blocks dropping that column — so the
-- sweep has to happen BEFORE the drop, not after COMMIT. The CREATE POLICY is
-- inside the transaction too, so the table is never live with RLS enabled and
-- no policy on it: that state is readable by nobody and writable by nobody,
-- and it would be committed if anything after COMMIT failed.
--
-- Snapshot before the change: 8 rows — 3 vetra-6zc3, 3 deklan-zvkw,
-- 2 sorbify-13t9, no orphans.

BEGIN;

ALTER TABLE brand_templates ADD COLUMN IF NOT EXISTS brand_slug TEXT;

-- Map through brands.id, which is what the UUID column actually holds.
UPDATE brand_templates t
   SET brand_slug = b.brand_id
  FROM brands b
 WHERE b.id = t.brand_id
   AND t.brand_slug IS NULL;

-- Nothing may be left behind. If a template points at a brand that no longer
-- exists, stop rather than silently dropping somebody's work.
DO $$
DECLARE orphans integer;
BEGIN
  SELECT count(*) INTO orphans FROM brand_templates WHERE brand_slug IS NULL;
  IF orphans > 0 THEN
    RAISE EXCEPTION 'aborting: % template row(s) point at a brand that does not exist', orphans;
  END IF;
END $$;

-- Policies first: one of them references brand_id and would block the drop.
-- By discovery rather than by name, because close-rls.sql dropped only the
-- name it creates and nine open policies survived it.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'brand_templates'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.brand_templates', r.policyname);
  END LOOP;
END $$;

ALTER TABLE brand_templates DROP CONSTRAINT IF EXISTS brand_templates_brand_id_fkey;
ALTER TABLE brand_templates DROP COLUMN brand_id;
ALTER TABLE brand_templates RENAME COLUMN brand_slug TO brand_id;
ALTER TABLE brand_templates ALTER COLUMN brand_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS brand_templates_brand_idx ON brand_templates (brand_id);

-- RLS and its policy in the same transaction as the swap, so the table is
-- never committed with RLS on and nothing to allow anyone through.
ALTER TABLE brand_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY brand_templates_own_brand ON brand_templates
  FOR ALL
  USING      (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()));

COMMIT;

-- The foreign key is left off deliberately: brands.brand_id needs a unique
-- constraint before one can point at it, and adding that is a separate change
-- with its own blast radius. The policy above is what actually scopes access.
