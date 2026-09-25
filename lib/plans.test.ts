/**
 * The tier caps exist twice: budget_tier_caps() in supabase/hq-billing.sql
 * enforces them, lib/plans.ts displays them. They must agree, and both must
 * match the spec's table (hq-accounts.md Part 1).
 */
import { it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TIER_CAPS } from "./plans.ts";

const sql = readFileSync("supabase/hq-billing.sql", "utf8");
const fn = sql.match(/create or replace function budget_tier_caps[\s\S]*?\$fn\$([\s\S]*?)\$fn\$/)![1];
const rows = new Map(
  Array.from(fn.matchAll(/\('(\w+)',\s*(\d+),\s*(\d+),\s*'(\w+)'\)/g), (m) => [m[1], { credits: +m[2], cost: +m[3], period: m[4] }] as const),
);

it("the SQL and the display agree on every tier", () => {
  assert.equal(rows.size, 4);
  for (const [tier, caps] of Object.entries(TIER_CAPS)) {
    const r = rows.get(tier);
    assert.ok(r, `${tier} missing from budget_tier_caps()`);
    assert.equal(r!.credits, caps.creditsCap, `${tier} credits`);
    assert.equal(r!.cost, caps.costCapCents, `${tier} cost cap`);
    assert.equal(r!.period, caps.period, `${tier} period`);
  }
});

it("the caps are the spec's: Free 100 credits / €2.20 once, Pro 350 / €11, Pro Plus 600 / €18", () => {
  assert.deepEqual(rows.get("free"), { credits: 100, cost: 220, period: "once" });
  assert.deepEqual(rows.get("pro"), { credits: 350, cost: 1100, period: "month" });
  assert.deepEqual(rows.get("pro_plus"), { credits: 600, cost: 1800, period: "month" });
});

it("criterion 6: the database itself forbids spending past the cap", () => {
  const body = sql.replace(/--[^\n]*/g, "");
  assert.match(body, /constraint within_cost\s+check \(cost_used_cents <= cost_cap_cents\)/);
  assert.match(body, /constraint within_credits check \(credits_used <= credits_cap\)/);
});

it("the reserve is one atomic UPDATE, not a read then a write", () => {
  const fnBody = sql.match(/create or replace function budget_reserve[\s\S]*?\$fn\$([\s\S]*?)\$fn\$/)![1];
  assert.match(fnBody, /update brand_budget[\s\S]*?where brand_id = p_brand[\s\S]*?and cost_used_cents \+ p_estimate_cents <= cost_cap_cents/);
  assert.match(fnBody, /update platform_budget[\s\S]*?spend_cents \+ p_estimate_cents <= hard_stop_cents/);
});

it("only the service role may call the budget functions", () => {
  for (const f of ["budget_reserve", "budget_settle", "budget_expire_stale", "touch_brand_activity"]) {
    assert.match(sql, new RegExp(`revoke all on function ${f}\\([^)]*\\) from public, anon, authenticated`), f);
    assert.match(sql, new RegExp(`grant execute on function ${f}\\([^)]*\\) to service_role`), f);
  }
});
