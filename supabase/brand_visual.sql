
-- ⚠ This file used to create a world-open policy on brand_visual.
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

CREATE TABLE IF NOT EXISTS brand_visual (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id TEXT NOT NULL UNIQUE,
  colors JSONB DEFAULT '[]',
  fonts JSONB DEFAULT '[]',
  logo_slots JSONB DEFAULT '{}',
  guideline_url TEXT,
  strategy_text TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE brand_visual ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'brand_visual'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.brand_visual', r.policyname);
  END LOOP;
END $$;

CREATE POLICY brand_visual_own_brand ON brand_visual
  FOR ALL
  USING      (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()));

-- ── Storage bucket for brand library assets ────────────────────────────────
--
-- A LOADED GUN until 2026-09-10, and the worst of the three: these four
-- policies named no user, so any signed-in person could read, UPDATE and
-- DELETE every object in brand-assets -- 43 brand book pages, 15 logos, 5
-- template thumbnails and a guideline PDF, across every tenant.
--
-- ON CONFLICT DO NOTHING means the bucket keeps whatever public flag it
-- already has, so this line does not reopen a bucket that has been made
-- private. The policies had no such protection: CREATE POLICY is additive and
-- RLS is OR'd, so re-running this file beside private-buckets.sql would have
-- put an unscoped policy next to the scoped one and defeated it.
--
-- The scoped policies live in supabase/private-buckets.sql, in one place.

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('brand-assets', 'brand-assets', false, 104857600)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow brand-assets uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow brand-assets reads"   ON storage.objects;
DROP POLICY IF EXISTS "Allow brand-assets updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow brand-assets deletes" ON storage.objects;
