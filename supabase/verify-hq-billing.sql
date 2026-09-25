-- READ ONLY. Checks that supabase/hq-billing.sql and supabase/hq-accounts.sql
-- took. Paste into Supabase > SQL Editor > Run; every row should say ok = true.

select 'table ' || t as check, to_regclass('public.' || t) is not null as ok
  from unnest(array['brand_plan', 'brand_budget', 'platform_budget', 'budget_reservations',
                    'usage_events', 'brand_activity_days', 'hq_audit']) t
union all
select 'column ' || c, exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = split_part(c, '.', 1) and column_name = split_part(c, '.', 2))
  from unnest(array['brands.last_active_at', 'brands.storage_bytes',
                    'brand_documents.content_sha256', 'brand_guideline.content_sha256']) c
union all
select 'constraint ' || n, exists (select 1 from pg_constraint where conname = n)
  from unnest(array['within_cost', 'within_credits']) n
union all
select 'function ' || f, exists (select 1 from pg_proc where proname = f)
  from unnest(array['budget_tier_caps', 'budget_ensure', 'budget_reserve', 'budget_settle',
                    'budget_expire_stale', 'touch_brand_activity', 'hq_accounts', 'hq_account', 'hq_set_plan']) f
union all
select 'rls on ' || t, coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.' || t)), false)
  from unnest(array['brand_plan', 'brand_budget', 'platform_budget', 'budget_reservations',
                    'usage_events', 'brand_activity_days', 'hq_audit']) t
union all
select 'no customer can call ' || f,
       not has_function_privilege('authenticated', p.oid, 'execute')
  from unnest(array['budget_reserve', 'budget_settle', 'hq_accounts', 'hq_set_plan']) f
  join pg_proc p on p.proname = f
order by 1;
