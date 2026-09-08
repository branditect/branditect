-- The full RLS picture: every table, whether RLS is on, and every policy.
--
-- Two things in here. Run the whole block once.
--
-- WHY A FUNCTION. pg_policies and pg_class are not reachable through
-- PostgREST, so a script cannot read them directly. supabase/close-rls-2.sql
-- already added rls_open_policies() for the narrow "is anything world-open"
-- question. This adds the wider inventory so `npm run rls:audit` can list
-- every table and flag the ones with RLS switched off, rather than only the
-- ones with a bad policy.
--
-- A table with RLS DISABLED has no policies at all, so a check that looks only
-- at policies reports it as clean. That is the gap this closes.
--
-- The function is SECURITY DEFINER and returns catalogue metadata only —
-- table names, a boolean, and policy names. It never returns a row from any
-- table. Execute is granted to service_role alone.

CREATE OR REPLACE FUNCTION public.rls_inventory()
RETURNS TABLE (
  table_name   text,
  rls_enabled  boolean,
  policy_count integer,
  policies     text[]
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT c.relname::text,
         c.relrowsecurity,
         COALESCE(p.n, 0)::integer,
         COALESCE(p.names, ARRAY[]::text[])
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN (
    SELECT tablename, count(*) AS n, array_agg(policyname ORDER BY policyname) AS names
    FROM pg_policies WHERE schemaname = 'public' GROUP BY tablename
  ) p ON p.tablename = c.relname
  WHERE n.nspname = 'public' AND c.relkind = 'r'
  ORDER BY c.relrowsecurity, c.relname;
$$;

REVOKE ALL ON FUNCTION public.rls_inventory() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rls_inventory() TO service_role;

-- ── the same thing as a one-off read, if you would rather not add a function ──
-- Run this on its own, as a separate paste. It changes nothing.
--
--   SELECT c.relname AS table_name,
--          c.relrowsecurity AS rls_enabled,
--          COALESCE(p.n, 0) AS policy_count,
--          COALESCE(p.names, ARRAY[]::text[]) AS policies
--   FROM pg_class c
--   JOIN pg_namespace n ON n.oid = c.relnamespace
--   LEFT JOIN (
--     SELECT tablename, count(*) AS n, array_agg(policyname ORDER BY policyname) AS names
--     FROM pg_policies WHERE schemaname = 'public' GROUP BY tablename
--   ) p ON p.tablename = c.relname
--   WHERE n.nspname = 'public' AND c.relkind = 'r'
--   ORDER BY c.relrowsecurity, c.relname;
