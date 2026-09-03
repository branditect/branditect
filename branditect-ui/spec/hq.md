# HQ — the operator dashboard

What you look at to run Branditect as a business, as opposed to what a customer looks at to run
their brand.

---

## The name

**HQ.** Route `/hq`. "Branditect HQ."

It is short, it is obviously internal, it survives having staff one day, and it does not collide
with anything in the customer nav. `CLAUDE.md` asks for plain nouns a user already knows, and HQ
is one — it just belongs to a different user.

Runner-up: **Console**, if HQ ever reads too playful for an investor screenshare.

Two names to avoid. **Dashboard** — Home already is one, and a word that means two screens means
neither. **Numbers** — taken, and it means the customer's unit economics; the collision would be
worst exactly when you are looking at both.

---

## The thing to settle first

**None of what you want to see is currently recorded.**

- There is no billing. No plans table, no Stripe, no subscription. The `Pro` badge in the sidebar
  is hardcoded text in `components/sidebar.tsx`.
- There are no AI credits. Nothing counts a generation or attributes its cost.
- There is no `last_active_at`. Nothing writes it.
- Storage is not measured per brand.

So HQ is not a reporting job on existing data. **The data layer is the work; the dashboard is the
easy half.** Build it in that order or you will build a beautiful page full of zeroes, which is
the failure mode this app already hit once on Home.

Also worth settling: you said three price groups and then named four tiers. Free is not a price
group. Assume **Free · Pro · Pro Plus · Enterprise** unless you mean something else — the shape of
every chart below depends on it.

### What to record, in this order

```sql
-- 1. Plans. One row per brand. Everything else hangs off this.
CREATE TABLE brand_plan (
  brand_id     TEXT PRIMARY KEY,
  tier         TEXT NOT NULL DEFAULT 'free',   -- free | pro | pro_plus | enterprise
  status       TEXT NOT NULL DEFAULT 'active', -- active | trialing | past_due | cancelled
  seats        INT  NOT NULL DEFAULT 1,
  mrr_cents    INT  NOT NULL DEFAULT 0,        -- what they actually pay, not list price
  currency     TEXT NOT NULL DEFAULT 'EUR',
  trial_ends_at TIMESTAMPTZ,
  started_at   TIMESTAMPTZ DEFAULT now(),
  cancelled_at TIMESTAMPTZ
);

-- 2. Usage. One row per billable action. This is the table HQ is really built on.
CREATE TABLE usage_events (
  id          BIGSERIAL PRIMARY KEY,
  brand_id    TEXT NOT NULL,
  user_id     UUID,
  kind        TEXT NOT NULL,      -- 'image' | 'copy' | 'chat' | 'index' | 'analyse'
  model       TEXT,               -- 'gemini-2.5-flash-image', 'claude-...'
  units       NUMERIC,            -- tokens, or 1 per image
  cost_cents  NUMERIC NOT NULL,   -- YOUR cost, not what you charge
  ok          BOOLEAN NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON usage_events (brand_id, created_at DESC);
CREATE INDEX ON usage_events (created_at DESC);

-- 3. Activity. Cheap: one upsert on any authenticated request, throttled to
--    once per 5 minutes per brand so it does not become its own write load.
ALTER TABLE brands ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS storage_bytes  BIGINT DEFAULT 0;
```

**Record cost even before you charge for it.** A failed generation still costs you money, which is
why `ok` is on the row rather than only successes being written. And you cannot price the tiers
sensibly until you know what a heavy user actually costs — that number takes weeks of real usage
to learn, so start collecting it before the demo cohort arrives, not after.

---

## What HQ should show

Organised by the question you will actually ask, not by the tables underneath.

### 1 · Today — the landing screen

Six numbers and a short list. If you only open one screen, this is it.

| | |
|---|---|
| **Accounts** | total, and new in the last 7 days |
| **Active this week** | brands with `last_active_at` inside 7 days |
| **MRR** | and change on last month |
| **Cost this month** | summed `cost_cents` |
| **Gross margin** | MRR minus cost, as a percentage |
| **Trials ending** | inside 7 days |

Then **Needs attention** — the only list on the page:

- accounts whose cost exceeds their revenue this month
- trials ending in 3 days with no card
- signups older than 7 days that never cleared the questionnaire gate
- any account with a failure rate above 20% this week

An operator dashboard that shows only totals tells you the business exists. This list tells you
what to do this morning.

### 2 · Accounts — the table you asked for

One row per brand. Columns:

`Brand` · `Owner` · `Tier` · `Signed up` · `Last active` · `Readiness` · `Storage` ·
`AI cost (30d)` · `Cost vs revenue`

Sortable on every column, filterable by tier and by status. Search by brand or email.

Two columns that are not obvious and earn their place:

**Readiness** — the score the customer already sees. In HQ it is the best single predictor of
whether an account will stay. Someone at 25% has typed answers into a form; someone at 100% has
uploaded their guidelines and their products, and moving costs them real work.

