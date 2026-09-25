-- ═══════════════════════════════════════════════════════════════════════════
-- HQ data layer: plans, the spend ceiling, and the usage ledger.
-- spec: branditect-ui/spec/hq.md ("What to record") and
--       branditect-ui/spec/hq-accounts.md Part 1 ("The guarantee").
--
-- NOT APPLIED BY CODE. Run by hand in Supabase > SQL Editor, then run
-- supabase/verify-hq-billing.sql to check it took.
--
-- Everything here is written for the service role only. No table below has a
-- policy for `authenticated` or `anon`: a customer never reads a ledger row,
-- and HQ reads them server-side. RLS is still enabled on every table so that a
-- missing grant fails closed rather than open.
--
-- No `do $$ … $$` blocks (the SQL Editor splits on semicolons). Function
-- bodies use $fn$ … $fn$ and are fine.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. Plans ───────────────────────────────────────────────────────────────
-- One row per brand. A brand with no row is on Free: the code reads a missing
-- row as tier 'free', and budget_ensure() below creates the budget from it.

create table if not exists brand_plan (
  brand_id          text primary key,
  tier              text not null default 'free'
                    check (tier in ('free', 'pro', 'pro_plus', 'enterprise')),
  status            text not null default 'active'
                    check (status in ('active', 'trialing', 'past_due', 'cancelled')),
  seats             int  not null default 1 check (seats >= 1),
  mrr_cents         int  not null default 0 check (mrr_cents >= 0),  -- what they pay, not list price
  currency          text not null default 'EUR',
  trial_ends_at     timestamptz,
  started_at        timestamptz default now(),
  cancelled_at      timestamptz,
  -- Enterprise is "agreed": per-contract caps override the tier table.
  credits_cap_override    int,
  cost_cap_cents_override int,
  storage_cap_bytes_override bigint,
  updated_at        timestamptz not null default now()
);

alter table brand_plan enable row level security;
revoke all on brand_plan from anon, authenticated;


-- ── 2. The two counters ────────────────────────────────────────────────────
-- credits_*: what the customer sees. Spent only by a successful generation.
-- cost_*:    what protects us. Debited by EVERY paid call — generation,
--            indexing, failures, retries — in euro cents.
--
-- THE CHECK CONSTRAINTS ARE THE GUARANTEE (hq-accounts.md criterion 6). Every
-- other line in this file is code that can have a bug. A write that would
-- take cost_used_cents past cost_cap_cents fails, whoever makes it.

create table if not exists brand_budget (
  brand_id         text primary key,
  credits_cap      int     not null check (credits_cap >= 0),
  credits_used     int     not null default 0 check (credits_used >= 0),
  cost_cap_cents   int     not null check (cost_cap_cents >= 0),
  cost_used_cents  numeric(12,4) not null default 0 check (cost_used_cents >= 0),
  -- 'once': Free — 100 credits, no reset. 'month': paid tiers reset monthly.
  period           text    not null default 'once' check (period in ('once', 'month')),
  period_start     date    not null default current_date,
  updated_at       timestamptz not null default now(),
  constraint within_cost    check (cost_used_cents <= cost_cap_cents),
  constraint within_credits check (credits_used <= credits_cap)
);

alter table brand_budget enable row level security;
revoke all on brand_budget from anon, authenticated;


-- ── 3. The backstop: a platform ceiling ────────────────────────────────────
-- Per-account caps protect against one heavy customer. They do not protect
-- against a bug: a loop in a useEffect burns a hundred accounts' budget while
-- every individual cap holds. Every reservation debits today's row too.

create table if not exists platform_budget (
  day               date primary key,
  spend_cents       numeric(12,4) not null default 0,
  soft_alert_cents  int not null default 2000,   -- tell the operator
  hard_stop_cents   int not null default 6000,   -- stop every paid route
  soft_alerted_at   timestamptz
);

alter table platform_budget enable row level security;
revoke all on platform_budget from anon, authenticated;


-- ── 4. Reservations ────────────────────────────────────────────────────────
-- Reserve before the provider call, settle after it. A reservation that is
-- never settled (the function was killed mid-call) stays charged at its
-- estimate — the conservative outcome — and budget_expire_stale() closes it.

create table if not exists budget_reservations (
  id              uuid primary key default gen_random_uuid(),
  brand_id        text not null,
  user_id         uuid,
  kind            text not null check (kind in ('image', 'copy', 'chat', 'index', 'analyse')),
  route           text not null,
  estimate_cents  numeric(12,4) not null check (estimate_cents >= 0),
  credits         int  not null default 0 check (credits >= 0),
  day             date not null default current_date,  -- platform_budget row it debited
  status          text not null default 'open' check (status in ('open', 'settled', 'refunded')),
  created_at      timestamptz not null default now(),
  settled_at      timestamptz
);

