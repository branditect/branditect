-- ⚠ This file used to open four tables to every signed-in user with
-- `FOR ALL USING (true) WITH CHECK (true)`, and it is not the only file for
-- this table: supabase/social-strategy.sql (hyphen) creates social_strategy
-- with a scoped policy. Two files, one table, opposite intentions.
--
-- Three of these tables — content_pillars, platform_style_guides and
-- social_calendar — are not read or written anywhere in app/, lib/ or
-- components/, so scripts/cross-tenant.mjs never checked them. A table nothing
-- uses is still a table anyone can read.
--
-- Replaced with discovery-based drops and brand-scoped policies. NOT RUN.

-- Social Strategy Architect — schema
-- Run this in Supabase SQL Editor before using the new flow.

CREATE TABLE IF NOT EXISTS social_strategy (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  channels TEXT[] DEFAULT '{}',
  primary_goal TEXT,
  secondary_goal TEXT,
  capacity_volume TEXT,
  production_setup TEXT,
  reference_accounts TEXT[] DEFAULT '{}',
  anti_patterns TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'in_progress',
  strategy_summary JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_strategy_brand ON social_strategy(brand_id);

CREATE TABLE IF NOT EXISTS content_pillars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  social_strategy_id UUID REFERENCES social_strategy(id) ON DELETE CASCADE,
  brand_id TEXT NOT NULL,
  position INT DEFAULT 0,
  name TEXT,
  definition TEXT,
  rationale TEXT,
  topics TEXT[] DEFAULT '{}',
  format_leanings TEXT[] DEFAULT '{}',
  cadence TEXT,
  example_posts JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_pillars_brand ON content_pillars(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_pillars_strategy ON content_pillars(social_strategy_id);

CREATE TABLE IF NOT EXISTS platform_style_guides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  social_strategy_id UUID REFERENCES social_strategy(id) ON DELETE CASCADE,
  brand_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  voice_notes TEXT,
  visual_rules TEXT,
  length_rules TEXT,
  cta_style TEXT,
  hashtag_rules TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_styles_brand ON platform_style_guides(brand_id);
CREATE INDEX IF NOT EXISTS idx_platform_styles_strategy ON platform_style_guides(social_strategy_id);

CREATE TABLE IF NOT EXISTS social_calendar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  social_strategy_id UUID REFERENCES social_strategy(id) ON DELETE CASCADE,
  brand_id TEXT NOT NULL,
  scheduled_for DATE,
  pillar_id UUID REFERENCES content_pillars(id) ON DELETE SET NULL,
  format TEXT,
  hook TEXT,
  platform TEXT,
  body TEXT,
  status TEXT DEFAULT 'draft',
  rationale JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_calendar_brand ON social_calendar(brand_id);
CREATE INDEX IF NOT EXISTS idx_social_calendar_strategy ON social_calendar(social_strategy_id);

ALTER TABLE social_strategy ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_style_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_calendar ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'social_strategy'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.social_strategy', r.policyname);
  END LOOP;
END $$;

CREATE POLICY social_strategy_own_brand ON social_strategy
  FOR ALL
  USING      (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()));
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'content_pillars'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.content_pillars', r.policyname);
  END LOOP;
END $$;

CREATE POLICY content_pillars_own_brand ON content_pillars
  FOR ALL
  USING      (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()));
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'platform_style_guides'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.platform_style_guides', r.policyname);
  END LOOP;
END $$;

CREATE POLICY platform_style_guides_own_brand ON platform_style_guides
  FOR ALL
  USING      (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()));
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'social_calendar'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.social_calendar', r.policyname);
  END LOOP;
END $$;

CREATE POLICY social_calendar_own_brand ON social_calendar
  FOR ALL
  USING      (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()));
