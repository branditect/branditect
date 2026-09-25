-- ═══════════════════════════════════════════════════════════════════════════
-- HQ · Accounts: the read. spec: branditect-ui/spec/hq-accounts.md Part 2.
--
-- Run AFTER supabase/hq-billing.sql. Not applied by code.
--
-- METADATA ONLY. This function is the only thing HQ reads, and it reads
-- counts, sizes, timestamps, tiers and spend. It never selects a content
-- column: not brands.strategy_text, not onboarding.answers or .voice, not
-- brand_documents.extracted_text/description, not brand_strategies, brand_tone,
-- catalog_products costs, or anything Studio wrote. lib/hq-sentinel.test.ts
-- reads this file and fails if one appears. MERGE BLOCKER (criterion 11).
--
-- Readiness is computed from the same four inputs the customer's Home uses
-- (lib/readiness.ts) — the questionnaire STATUS, never the answers; the
-- guideline as a boolean, never the URL.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function hq_accounts()
returns jsonb
language sql
security definer
stable
set search_path = public
as $fn$
  with
  b as (
    select br.brand_id, br.brand_name, br.user_id, br.created_at, br.last_active_at
      from brands br
  ),
  owners as (
    select u.id, u.email from auth.users u
  ),
  storage as (
    select (storage.foldername(o.name))[1] as brand_id,
           coalesce(sum((o.metadata->>'size')::bigint), 0) as bytes,
           count(*) as files
      from storage.objects o
     where o.bucket_id in ('brand-logos', 'brand-strategy', 'brand-assets', 'brand-documents', 'brand-images')
     group by 1
  ),
  docs as (
    select d.brand_id,
           count(*) filter (where d.file_type not in ('pptx', 'ppt', 'key', 'odp')) as documents,
           count(*) filter (where d.file_type in ('pptx', 'ppt', 'key', 'odp'))     as presentations
      from brand_documents d
     group by 1
  ),
  imgs as (
    select i.brand_id, count(*) filter (where i.category in ('product', 'brand')) as brand_images
      from brand_images i
     group by 1
  ),
  links as (
    select t.brand_id, count(*) as links from brand_templates t group by 1
  ),
  gate as (
    select o.brand_id, o.status from onboarding o
  ),
  guideline as (
    select v.brand_id, (nullif(v.guideline_url, '') is not null) as has_guideline
      from brand_visual v
  ),
  use30 as (
    select e.brand_id,
           coalesce(sum(e.cost_cents) filter (where e.ok and e.kind in ('image', 'copy', 'chat')), 0)  as cost_credits,
           coalesce(sum(e.cost_cents) filter (where e.ok and e.kind in ('index', 'analyse')), 0)       as cost_indexing,
           coalesce(sum(e.cost_cents) filter (where not e.ok), 0)                                       as cost_failures,
           count(*) filter (where e.kind in ('image', 'copy', 'chat'))                                  as generations,
           count(*) filter (where e.kind in ('image', 'copy', 'chat') and not e.ok)                     as generation_failures,
           count(*) filter (where e.kind = 'index')                                                     as indexed,
           count(*) filter (where e.created_at > now() - interval '7 days')                             as events_7d,
           count(*) filter (where e.created_at > now() - interval '7 days' and not e.ok)                as failures_7d
      from usage_events e
     where e.created_at > now() - interval '30 days'
     group by 1
  ),
  month as (
    select e.brand_id, coalesce(sum(e.cost_cents), 0) as cost_month
      from usage_events e
     where e.created_at >= date_trunc('month', now())
     group by 1
  ),
  days as (
    select a.brand_id, array_agg(a.day order by a.day) as days
      from brand_activity_days a
     where a.day > current_date - 14
     group by 1
  ),
  rows as (
    select
      b.brand_id,
      b.brand_name,
      ow.email                                      as owner_email,
      b.created_at                                  as signed_up_at,
      b.last_active_at,
      coalesce(dy.days, '{}')                       as active_days,
      coalesce(p.tier, 'free')                      as tier,
      coalesce(p.status, 'active')                  as status,
      coalesce(p.mrr_cents, 0)                      as mrr_cents,
      p.trial_ends_at,
      p.storage_cap_bytes_override,
      bg.credits_cap, bg.credits_used, bg.cost_cap_cents, bg.cost_used_cents, bg.period,
      coalesce(st.bytes, 0)                         as storage_bytes,
      coalesce(st.files, 0)                         as storage_files,
      gt.status                                     as questionnaire_status,
      coalesce(dc.documents, 0)                     as documents,
      coalesce(dc.presentations, 0)                 as presentations,
      coalesce(ln.links, 0)                         as links,
      coalesce(im.brand_images, 0)                  as brand_images,
      coalesce(gl.has_guideline, false)             as has_guideline,
      coalesce(u.cost_credits, 0)                   as cost_credits_30d,
      coalesce(u.cost_indexing, 0)                  as cost_indexing_30d,
      coalesce(u.cost_failures, 0)                  as cost_failures_30d,
      coalesce(u.generations, 0)                    as generations_30d,
      coalesce(u.generation_failures, 0)            as generation_failures_30d,
      coalesce(u.indexed, 0)                        as indexed_30d,
      coalesce(u.events_7d, 0)                      as events_7d,
      coalesce(u.failures_7d, 0)                    as failures_7d,
      coalesce(m.cost_month, 0)                     as cost_month_cents
    from b
    left join owners ow         on ow.id = b.user_id
    left join brand_plan p      on p.brand_id = b.brand_id
    left join brand_budget bg   on bg.brand_id = b.brand_id
    left join storage st        on st.brand_id = b.brand_id
    left join gate gt           on gt.brand_id = b.brand_id
    left join docs dc           on dc.brand_id = b.brand_id
    left join links ln          on ln.brand_id = b.brand_id
    left join imgs im           on im.brand_id = b.brand_id
    left join guideline gl      on gl.brand_id = b.brand_id
    left join use30 u           on u.brand_id = b.brand_id
    left join month m           on m.brand_id = b.brand_id
    left join days dy           on dy.brand_id = b.brand_id
  )
  select jsonb_build_object(
    'generated_at', now(),
    'rows', coalesce((select jsonb_agg(to_jsonb(r)) from rows r), '[]'::jsonb),
    'totals', jsonb_build_object(
      'accounts',        (select count(*) from b),
      'new_7d',          (select count(*) from b where b.created_at > now() - interval '7 days'),
      'active_7d',       (select count(*) from b where b.last_active_at > now() - interval '7 days'),
      'mrr_cents',       (select coalesce(sum(p.mrr_cents), 0) from brand_plan p where p.status in ('active', 'past_due')),
      'mrr_last_month_cents', (
        select coalesce(sum(p.mrr_cents), 0) from brand_plan p
         where p.started_at < date_trunc('month', now())
           and (p.cancelled_at is null or p.cancelled_at >= date_trunc('month', now()))
           and p.status <> 'trialing'),
      'cost_month_cents',      (select coalesce(sum(e.cost_cents), 0) from usage_events e where e.created_at >= date_trunc('month', now())),
      'cost_last_month_cents', (select coalesce(sum(e.cost_cents), 0) from usage_events e
                                 where e.created_at >= date_trunc('month', now()) - interval '1 month'
                                   and e.created_at <  date_trunc('month', now())),
      'trials_ending_7d', (select count(*) from brand_plan p where p.status = 'trialing'
                             and p.trial_ends_at between now() and now() + interval '7 days'),
      'platform_today', (select jsonb_build_object('spend_cents', pb.spend_cents,
                                                   'soft_alert_cents', pb.soft_alert_cents,
                                                   'hard_stop_cents', pb.hard_stop_cents,
                                                   'soft_alerted_at', pb.soft_alerted_at)
                           from platform_budget pb where pb.day = current_date)
    )
  );
