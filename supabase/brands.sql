
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

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-logos', 'brand-logos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-strategy', 'brand-strategy', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow logo uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'brand-logos');
CREATE POLICY "Allow logo reads" ON storage.objects FOR SELECT USING (bucket_id = 'brand-logos');
CREATE POLICY "Allow strategy uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'brand-strategy');
CREATE POLICY "Allow strategy reads" ON storage.objects FOR SELECT USING (bucket_id = 'brand-strategy');
