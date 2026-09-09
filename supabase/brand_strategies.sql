
-- ⚠ This file used to create a world-open policy on brand_strategies.
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

CREATE TABLE IF NOT EXISTS brand_strategies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id TEXT NOT NULL DEFAULT 'vetra',
  user_id UUID REFERENCES auth.users(id),
  category TEXT,
  answers JSONB DEFAULT '{}',
  generated_strategy TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE brand_strategies ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'brand_strategies'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.brand_strategies', r.policyname);
  END LOOP;
END $$;

CREATE POLICY brand_strategies_own_brand ON brand_strategies
  FOR ALL
  USING      (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()));
