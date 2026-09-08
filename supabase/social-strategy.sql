-- Brand ▸ Channels has never worked. The table it reads does not exist.
--
-- Paste this whole block into the Supabase SQL editor and run it once. Every
-- statement is idempotent.
--
-- WHAT WAS FOUND. scripts/cross-tenant.mjs reported social_strategy as
-- UNVERIFIED with "Could not find the table 'public.social_strategy' in the
-- schema cache". The application references it in five places — a read in
-- app/(app)/brand/channels/page.tsx and four writes in
-- app/api/social-strategy/route.ts — so every one of those has been failing
-- for as long as they have been there. The page discards the error
-- (`recordRes.data?.[0]`) and renders its empty state, so it looks like a
-- brand that has not started rather than a surface that cannot work.
--
-- IS IT MEANT TO WORK. Yes. Both copies of spec/routes.md say of the old
-- /dashboard/brand-strategy/social route: "Either add `Channels` as a fifth
-- item under Brand, or park the route and hide the entry." Channels is the
-- fifth item under Brand in lib/nav.ts, so that decision was taken.
--
-- The shape below is derived from what the code already reads and writes: the
-- SocialStrategyRecord interface in the page, and ALLOWED_FIELDS plus the
-- inserts and updates in the route.

CREATE TABLE IF NOT EXISTS social_strategy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id           TEXT NOT NULL,
  channels           TEXT[] NOT NULL DEFAULT '{}',
  primary_goal       TEXT,
  secondary_goal     TEXT,
  capacity_volume    TEXT,
  production_setup   TEXT,
  reference_accounts TEXT[] NOT NULL DEFAULT '{}',
  anti_patterns      TEXT[] NOT NULL DEFAULT '{}',
  -- 'in_progress' on insert, 'awaiting_synthesis' when the answers are done.
  status             TEXT NOT NULL DEFAULT 'in_progress',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The page reads the newest row for a brand.
CREATE INDEX IF NOT EXISTS social_strategy_brand_recent_idx
  ON social_strategy (brand_id, created_at DESC);

-- RLS from the start, not as a later sweep. Four tables were leaking one
-- tester's rows to another this week precisely because they were created
-- without it and nobody went back.
ALTER TABLE social_strategy ENABLE ROW LEVEL SECURITY;

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
