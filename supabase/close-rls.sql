-- Close the cross-brand read hole.
--
-- Paste this whole block into the Supabase SQL editor and run it once. Every
-- statement is idempotent, so running it twice is harmless.
--
-- Do NOT append a verification SELECT to this paste. The editor has mangled a
-- trailing ORDER BY before now and rolled back the whole transaction with it.
--
-- WHAT THIS FIXES. Twelve tables had no row level security. Any signed-in user
-- with a brand new empty account could read every other brand's rows. Measured
-- on 2026-09-02 from a throwaway account:
--
--   catalog_products 10 · brand_images 141 · brand_documents 38
--   brand_book_pages 43 · brand_book_colors 25 · brand_logos 15
--   brand_templates 8 · brand_fonts 7 · brand_tone 5 · brand_visual 4
--   brand_financial_rules 1 · onboarding 1
--
-- brand_financial_rules is the one that matters most. It holds floor prices
-- and maximum discounts, and spec/visual-identity.md says of exactly that
-- table: leaking it is not embarrassment, it is a competitor learning exactly
-- how far you will drop.
--
-- brands, brand_strategies and brand_catalog were already closed and are not
-- touched here.
--
-- RUN THE CODE FIRST. Two route handlers used the anon client server side and
-- would read nothing once RLS is on, because a route carries no user session.
-- They were switched to the service-role client in the same commit as this
-- file. If this is run against an older deploy, editing a product and saving
-- Numbers both stop working.

-- ── the ordinary case: brand_id matches brands.brand_id ────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'catalog_products', 'brand_images', 'brand_documents', 'brand_financial_rules',
    'brand_tone', 'brand_logos', 'brand_fonts', 'brand_visual',
    'onboarding', 'brand_book_colors', 'brand_book_pages'
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

-- ── brand_templates is the exception ───────────────────────────────────────
-- Its brand_id column holds brands.id, the UUID primary key, not
-- brands.brand_id. All 8 rows do. The predicate above would match none of them
-- and every template would vanish from Visual identity, so it gets its own.
ALTER TABLE brand_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS brand_templates_own_brand ON brand_templates;
CREATE POLICY brand_templates_own_brand ON brand_templates
  FOR ALL
  USING      (brand_id::text IN (SELECT id::text FROM brands WHERE user_id = auth.uid()))
  WITH CHECK (brand_id::text IN (SELECT id::text FROM brands WHERE user_id = auth.uid()));

-- ── what becomes invisible, on purpose ─────────────────────────────────────
-- Rows whose brand_id matches no brand belong to nobody and are now unreadable
-- by everyone. That is the correct outcome and it is written down here rather
-- than left to be discovered:
--
--   brand_images     24 rows with brand_id 'vetra'   (the real one is 'vetra-6zc3')
--   brand_tone        1 row  with brand_id 'default'
--
-- Decide, then run. Neither is a schema change, so neither runs here:
--
--   UPDATE brand_images SET brand_id = 'vetra-6zc3' WHERE brand_id = 'vetra';
--   DELETE FROM brand_tone WHERE brand_id = 'default';
