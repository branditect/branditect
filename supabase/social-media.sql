-- Social media: the brainstorm, the plan, and what happened after it posted.
--
-- Paste this whole block into the Supabase SQL editor and run it once. Every
-- statement is idempotent.
--
-- WHY. Brand ▸ Channels asked five questions and then said "the synthesis
-- layer ships in step 2" — the answers were stored and nothing was ever made
-- from them. The five questions are now the ones that produce a plan: which
-- two channels, what social is for, how often you can post, which content
-- pillars, and who you are talking to. The last two are brainstorms seeded
-- from the brand strategy, so they need somewhere to live, and the plan they
-- produce needs somewhere to live.
--
-- WHAT THE LIVE TABLE ALREADY HAS: id, brand_id, channels, primary_goal,
-- secondary_goal, capacity_volume, production_setup, reference_accounts,
-- anti_patterns, status, created_at, updated_at. Nothing below drops any of
-- them: reference_accounts and anti_patterns stop being asked as questions but
-- any answer already stored stays where it is.

-- The two brainstorms, and the plan made from them.
ALTER TABLE social_strategy ADD COLUMN IF NOT EXISTS pillars JSONB NOT NULL DEFAULT '[]';
ALTER TABLE social_strategy ADD COLUMN IF NOT EXISTS audience JSONB NOT NULL DEFAULT '[]';
ALTER TABLE social_strategy ADD COLUMN IF NOT EXISTS plan JSONB;
ALTER TABLE social_strategy ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ;

-- One week of numbers, typed in by hand.
--
-- Typed in, and that is the point for now: the screen says so. Reading these
-- from the platforms means an app registration and a stored token per channel,
-- which is a different piece of work — but the shape of what is worth watching
-- does not change when the numbers start arriving by API instead of by hand,
-- so the table is the same one either way.
CREATE TABLE IF NOT EXISTS social_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id TEXT NOT NULL,
  -- The Monday of the week being reported. One row per channel per week.
  week_start DATE NOT NULL,
  channel TEXT NOT NULL,
  posts INT,
  followers INT,
  reach INT,
  engagements INT,
  -- Whatever the numbers do not say: a post that did unusually well, a week
  -- nobody posted because of a trade fair.
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- One row per brand, week and channel: entering the same week twice edits it
-- rather than adding a second row nobody can tell apart.
CREATE UNIQUE INDEX IF NOT EXISTS social_metrics_one_per_week
  ON social_metrics (brand_id, week_start, channel);

CREATE INDEX IF NOT EXISTS social_metrics_brand_week
  ON social_metrics (brand_id, week_start DESC);

ALTER TABLE social_metrics ENABLE ROW LEVEL SECURITY;

-- NO `DO $$ ... $$` BLOCKS IN THIS FILE, deliberately. The Supabase SQL
-- editor splits a script on semicolons before sending it, and a DO body
-- contains its own — the block arrives cut in half and fails with
-- "syntax error at end of input". The first version of this file used one to
-- drop policies by discovery; it is dropped by name here instead, and the
-- query at the foot of this file finds any that were created under another.

DROP POLICY IF EXISTS social_metrics_own_brand ON social_metrics;

CREATE POLICY social_metrics_own_brand ON social_metrics
  FOR ALL
  USING      (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()));

-- social_strategy is written through the API on the service key, but it holds
-- brand content and must not be readable by another signed-in user either.
ALTER TABLE social_strategy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS social_strategy_own_brand ON social_strategy;

CREATE POLICY social_strategy_own_brand ON social_strategy
  FOR ALL
  USING      (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()));

-- Run this after the rest, and read what comes back. PERMISSIVE policies are
-- OR'd together, so one older policy with `true` in its qual defeats every
-- scoped policy beside it — which is how nine world-open policies survived the
-- first RLS sweep in this project.
--
--   SELECT tablename, policyname, qual FROM pg_policies
--    WHERE tablename IN ('social_strategy', 'social_metrics');