$fn$;

-- One account, still metadata only: 90 days of activity and usage by kind.
create or replace function hq_account(p_brand text)
returns jsonb
language sql
security definer
stable
set search_path = public
as $fn$
  select jsonb_build_object(
    'activity_days', coalesce((select array_agg(a.day order by a.day) from brand_activity_days a
                                where a.brand_id = p_brand and a.day > current_date - 90), '{}'),
    'usage_by_kind', coalesce((
      select jsonb_agg(jsonb_build_object('kind', k.kind, 'events', k.events, 'failures', k.failures,
                                          'cost_cents', k.cost_cents, 'credits', k.credits) order by k.cost_cents desc)
        from (select e.kind, count(*) events, count(*) filter (where not e.ok) failures,
                     sum(e.cost_cents) cost_cents, sum(e.credits) credits
                from usage_events e
               where e.brand_id = p_brand and e.created_at > now() - interval '90 days'
               group by e.kind) k), '[]'::jsonb),
    'usage_by_day', coalesce((
      select jsonb_agg(jsonb_build_object('day', d.day, 'cost_cents', d.cost_cents, 'events', d.events) order by d.day)
        from (select e.created_at::date as day, sum(e.cost_cents) cost_cents, count(*) events
                from usage_events e
               where e.brand_id = p_brand and e.created_at > now() - interval '90 days'
               group by 1) d), '[]'::jsonb),
    'audit', coalesce((
      select jsonb_agg(jsonb_build_object('at', h.created_at, 'operator', h.operator_email, 'action', h.action) order by h.created_at desc)
        from (select * from hq_audit where target_brand = p_brand order by created_at desc limit 20) h), '[]'::jsonb)
  );
