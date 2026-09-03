# HQ · Accounts, and the spend ceiling that makes it true

Reference: `reference/hq-accounts.html`. Read `spec/hq.md` first — it defines the surface, the
access rules and the privacy line. This spec covers the Accounts screen and the enforcement that
has to sit under it.

---

## Part 1 · The guarantee

> Usage never exceeds the cap, so we never pay more than we planned. The most a free account can
> ever cost is €2.11.

**That is not true today and it will not become true by adding a credit counter.** A credit balance
bounds what a customer can *generate*. It does not bound what they *cost*. Three things cost real
money and spend no credit:

| | Why it costs nothing to the user | What it costs you |
|---|---|---|
| **Indexing uploads** | Free by design. Charging to feed the brain discourages the one behaviour that makes people stay. | A 64-page guideline is 64 vision calls |
| **Failed generations** | Never charged. Billing someone for your error is hostile. | The provider still charges for the attempt |
| **Retries** | Invisible. | Two calls, one credit |

So the ceiling has to be enforced on **cost**, not on credits. Two counters, one visible and one not.

### The two counters

```sql
CREATE TABLE brand_budget (
  brand_id        TEXT PRIMARY KEY,
  -- What the customer sees. Spent only by generation.
  credits_cap     INT     NOT NULL,
  credits_used    INT     NOT NULL DEFAULT 0,
  -- What protects you. Debited by EVERY paid call: generation, indexing,
  -- failures, retries. In cents, because money is not credits.
  cost_cap_cents  INT     NOT NULL,
  cost_used_cents NUMERIC NOT NULL DEFAULT 0,
  period_start    DATE    NOT NULL,
  CONSTRAINT within_cost CHECK (cost_used_cents <= cost_cap_cents)
);
```

| Tier | credits_cap | cost_cap_cents | Why |
|---|---|---|---|
| Free | 100 (once, no reset) | **220** | 100 credits = €2.00, plus €0.20 of indexing headroom |
| Pro | 350 / month | 1100 | €7.00 of credits, €4.00 of indexing and failures |
| Pro Plus | 600 / month | 1800 | €12.00 of credits, €6.00 of headroom |
| Enterprise | agreed | agreed | Set per contract |

**The `CHECK` constraint is the real guarantee.** Everything else is code that can have a bug in it;
a database constraint cannot be forgotten. If a write would breach the cap the transaction fails,
and a failed transaction is infinitely cheaper than an unbounded bill.

### Reserve before you call, never debit after

Check-then-call is a race. Two requests arriving together both read `cost_used < cap` and both
proceed, and at scale that is how a cap leaks.

```sql
-- Atomically reserve the estimated cost. Returns no row when there is not
-- enough budget left, which IS the refusal — no separate check, no window
-- between reading and spending.
UPDATE brand_budget
   SET cost_used_cents = cost_used_cents + $estimate
 WHERE brand_id = $1
   AND cost_used_cents + $estimate <= cost_cap_cents
RETURNING cost_cap_cents - cost_used_cents AS remaining;
```

Then: no row returned → refuse, before any provider call. Row returned → make the call → reconcile
the reservation against the real cost from the response.

**Estimate high and true up down.** Reserving the optimistic figure and discovering the real one was
larger is exactly the hole this exists to close.

### Failures are charged to the budget, never to the customer

A generation that reaches the provider and fails **keeps its reservation**. The money left. Refund
the reservation only when the call never reached them — a validation error, a missing key, a refused
request.

`usage_events.ok = false` records it, so HQ can show the split, and the customer's `credits_used`
is untouched.

### Indexing is estimated before the first page

A 64-page PDF is refused *before* page one when the budget cannot cover it:

> This document needs about 40 credits of processing and you have 12 left. Upload it after your
> credits reset, or upgrade.

Bounded by two more rules, both cheap:

1. **Index once.** A document already indexed is never re-indexed. Store a content hash.
2. **Cheap pass first.** Text extraction costs nothing; only pages that need vision get a vision
   call. A price list does not need a model to look at it.

### One retry, inside the same reservation

A retry may not reserve again, and there is at most one. An unbounded retry loop is the single
fastest way to spend money, and it looks like a healthy system while it does it.

### The backstop: a platform ceiling

Per-account caps protect you from one heavy customer. **They do not protect you from a bug.** A loop
that regenerates in a `useEffect` will happily burn a hundred accounts' worth of budget while every
individual cap is respected.

```sql
CREATE TABLE platform_budget (
  day             DATE PRIMARY KEY,
  spend_cents     NUMERIC NOT NULL DEFAULT 0,
  soft_alert_cents INT NOT NULL DEFAULT 2000,   -- email me
  hard_stop_cents  INT NOT NULL DEFAULT 6000    -- stop everything
);
```

Every reservation debits this too. Past the soft line you get an email; past the hard line every
paid route returns "temporarily unavailable" until you raise it by hand. **A day of degraded service
is recoverable. A €4,000 bill from a loop that ran over a weekend is not.**

### What €2.11 actually covers

