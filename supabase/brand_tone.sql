
-- ⚠ This file used to create a world-open policy on brand_tone.
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

-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS brand_tone (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id TEXT NOT NULL,
  expression_label TEXT,
  expression_text TEXT,
  pillars JSONB,
  dos TEXT[],
  donts TEXT[],
  vocab_yes TEXT[],
  vocab_no TEXT[],
  touchpoints JSONB,
  checklist JSONB,
  setup_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE brand_tone ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'brand_tone'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.brand_tone', r.policyname);
  END LOOP;
END $$;

CREATE POLICY brand_tone_own_brand ON brand_tone
  FOR ALL
  USING      (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()));
