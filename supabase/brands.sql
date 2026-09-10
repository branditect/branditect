
-- ⚠ This file used to create a world-open policy on brands.
--
-- The live database no longer has it — supabase/close-rls-2.sql and
-- close-rls-3.sql swept those, and scripts/cross-tenant.mjs proves it by
-- signing in as one user and failing to read another's rows. But re-running
-- THIS file would have put it straight back: PERMISSIVE policies are OR'd, so
-- one USING (true) defeats every scoped policy sitting beside it.
--
-- Replaced with a discovery-based drop and a brand-scoped policy. Dropping by
-- the name this file creates is what let nine open policies survive
-- close-rls.sql.

CREATE TABLE IF NOT EXISTS brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  brand_id TEXT UNIQUE NOT NULL,
  brand_name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  strategy_method TEXT DEFAULT 'skip',
  strategy_text TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'brands'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.brands', r.policyname);
  END LOOP;
END $$;

CREATE POLICY brands_own_brand ON brands
  FOR ALL
  USING      (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── Storage buckets ────────────────────────────────────────────────────────
--
-- THESE WERE TWO MORE LOADED GUNS. Until 2026-09-10 this file created both
-- buckets PUBLIC and gave storage.objects four policies of the shape
--
--   CREATE POLICY "Allow logo reads" ON storage.objects
--     FOR SELECT USING (bucket_id = 'brand-logos');
--
-- which names no user at all: every signed-in person could read, and in the
-- brand-assets case update and delete, every object in the bucket. It is the
-- same failure as the USING (true) policies inbox entry 1 caught, and it got
-- past that guard because the text is not literally "true".
--
-- Worse than merely being open: RLS policies are PERMISSIVE and OR'd, so
-- re-running this file after private-buckets.sql would sit an unscoped policy
-- beside the scoped one and defeat it, invisibly to a policy-reading audit.
--
-- Neither bucket exists in production. app/onboarding/page.tsx uploads to
-- brand-logos and discards the error, so that upload has been failing silently
-- since it was written; the logos that do exist went to brand-assets through
-- /api/brand-assets/upload.
--
-- The buckets are created private. The scoped storage.objects policies live in
-- one place, supabase/private-buckets.sql, rather than being repeated here --
-- two files creating the same policy is the drift this codebase keeps paying
-- for.

INSERT INTO storage.buckets (id, name, public) VALUES ('brand-logos', 'brand-logos', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-strategy', 'brand-strategy', false) ON CONFLICT (id) DO NOTHING;

-- Discovery-based: removes the open policies wherever a previous run of this
-- file left them, and creates nothing in their place.
DROP POLICY IF EXISTS "Allow logo uploads"     ON storage.objects;
DROP POLICY IF EXISTS "Allow logo reads"       ON storage.objects;
DROP POLICY IF EXISTS "Allow strategy uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow strategy reads"   ON storage.objects;
