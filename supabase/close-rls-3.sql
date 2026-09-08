-- Four tables let one tester read another's rows. Confirmed over the wire.
--
-- Paste this whole block into the Supabase SQL editor and run it once. Every
-- statement is idempotent.
--
-- HOW THESE WERE FOUND. Not by reading policies — by signing in as user A with
-- the anon key and a real JWT, exactly as the browser does, and selecting
-- user B's rows. scripts/cross-tenant.mjs, which seeds B with a real row in
-- every table first, because a table nobody can read because it is empty
-- proves nothing.
--
--   LEAKS  brand_book_assets   A read 1 of B's rows
--   LEAKS  mission_goals       A read 1 of B's rows
--   LEAKS  mission_notes       A read 1 of B's rows
--   LEAKS  mission_tasks       A read 1 of B's rows
--
-- close-rls.sql and close-rls-2.sql swept the tables that existed when they
-- were written. These four were missed: the mission_* tables belong to a
-- surface that is no longer in the nav, and brand_book_assets is written by
-- the brand book flow. Being unreachable in the UI does not make a table
-- unreadable over PostgREST — the browser holds the anon key and can select
-- from anything RLS allows.

ALTER TABLE brand_book_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_goals     ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_notes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_tasks     ENABLE ROW LEVEL SECURITY;

-- Drop by discovery, not by name.
--
-- close-rls.sql dropped only the policy name it creates, so nine PERMISSIVE
-- `USING (true)` policies survived it — and Postgres ORs permissive policies,
-- so one of those defeats every correct policy beside it. Sweep whatever is
-- actually there.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('brand_book_assets','mission_goals','mission_notes','mission_tasks')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

CREATE POLICY brand_book_assets_own_brand ON brand_book_assets
  FOR ALL
  USING      (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY mission_goals_own_brand ON mission_goals
  FOR ALL
  USING      (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY mission_notes_own_brand ON mission_notes
  FOR ALL
  USING      (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()));

CREATE POLICY mission_tasks_own_brand ON mission_tasks
  FOR ALL
  USING      (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()))
  WITH CHECK (brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid()));

-- ── two tables this could not prove anything about ─────────────────────────
--
-- brand_templates: its brand_id is a UUID, while every other table keys brands
-- by TEXT. Nothing could be seeded for it, so its RLS is UNVERIFIED rather
-- than closed. The type mismatch is worth resolving on its own.
--
-- social_strategy: does not exist. The application references it —
-- app/(app)/brand/channels reads it — and PostgREST reports no such table, so
-- that read has been failing silently for as long as it has been there.
--
-- Neither is fixed here, because guessing at a table that is not there or a
-- key type that disagrees with the rest of the schema is how the previous two
-- sweeps left work behind.