$fn$;

-- Plan changes from HQ go through this, so the budget follows the tier.
-- Raising a cap takes effect at once; lowering one never takes cost_used
-- past it (the CHECK would reject that), so the used figure is clamped.
create or replace function hq_set_plan(
  p_brand text, p_tier text, p_status text, p_mrr_cents int, p_trial_ends_at timestamptz
)
returns void
language plpgsql security definer set search_path = public as $fn$
declare
  c record;
begin
  insert into brand_plan (brand_id, tier, status, mrr_cents, trial_ends_at, updated_at)
  values (p_brand, p_tier, p_status, p_mrr_cents, p_trial_ends_at, now())
  on conflict (brand_id) do update
    set tier = excluded.tier, status = excluded.status, mrr_cents = excluded.mrr_cents,
        trial_ends_at = excluded.trial_ends_at, updated_at = now(),
        cancelled_at = case when excluded.status = 'cancelled' then coalesce(brand_plan.cancelled_at, now()) else null end;

  select coalesce(p.credits_cap_override, t.credits_cap) as credits_cap,
         coalesce(p.cost_cap_cents_override, t.cost_cap_cents) as cost_cap_cents,
         t.period
    into c
    from brand_plan p cross join lateral budget_tier_caps(p.tier) t
   where p.brand_id = p_brand;

  perform budget_ensure(p_brand);
  update brand_budget
     set credits_cap = c.credits_cap,
         cost_cap_cents = c.cost_cap_cents,
         period = c.period,
         credits_used = least(credits_used, c.credits_cap),
         cost_used_cents = least(cost_used_cents, c.cost_cap_cents),
         updated_at = now()
   where brand_id = p_brand;
end $fn$;

revoke all on function hq_accounts() from public, anon, authenticated;
revoke all on function hq_account(text) from public, anon, authenticated;
revoke all on function hq_set_plan(text, text, text, int, timestamptz) from public, anon, authenticated;
grant execute on function hq_accounts() to service_role;
grant execute on function hq_account(text) to service_role;
grant execute on function hq_set_plan(text, text, text, int, timestamptz) to service_role;