create index if not exists budget_reservations_open_idx
  on budget_reservations (created_at) where status = 'open';

alter table budget_reservations enable row level security;
revoke all on budget_reservations from anon, authenticated;


-- ── 5. The ledger ──────────────────────────────────────────────────────────
-- One row per request that reached (or tried to reach) a provider. HQ is
-- built on this table. Metadata only: no prompt, no output, no file name.

create table if not exists usage_events (
  id              bigserial primary key,
  brand_id        text not null,
  user_id         uuid,
  reservation_id  uuid,
  kind            text not null check (kind in ('image', 'copy', 'chat', 'index', 'analyse')),
  route           text not null,
  model           text,
  units           numeric,            -- tokens, pages, or 1 per image
  input_tokens    int,
  output_tokens   int,
  cost_cents      numeric(12,4) not null check (cost_cents >= 0),  -- OUR cost, not the price
  credits         int not null default 0,  -- what the customer was charged (0 on failure)
  ok              boolean not null,
  attempts        smallint not null default 1 check (attempts between 1 and 2),
  error_code      text,               -- short machine code, never a provider message
  created_at      timestamptz not null default now()
);

create index if not exists usage_events_brand_idx on usage_events (brand_id, created_at desc);
create index if not exists usage_events_time_idx  on usage_events (created_at desc);

alter table usage_events enable row level security;
revoke all on usage_events from anon, authenticated;
grant usage, select on sequence usage_events_id_seq to service_role;


-- ── 6. Activity and storage ────────────────────────────────────────────────
-- last_active_at: one throttled write per authenticated request (lib/activity.ts).
-- brand_activity_days: one row per brand per active day, for the 14-day
-- sparkline. A date is "34 days ago"; the shape is "faded for two weeks first".

alter table brands add column if not exists last_active_at timestamptz;
alter table brands add column if not exists storage_bytes  bigint default 0;

create table if not exists brand_activity_days (
  brand_id  text not null,
  day       date not null,
  primary key (brand_id, day)
);

alter table brand_activity_days enable row level security;
revoke all on brand_activity_days from anon, authenticated;


-- ── 7. Index once ──────────────────────────────────────────────────────────
-- A document already indexed is never indexed again (criterion 5). The hash
-- is of the file bytes, computed server-side before any provider call.

alter table brand_documents add column if not exists content_sha256 text;
create index if not exists brand_documents_hash_idx on brand_documents (brand_id, content_sha256);


-- ── 8. HQ audit log ────────────────────────────────────────────────────────
-- Every HQ page view and every HQ action. Who, what, which brand, when.

