-- Close the hole properly. supabase/close-rls.sql did not.
--
-- Paste this whole block into the Supabase SQL editor and run it once. It is
-- idempotent. Do NOT append a verification query.
--
-- WHAT THE FIRST ATTEMPT GOT WRONG. It dropped only the policy name it creates,
-- <table>_own_brand, and left the pre-existing world-open policies in place.
-- Postgres ORs PERMISSIVE policies together, so a single `USING (true)` policy
-- makes the table readable to everyone no matter what else is added beside it.
-- Turning RLS on achieved nothing while those remained.
--
-- Measured after that migration ran, from a throwaway account with its own
-- empty brand: still readable were brand_images 140, catalog_products 10,
-- brand_visual_dna 5, brand_tone 4, brand_visual 4, brand_financial_rules 1,
-- onboarding 1, brand_guideline 1. Worse, INSERT into another brand's
-- brand_images and catalog_products was ALLOWED, because those policies carry
-- WITH CHECK (true) as well.
--
-- Two of those tables, brand_guideline and brand_visual_dna, were not in the
-- first migration at all. Their read paths were checked before writing this:
-- both are touched only by route handlers using the service-role client
-- (app/api/andy, app/api/brand-guideline/index), which bypasses RLS. Nothing
-- in the browser reads either. product_specs is the same, and its offending
-- policy came from supabase/product_specs.sql.

-- ── 1 · drop every world-open policy, by discovery rather than by name ──────
-- Naming them is what failed last time. This finds them instead, so a policy
-- nobody remembered cannot survive.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND permissive = 'PERMISSIVE'
      AND (qual = 'true' OR with_check = 'true')
  LOOP
    RAISE NOTICE 'dropping world-open policy % on %', r.policyname, r.tablename;
    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ── 2 · every tenant table keyed by brand_id ───────────────────────────────
-- Recreated after the sweep, because a table left with RLS on and no policy
-- denies everyone including the owner. That is a different outage, not a fix.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'catalog_products', 'brand_images', 'brand_documents', 'brand_financial_rules',
    'brand_tone', 'brand_logos', 'brand_fonts', 'brand_visual', 'onboarding',
    'brand_book_colors', 'brand_book_pages', 'brand_strategies', 'brand_catalog',
    'brand_guideline', 'brand_visual_dna'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_own_brand', t);
    EXECUTE format($f$
      CREATE POLICY %I ON %I
        FOR ALL
        USING      (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()))
        WITH CHECK (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()))
    $f$, t || '_own_brand', t);
  END LOOP;
END $$;

-- ── 3 · brand_templates keys on brands.id, not brands.brand_id ─────────────
ALTER TABLE brand_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS brand_templates_own_brand ON brand_templates;
CREATE POLICY brand_templates_own_brand ON brand_templates
  FOR ALL
  USING      (brand_id::text IN (SELECT id::text FROM brands WHERE user_id = auth.uid()))
  WITH CHECK (brand_id::text IN (SELECT id::text FROM brands WHERE user_id = auth.uid()));

-- ── 4 · product_specs has no brand_id, so it goes through the product ──────
ALTER TABLE product_specs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS product_specs_own_brand ON product_specs;
CREATE POLICY product_specs_own_brand ON product_specs
  FOR ALL
  USING (product_id IN (
    SELECT id FROM catalog_products
    WHERE brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid())))
  WITH CHECK (product_id IN (
    SELECT id FROM catalog_products
    WHERE brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid())));

-- ── 5 · make this checkable from code, so it cannot come back unnoticed ────
-- pg_policies is not reachable through PostgREST. This exposes just the
-- offenders, to the service role only, so scripts/rls-audit.mjs can fail on
-- them. It returns policy names, never data.
CREATE OR REPLACE FUNCTION public.rls_open_policies()
RETURNS TABLE (table_name text, policy_name text, cmd text, qual text, with_check text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT tablename::text, policyname::text, cmd::text, qual::text, with_check::text
  FROM pg_policies
  WHERE schemaname = 'public'
    AND permissive = 'PERMISSIVE'
    AND (qual = 'true' OR with_check = 'true');
$$;

REVOKE ALL ON FUNCTION public.rls_open_policies() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rls_open_policies() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rls_open_policies() TO service_role;

-- ── still to decide, and still not run here ────────────────────────────────
-- Rows belonging to no brand become unreadable by everyone, which is correct:
--   UPDATE brand_images SET brand_id = 'vetra-6zc3' WHERE brand_id = 'vetra';
--   DELETE FROM brand_tone WHERE brand_id = 'default';