With the above, a free account's **compute** is capped at €2.20 and will land near €2.11. Two things
sit outside it, and the honest version says so:

- **Storage.** 200 MB is about €0.004 a month, perpetual while the account exists. Roughly €0.05 a
  year. Real, tiny, and not compute.
- **Egress.** Serving files back. Small, and covered by the same storage cap.

So: **"a free account costs €2.11 in compute, once, plus a few cents a year of storage while it
exists."** That is a claim you can defend. "Zero, ever" is not.

### Acceptance criteria for Part 1

1. Two concurrent generations against 1 credit of remaining budget: exactly one succeeds. Asserted
   by a test firing both in parallel.
2. A provider error still debits the budget; `credits_used` does not move.
3. A pre-flight failure (missing key, invalid input) refunds the reservation in full.
4. Indexing a document larger than the remaining budget is refused before any provider call, and
   the message states what it needs and what is left.
5. Re-uploading an identical document performs zero provider calls.
6. A route cannot exceed `cost_cap_cents` even with the application code bypassed — asserted by
   attempting a direct `UPDATE` past the cap and expecting the `CHECK` to reject it.
7. At most one retry per request, sharing the original reservation.
8. `platform_budget.hard_stop_cents` halts every paid route. **MERGE BLOCKER.**
9. A free account that exhausts its budget can still sign in and read everything.

Criterion 6 is the one that matters. Everything above it is code, and code has bugs.

---

## Part 2 · The screen

Build `reference/hq-accounts.html`.

### The rail

`--grad-rail: linear-gradient(168deg,#6b53ac 0%,#4a3585 52%,#2f2159 100%)` — violet into deep
indigo, built from the palette rather than a new colour. White type holds contrast the whole way
down.

It is deliberately not the customer app's chrome. **HQ reads across every brand in the system and
one glance has to say "you are not in the product".**

### Columns

`Brand` · `Plan` · `Signed up` · `Last active` · `Readiness` · `Storage` · `Credits used` ·
`Cost to serve 30d` · `Cost vs revenue`

Three that are not obvious:

**Last active is a 14-day sparkline, not a date.** "34 days ago" says someone churned. The shape
says they faded for two weeks first, which is when you could still have done something.

**Cost to serve carries a three-part bar** — credits, indexing, failures. Two accounts at the same
percentage can have completely different problems, and the old single number made them look
identical. Violet and blue are a validated categorical pair; failures wear the reserved critical red
because a failure is a fault, not a third category.

**Cost vs revenue is the default sort, descending.** Your problems are at the top of the screen
every morning. Green under 30%, amber to 60%, red above. A free account reads `Free · no revenue`
rather than a meaningless percentage.

Under a red or amber ratio, one line of *why*: `indexed 380 documents`, `31% of generations failed`.
The percentage says there is a problem; the line says which one.

### Colour

Tier hues were validated with the dataviz skill's `validate_palette.js`, not chosen by eye. The
first attempt failed: slate and violet were ΔE 3.8 apart under deuteranopia and 8.2 with normal
vision. The shipping set is `#f0562a` · `#6b53ac` · `#2b8fb0`, which passes all six checks.

**Free is a deliberate grey held outside the categorical set** — "no plan" should read as the absence
of colour, and grey inside a categorical palette fails the chroma floor for good reason.

Every tier chip carries the word as well as the dot. Every status carries a number or a word as well
as the colour. Nothing on this screen is colour alone.

### Privacy

The note at the foot of the screen is not decoration and does not get removed when the page grows:

> **Metadata only.** Counts, sizes, timestamps and spend. Never a customer's strategy, tone of
> voice, product costs, uploaded documents or anything Studio wrote for them.

### Acceptance criteria for Part 2

10. The rail renders the purple gradient and HQ is unreachable for a non-operator — a non-operator
    session gets **404, not 403**, since a 403 confirms the route exists.
11. No query on this screen selects a content column from `brand_strategies`, `brand_tone`,
    `brand_documents` or `studio_drafts` — sentinel test, same technique as the `/k` portal.
    **MERGE BLOCKER.**
12. `credits_used` never exceeds `credits_cap` in any rendered row — asserted against seeded data
    including an account at exactly its cap.
13. Sorting by cost vs revenue puts the worst ratio first, and free accounts sort separately rather
    than as infinity.
14. Every tier and status conveys meaning without colour — asserted by a test reading text content
    with colour stripped.

---

## Build order

1. `brand_budget`, `platform_budget`, the atomic reserve function, and the `CHECK` constraint.
   **No UI.** Criteria 1–9.
2. Wire every paid route through the reservation: generation, indexing, chat. Nothing calls a
   provider without one.
3. `usage_events` writes, including failures.
4. The Accounts screen. Criteria 10–14.

**Step 1 ships before anything bills.** A ceiling added after money is moving is a migration on live
balances; added before, it is a table.

---

## Not building

Per-request pricing shown to the customer, credit gifting, usage-based overage billing, or a
customer-facing spend dashboard. The customer sees a credit balance and a hard stop. The cost ledger
is yours.
