/**
 * The spend ceiling's rules, against an in-memory store that behaves like
 * budget_reserve()/budget_settle() in supabase/hq-billing.sql: the reserve is
 * one synchronous check-and-debit, as the UPDATE … WHERE is in the database.
 *
 * What this cannot prove is the database itself — the CHECK constraint and
 * true concurrency across connections. scripts/budget-check.mjs asserts those
 * against the real tables once the migration is applied (criteria 1 and 6).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BudgetRefused,
  PreflightError,
  ProviderError,
  meter,
  type BudgetStore,
  type Settlement,
} from "./metering.ts";
import { ROUTE_PLAN } from "./metering-plan.ts";

function fakeStore(opts: { creditsCap: number; costCapCents: number; platformHardStop?: number }) {
  const b = { creditsUsed: 0, costUsed: 0 };
  const platform = { spend: 0, hard: opts.platformHardStop ?? 1_000_000 };
  const open = new Map<string, { estimate: number; credits: number }>();
  const settled: Settlement[] = [];
  let seq = 0;
  const store: BudgetStore = {
    async reserve(a) {
      // One synchronous step: no await between the check and the debit.
      if (platform.spend + a.estimateCents > platform.hard) return { ok: false, reason: "platform" };
      if (b.costUsed + a.estimateCents > opts.costCapCents || b.creditsUsed + a.credits > opts.creditsCap) {
        return {
          ok: false,
          reason: b.creditsUsed + a.credits > opts.creditsCap ? "credits" : "cost",
          remaining_cents: opts.costCapCents - b.costUsed,
          remaining_credits: opts.creditsCap - b.creditsUsed,
        };
      }
      platform.spend += a.estimateCents;
      b.costUsed += a.estimateCents;
      b.creditsUsed += a.credits;
      const id = `r${++seq}`;
      open.set(id, { estimate: a.estimateCents, credits: a.credits });
      return { ok: true, reservation_id: id };
    },
    async settle(s) {
      const r = open.get(s.reservationId);
      if (!r) return;
      open.delete(s.reservationId);
      settled.push(s);
      if (!s.reachedProvider) {
        b.costUsed -= r.estimate;
        b.creditsUsed -= r.credits;
        platform.spend -= r.estimate;
        return;
      }
      const delta = (s.actualCents ?? r.estimate) - r.estimate;
      b.costUsed = Math.min(opts.costCapCents, Math.max(0, b.costUsed + delta));
      if (!s.ok) b.creditsUsed -= r.credits;
      platform.spend += delta;
    },
  };
  return { store, b, platform, settled };
}

const ok = (costCents: number) => async () => ({ value: "done", model: "claude-sonnet-5", costCents });

test("criterion 1: two concurrent generations against 1 credit — exactly one succeeds", async () => {
  const f = fakeStore({ creditsCap: 1, costCapCents: 1000 });
  let calls = 0;
  const run = () =>
    meter({ route: "andy", brandId: "b", userId: null, estimateCents: 5 }, async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 10));
      return { value: "x", model: "claude-sonnet-5", costCents: 1 };
    }, f.store);
  const results = await Promise.allSettled([run(), run()]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  const refused = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
  assert.ok(refused.reason instanceof BudgetRefused);
  assert.equal(refused.reason.reason, "credits");
  assert.equal(calls, 1, "the refused request never reached the provider");
});

test("criterion 2: a provider error debits the budget; credits_used does not move", async () => {
  const f = fakeStore({ creditsCap: 100, costCapCents: 1000 });
  const err = Object.assign(new Error("bad request from provider"), { status: 400 });
  await assert.rejects(
    meter({ route: "copy-architect", brandId: "b", userId: null, estimateCents: 20 }, async () => { throw err; }, f.store),
  );
  assert.equal(f.b.creditsUsed, 0, "the customer is never charged for our failure");
  assert.equal(f.b.costUsed, 20, "the reservation is kept: the money left");
  assert.equal(f.settled[0].ok, false);
});

test("criterion 3: a pre-flight failure refunds the reservation in full", async () => {
  const f = fakeStore({ creditsCap: 100, costCapCents: 1000 });
  await assert.rejects(
    meter({ route: "brand/generate-from-reference", brandId: "b", userId: null, estimateCents: 30 }, async () => {
      throw new PreflightError("GEMINI_API_KEY missing", 500);
    }, f.store),
  );
  assert.equal(f.b.costUsed, 0);
  assert.equal(f.b.creditsUsed, 0);
  assert.equal(f.platform.spend, 0);
});

test("criterion 4: indexing larger than the budget is refused before any provider call, saying what it needs and what is left", async () => {
  const f = fakeStore({ creditsCap: 100, costCapCents: 24 });
  let called = false;
  const e = await meter(
    { route: "vault/extract", brandId: "b", userId: null, estimateCents: 80, refusalKind: "document", locale: "en" },
    async () => { called = true; return { value: 1, model: "m", costCents: 0 }; },
    f.store,
  ).catch((x) => x);
  assert.ok(e instanceof BudgetRefused);
  assert.equal(called, false);
  assert.match(e.message, /needs about 40 credits/);
  assert.match(e.message, /you have 12 left/);
});

test("the refusal speaks the person's language", async () => {
  const f = fakeStore({ creditsCap: 0, costCapCents: 1000 });
  const e = await meter({ route: "andy", brandId: "b", userId: null, estimateCents: 1, locale: "fi" }, ok(1), f.store).catch((x) => x);
  assert.match(e.message, /krediittiä/);
});

test("criterion 7: at most one retry, inside the same reservation", async () => {
  const f = fakeStore({ creditsCap: 100, costCapCents: 1000 });
  let calls = 0;
  const overloaded = Object.assign(new Error("overloaded"), { status: 529 });
  await assert.rejects(
    meter({ route: "copy-architect", brandId: "b", userId: null, estimateCents: 10 }, async () => { calls++; throw overloaded; }, f.store),
  );
  assert.equal(calls, 2, "one try and one retry, never a third");
  assert.equal(f.settled.length, 1, "one reservation, one settlement");
  assert.equal(f.settled[0].attempts, 2);
});

test("a non-retryable provider error is not retried", async () => {
  const f = fakeStore({ creditsCap: 100, costCapCents: 1000 });
  let calls = 0;
  await assert.rejects(
    meter({ route: "copy-architect", brandId: "b", userId: null, estimateCents: 10 }, async () => {
      calls++;
      throw new ProviderError("invalid", 400);
    }, f.store),
  );
  assert.equal(calls, 1);
});

test("a retry that succeeds charges the credits once and the real cost", async () => {
  const f = fakeStore({ creditsCap: 100, costCapCents: 1000 });
  let calls = 0;
  const v = await meter({ route: "copy-architect", brandId: "b", userId: null, estimateCents: 10 }, async () => {
    calls++;
    if (calls === 1) throw Object.assign(new Error("rate limited"), { status: 429 });
    return { value: "ok", model: "claude-sonnet-5", costCents: 3 };
  }, f.store);
  assert.equal(v, "ok");
  assert.equal(f.b.creditsUsed, 2);
  assert.equal(f.b.costUsed, 3, "trued down from the 10-cent estimate to the real 3");
});

test("criterion 8: the platform hard stop halts every paid route", async () => {
  for (const route of Object.keys(ROUTE_PLAN) as (keyof typeof ROUTE_PLAN)[]) {
    const f = fakeStore({ creditsCap: 1000, costCapCents: 100_000, platformHardStop: 0 });
    let called = false;
    const e = await meter({ route, brandId: "b", userId: null, estimateCents: 1 }, async () => {
      called = true;
      return { value: 1, model: "m", costCents: 1 };
    }, f.store).catch((x) => x);
    assert.ok(e instanceof BudgetRefused, route);
    assert.equal(e.status, 503, route);
    assert.equal(called, false, route);
  }
});

test("indexing spends cost but never credits", async () => {
  const f = fakeStore({ creditsCap: 0, costCapCents: 1000 });
  await meter({ route: "brand-guideline/index", brandId: "b", userId: null, estimateCents: 50 }, ok(40), f.store);
  assert.equal(f.b.creditsUsed, 0);
  assert.equal(f.b.costUsed, 40);
});

test("a success never takes cost past the cap, even when the estimate was low", async () => {
  const f = fakeStore({ creditsCap: 100, costCapCents: 20 });
  await meter({ route: "andy", brandId: "b", userId: null, estimateCents: 10 }, ok(35), f.store);
  assert.equal(f.b.costUsed, 20);
  assert.equal(f.settled[0].actualCents, 35, "the ledger still records what it really cost");
});