create table if not exists hq_audit (
  id              bigserial primary key,
  operator_id     uuid not null,
  operator_email  text,
  action          text not null,
  target_brand    text,
  details         jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists hq_audit_time_idx on hq_audit (created_at desc);

alter table hq_audit enable row level security;
revoke all on hq_audit from anon, authenticated;
grant usage, select on sequence hq_audit_id_seq to service_role;


-- ═══════════════════════════════════════════════════════════════════════════
-- Functions. security definer, callable by service_role only.
-- ═══════════════════════════════════════════════════════════════════════════

-- Tier defaults (hq-accounts.md Part 1 table). One place; lib/plans.ts mirrors
-- it for display and a test asserts the two agree.
create or replace function budget_tier_caps(p_tier text)
returns table (credits_cap int, cost_cap_cents int, period text)
language sql immutable as $fn$
  select t.credits_cap, t.cost_cap_cents, t.period from (values
    ('free',        100,   220, 'once'),
    ('pro',         350,  1100, 'month'),
    ('pro_plus',    600,  1800, 'month'),
    -- Enterprise is agreed per contract; until it is, it gets Pro Plus.
    ('enterprise',  600,  1800, 'month')
  ) t(tier, credits_cap, cost_cap_cents, period)
  where t.tier = coalesce(p_tier, 'free');
$fn$;

-- The budget row for a brand, created from its plan if missing, and rolled
-- over if a monthly period has ended. Called inside budget_reserve().
create or replace function budget_ensure(p_brand text)
returns void
language plpgsql security definer set search_path = public as $fn$
declare
  v_tier text;
  v_credits int;
  v_cost int;
  v_period text;
begin
  select coalesce(p.tier, 'free'),
         coalesce(p.credits_cap_override, c.credits_cap),
         coalesce(p.cost_cap_cents_override, c.cost_cap_cents),
         c.period
    into v_tier, v_credits, v_cost, v_period
    from (select 1) one
    left join brand_plan p on p.brand_id = p_brand
    cross join lateral budget_tier_caps(coalesce(p.tier, 'free')) c;

  insert into brand_budget (brand_id, credits_cap, cost_cap_cents, period, period_start)
  values (p_brand, v_credits, v_cost, v_period,
          case when v_period = 'month' then date_trunc('month', now())::date else current_date end)
  on conflict (brand_id) do nothing;

  -- Monthly roll-over. Free ('once') never resets.
  update brand_budget
     set credits_used = 0, cost_used_cents = 0,
         period_start = date_trunc('month', now())::date,
         updated_at = now()
   where brand_id = p_brand
     and period = 'month'
     and period_start < date_trunc('month', now())::date;
end $fn$;

-- RESERVE BEFORE YOU CALL. Atomic: the UPDATE … WHERE used + estimate <= cap
-- is the refusal — there is no separate read, so two concurrent requests
-- against the last credit cannot both pass (criterion 1).
--
-- Returns {ok, reservation_id, remaining_cents, remaining_credits, soft_alert}
-- or {ok:false, reason: 'platform' | 'credits' | 'cost'}.
create or replace function budget_reserve(
  p_brand text, p_user uuid, p_kind text, p_route text,
  p_estimate_cents numeric, p_credits int
)
returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare
  v_prev_spend numeric;
  v_soft int;
  v_budget brand_budget;
  v_id uuid;
begin
  if p_estimate_cents is null or p_estimate_cents < 0 or p_credits is null or p_credits < 0 then
    raise exception 'budget_reserve: invalid estimate' using errcode = '22023';
  end if;

  perform budget_ensure(p_brand);

  -- The account first, so a refusal names the account's own limit ("this
  -- document needs about N credits") rather than blaming the platform.
  update brand_budget
     set cost_used_cents = cost_used_cents + p_estimate_cents,
         credits_used    = credits_used + p_credits,
         updated_at      = now()
   where brand_id = p_brand
     and cost_used_cents + p_estimate_cents <= cost_cap_cents
     and credits_used + p_credits <= credits_cap
  returning * into v_budget;

  if not found then
    select * into v_budget from brand_budget where brand_id = p_brand;
    return jsonb_build_object(
      'ok', false,
      'reason', case when v_budget.credits_used + p_credits > v_budget.credits_cap then 'credits' else 'cost' end,
      'remaining_cents', v_budget.cost_cap_cents - v_budget.cost_used_cents,
      'remaining_credits', v_budget.credits_cap - v_budget.credits_used
    );
  end if;

  -- Then the platform. Past the hard stop every paid route is refused
  -- (criterion 8), and the account's debit above is given back in the same
  -- transaction, so nobody ever saw it.
  insert into platform_budget (day) values (current_date) on conflict (day) do nothing;
  update platform_budget
     set spend_cents = spend_cents + p_estimate_cents
   where day = current_date
     and spend_cents + p_estimate_cents <= hard_stop_cents
  returning spend_cents - p_estimate_cents, soft_alert_cents into v_prev_spend, v_soft;
  if not found then
    update brand_budget
       set cost_used_cents = cost_used_cents - p_estimate_cents,
           credits_used    = credits_used - p_credits,
           updated_at      = now()
     where brand_id = p_brand;
    return jsonb_build_object('ok', false, 'reason', 'platform');
  end if;

  insert into budget_reservations (brand_id, user_id, kind, route, estimate_cents, credits)
  values (p_brand, p_user, p_kind, p_route, p_estimate_cents, p_credits)
  returning id into v_id;

  -- Crossing the soft line exactly once per day marks it for HQ.
  if v_prev_spend < v_soft and v_prev_spend + p_estimate_cents >= v_soft then
    update platform_budget set soft_alerted_at = now() where day = current_date and soft_alerted_at is null;
  end if;

  return jsonb_build_object(
    'ok', true,
    'reservation_id', v_id,
    'remaining_cents', v_budget.cost_cap_cents - v_budget.cost_used_cents,
    'remaining_credits', v_budget.credits_cap - v_budget.credits_used,
    'soft_alert', v_prev_spend < v_soft and v_prev_spend + p_estimate_cents >= v_soft
  );
end $fn$;

-- SETTLE AFTER THE CALL.
--   p_reached_provider = false: a pre-flight failure (missing key, invalid
--     input, refused request). Nothing left the building: refund all of it
--     (criterion 3). No ledger row — there was no cost.
--   p_reached_provider = true, p_ok = false: the provider charged for the
--     attempt. The cost stays on the budget; the credits go back to the
--     customer (criterion 2).
--   p_ok = true: true the estimate up or down to the real cost, keep the
--     credits.
-- The true-up never takes cost_used past the cap: if the real cost beat the
-- estimate the ledger records the real figure and the budget stops at its cap.
-- Idempotent: a second settle of the same reservation does nothing.
create or replace function budget_settle(
  p_reservation uuid, p_reached_provider boolean, p_ok boolean,
  p_actual_cents numeric, p_model text, p_units numeric,
  p_input_tokens int, p_output_tokens int, p_attempts int, p_error_code text
)
returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare
  r budget_reservations;
  v_delta numeric;
  v_credits int;
begin
  if p_attempts is not null and (p_attempts < 1 or p_attempts > 2) then
    raise exception 'budget_settle: at most one retry per reservation' using errcode = '22023';
  end if;

  select * into r from budget_reservations where id = p_reservation for update;
  if not found or r.status <> 'open' then
    return jsonb_build_object('ok', false, 'reason', 'not_open');
  end if;

  if not p_reached_provider then
    update brand_budget
       set cost_used_cents = greatest(0, cost_used_cents - r.estimate_cents),
           credits_used    = greatest(0, credits_used - r.credits),
           updated_at      = now()
     where brand_id = r.brand_id;
    update platform_budget set spend_cents = greatest(0, spend_cents - r.estimate_cents) where day = r.day;
    update budget_reservations set status = 'refunded', settled_at = now() where id = r.id;
    return jsonb_build_object('ok', true, 'refunded', true);
  end if;

  v_delta   := coalesce(p_actual_cents, r.estimate_cents) - r.estimate_cents;
  v_credits := case when p_ok then r.credits else 0 end;

  update brand_budget
     set cost_used_cents = least(cost_cap_cents, greatest(0, cost_used_cents + v_delta)),
         credits_used    = greatest(0, credits_used - (r.credits - v_credits)),
         updated_at      = now()
   where brand_id = r.brand_id;
  update platform_budget set spend_cents = greatest(0, spend_cents + v_delta) where day = r.day;
  update budget_reservations set status = 'settled', settled_at = now() where id = r.id;

  insert into usage_events (brand_id, user_id, reservation_id, kind, route, model, units,
                            input_tokens, output_tokens, cost_cents, credits, ok, attempts, error_code)
  values (r.brand_id, r.user_id, r.id, r.kind, r.route, p_model, p_units,
          p_input_tokens, p_output_tokens, coalesce(p_actual_cents, r.estimate_cents),
          v_credits, p_ok, coalesce(p_attempts, 1), p_error_code);

  return jsonb_build_object('ok', true, 'refunded', false);
end $fn$;

-- Reservations the app never settled (function killed mid-call). They stay
-- charged at the estimate — the money may well have left — and get a ledger
-- row so HQ sees them. Called by HQ on load; cheap when there are none.
create or replace function budget_expire_stale(p_older_than interval default interval '15 minutes')
returns int
language plpgsql security definer set search_path = public as $fn$
declare
  n int := 0;
  r budget_reservations;
begin
  for r in
    select * from budget_reservations
     where status = 'open' and created_at < now() - p_older_than
     for update skip locked
  loop
    update brand_budget
       set credits_used = greatest(0, credits_used - r.credits), updated_at = now()
     where brand_id = r.brand_id;
    update budget_reservations set status = 'settled', settled_at = now() where id = r.id;
    insert into usage_events (brand_id, user_id, reservation_id, kind, route, cost_cents, credits, ok, error_code)
    values (r.brand_id, r.user_id, r.id, r.kind, r.route, r.estimate_cents, 0, false, 'never_settled');
    n := n + 1;
  end loop;
  return n;
end $fn$;

-- Activity: throttled so it is not its own write load. Returns nothing.
create or replace function touch_brand_activity(p_brand text)
returns void
language sql security definer set search_path = public as $fn$
  update brands set last_active_at = now()
   where brand_id = p_brand
     and (last_active_at is null or last_active_at < now() - interval '5 minutes');
  insert into brand_activity_days (brand_id, day) values (p_brand, current_date)
  on conflict do nothing;
$fn$;

revoke all on function budget_tier_caps(text) from public, anon, authenticated;
revoke all on function budget_ensure(text) from public, anon, authenticated;
revoke all on function budget_reserve(text, uuid, text, text, numeric, int) from public, anon, authenticated;
revoke all on function budget_settle(uuid, boolean, boolean, numeric, text, numeric, int, int, int, text) from public, anon, authenticated;
revoke all on function budget_expire_stale(interval) from public, anon, authenticated;
revoke all on function touch_brand_activity(text) from public, anon, authenticated;

grant execute on function budget_tier_caps(text) to service_role;
grant execute on function budget_ensure(text) to service_role;
grant execute on function budget_reserve(text, uuid, text, text, numeric, int) to service_role;
grant execute on function budget_settle(uuid, boolean, boolean, numeric, text, numeric, int, int, int, text) to service_role;
grant execute on function budget_expire_stale(interval) to service_role;
grant execute on function touch_brand_activity(text) to service_role;

-- The guideline is indexed into its own table; index-once applies there too.
alter table brand_guideline add column if not exists content_sha256 text;