**Cost vs revenue** — see below. Green under 30%, amber to 60%, red above. Red on a paid tier
means that customer loses you money every month.

### 3 · One account

Click a row. **Metadata only — never their brand content.** See the privacy section.

- Plan, status, MRR, billing history, trial dates
- Activity sparkline for 90 days, so you can see fading before it becomes churn
- Usage: generations by kind, cost, storage, failure rate
- Readiness breakdown, four checks
- Support actions: send a password reset, extend a trial, adjust credits, change tier — each one
  written to an audit log with who did it and when

### 4 · Money

MRR split by tier. New, expansion, contraction, churned — the four movements, monthly. Conversion
rate from Free to paid, and from trial to paid. Average revenue per account per tier.

Do not build cohort retention curves yet. With test users they will be noise, and a chart drawn
from eleven accounts invites conclusions the data cannot support.

### 5 · Usage and cost — the screen you did not ask for and need most

Spend by model, by feature and by day. Top twenty accounts by cost. Cost per generation over time.

**The number that matters: cost to serve, per account, against what they pay.** This is the one
metric an AI product can be quietly killed by. A Pro user at €39 a month who generates 400 images
costs you more than €39, and nothing anywhere else in the business will tell you. Every tier's
price and every credit allowance should be set from this screen's history, not from what
competitors charge.

Show it as a scatter: revenue on one axis, cost on the other, one dot per account, with a
break-even diagonal. Accounts below the line are the product working. Accounts above it are
either your pricing being wrong or your limits being absent, and you want to see which as a shape
rather than as a row in a table.

### 6 · Activation — the screen for the next six weeks

Five steps, count and percentage at each:

```
signed up  →  profile done  →  gate cleared (5 answers)  →  first Studio output  →  came back in week 2
```

With demo users arriving in the next few weeks, "how many signed up" is a vanity number. **The
product question is how many reached something usable**, and the step where they stop is the
thing to fix next. This screen is worth more to you right now than the money screen, because with
eleven friends there is nothing to learn about MRR and everything to learn about where people
give up.

Add median time from signup to gate cleared. Your questionnaire promises "about four minutes" —
this tells you whether that is true.

### 7 · Health

Failed generations by route and by day, error rates, slowest endpoints, and the last fifty errors
with brand and timestamp. You have already lost a day to two red deploys sitting unnoticed for
sixteen hours; this is where that becomes visible in one glance.

---

## Access, and the rules that protect your customers

**A separate surface, not a role flag on the app.** `/hq` is its own route group with its own
layout and no customer navigation. Mixing an admin view into the customer app is how a
mis-scoped query becomes a data leak — which this codebase has already had once.

**An explicit allowlist, checked server-side on every request.** Not a `role` column that a bad
update could set, and never a client-side check. Start with your own user id in an env var; move
to an `operators` table when there is a second person.

**Same danger class as the `/k` portal.** HQ reads across every brand, so it bypasses RLS and
needs the same discipline: explicit column allowlists, no `select("*")`, and a test that a
non-operator session gets a 404 rather than a 403 — a 403 confirms the route exists.

### The privacy line

You are in the EU, so this is GDPR and not only good manners.

**HQ shows metadata, never brand content.** Counts, sizes, timestamps, tiers, error rates — yes.
Their strategy answers, their tone of voice, their product costs, their uploaded documents, the
copy Studio wrote for them — no. The whole promise of the product is that it holds a company's
private thinking; an operator screen that displays it casually is the one breach that would be
unforgivable rather than embarrassing.

**Impersonation is the exception, and it needs a leash.** "View as this account" is the feature
you will want the first time someone emails you a bug. Build it, but: it requires a typed reason,
it writes an audit row, it expires in 30 minutes, and the customer can see in their own settings
that it happened. A support tool nobody can audit is indistinguishable from a backdoor.

**Have a deletion path.** A GDPR erasure request will arrive eventually. HQ is where you handle
it, and it is much easier to build now than to retrofit around a live account.

---

## What to build, in order

1. `brand_plan`, `usage_events`, `last_active_at`, `storage_bytes` — and the writes that fill
   them. **No UI yet.**
2. `/hq` with the allowlist, the Accounts table, and one account detail. That alone answers
   everything you originally asked for.
3. Today, with Needs attention.
4. Activation. Before the demo cohort, not after — a funnel is only useful if it was running while
   the people went through it.
5. Usage and cost, with the scatter.
6. Money and Health.

Steps 1 and 2 are perhaps a day's work each and cover the question you actually asked. Steps 3
onward are what turn it from a list of customers into a way of running the company.

---

## Not building

Cohort retention curves, custom report builders, in-app announcements, a support ticket inbox,
per-feature flags, A/B testing infrastructure, or anything that assumes more than a hundred
accounts. All of it is cheaper to add when the numbers justify it, and each one is a screen you
would maintain for a year before it told you something you did not already know from talking to
eleven people.
