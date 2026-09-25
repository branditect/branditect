/**
 * The spend ceiling, against the real database. Run AFTER applying
 * supabase/hq-billing.sql (and verify-hq-billing.sql says ok everywhere).
 *
 *   node scripts/budget-check.mjs
 *
 * What lib/metering.test.ts cannot prove, because it is the database's job:
 *   criterion 1 — concurrent reservations against the last credit: exactly one wins
 *   criterion 6 — a direct UPDATE past the cap, with the app bypassed, is rejected
 *   criterion 2/3 — settle keeps cost on failure, refunds a pre-flight failure
 *
 * Uses a throwaway brand id (zz-budget-check-…) that owns nothing, and deletes
 * its rows at the end. It does NOT test the platform hard stop: that row is
 * global for the day, and lowering it here would stop real customers. The
 * hard stop is covered by lib/metering.test.ts and lib/plans.test.ts.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const l of readFileSync(".env.local", "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

let fails = 0;
const ok = (m, d = "") => console.log(`PASS  ${m}${d ? " — " + d : ""}`);
const bad = (m, d = "") => { fails++; console.log(`FAIL  ${m}${d ? " — " + d : ""}`); };

const brand = `zz-budget-check-${Date.now().toString(36)}`;
const reserve = (estimate, credits) => sb.rpc("budget_reserve", {
  p_brand: brand, p_user: null, p_kind: "chat", p_route: "budget-check", p_estimate_cents: estimate, p_credits: credits,
});
const budget = async () => (await sb.from("brand_budget").select("credits_used, credits_cap, cost_used_cents, cost_cap_cents").eq("brand_id", brand).single()).data;

try {
  // A fresh Free budget: 100 credits, 220 cents.
  const first = await reserve(1, 1);
  if (first.error) throw new Error(`budget_reserve: ${first.error.message} — is supabase/hq-billing.sql applied?`);
  await sb.rpc("budget_settle", { p_reservation: first.data.reservation_id, p_reached_provider: false, p_ok: false,
    p_actual_cents: 0, p_model: null, p_units: null, p_input_tokens: null, p_output_tokens: null, p_attempts: 1, p_error_code: "check" });

  // Leave exactly one credit.
  await sb.from("brand_budget").update({ credits_used: 99 }).eq("brand_id", brand);

  // Criterion 1: twenty concurrent reservations against one remaining credit.
  const results = await Promise.all(Array.from({ length: 20 }, () => reserve(1, 1)));
  const won = results.filter((r) => r.data?.ok).length;
  won === 1 ? ok("criterion 1: 20 concurrent reservations, 1 credit left — exactly one won") : bad("criterion 1", `${won} won`);
  const b1 = await budget();
  b1.credits_used === 100 ? ok("credits_used stopped at the cap", `${b1.credits_used} of ${b1.credits_cap}`) : bad("credits_used", JSON.stringify(b1));

  // Criterion 2: a provider failure keeps the cost, returns the credit.
  const win = results.find((r) => r.data?.ok).data.reservation_id;
  await sb.rpc("budget_settle", { p_reservation: win, p_reached_provider: true, p_ok: false,
    p_actual_cents: 1, p_model: "claude-sonnet-5", p_units: null, p_input_tokens: null, p_output_tokens: null, p_attempts: 1, p_error_code: "http_500" });
  const b2 = await budget();
  b2.credits_used === 99 && Number(b2.cost_used_cents) === 1
    ? ok("criterion 2: failure kept the cost and gave the credit back")
    : bad("criterion 2", JSON.stringify(b2));

  // Criterion 3: a pre-flight failure refunds in full.
  const pre = await reserve(5, 1);
  await sb.rpc("budget_settle", { p_reservation: pre.data.reservation_id, p_reached_provider: false, p_ok: false,
    p_actual_cents: 0, p_model: null, p_units: null, p_input_tokens: null, p_output_tokens: null, p_attempts: 1, p_error_code: "preflight" });
  const b3 = await budget();
  b3.credits_used === 99 && Number(b3.cost_used_cents) === 1
    ? ok("criterion 3: pre-flight failure refunded in full")
    : bad("criterion 3", JSON.stringify(b3));

  // Criterion 6: bypass the app entirely — the CHECK must refuse.
  const direct = await sb.from("brand_budget").update({ cost_used_cents: b3.cost_cap_cents + 1 }).eq("brand_id", brand);
  direct.error && /within_cost|check constraint/i.test(direct.error.message)
    ? ok("criterion 6: a direct UPDATE past cost_cap_cents is rejected by the CHECK", direct.error.message.slice(0, 80))
    : bad("criterion 6: THE DATABASE ACCEPTED A WRITE PAST THE CAP", JSON.stringify(direct));
  const direct2 = await sb.from("brand_budget").update({ credits_used: b3.credits_cap + 1 }).eq("brand_id", brand);
  direct2.error ? ok("credits past the cap are rejected too") : bad("credits CHECK missing");

  // A cost reservation larger than what is left is refused, and says why.
  const big = await reserve(10_000, 0);
  big.data?.ok === false && big.data.reason === "cost"
    ? ok("a reservation larger than the budget is refused before any call", `remaining ${big.data.remaining_cents} cents`)
    : bad("oversized reservation", JSON.stringify(big.data ?? big.error));

  // The ledger row exists for the failure, with no content in it.
  const { data: ev } = await sb.from("usage_events").select("ok, cost_cents, credits, error_code").eq("brand_id", brand);
  ev?.length === 1 && ev[0].ok === false && ev[0].credits === 0
    ? ok("usage_events recorded the failure (ok=false, 0 credits)")
    : bad("usage_events", JSON.stringify(ev));
} catch (e) {
  bad("check crashed", e.message);
} finally {
  // Give back what the throwaway reservations put on today's platform row.
  const { data: res } = await sb.from("budget_reservations").select("estimate_cents, status").eq("brand_id", brand);
  const stillCharged = (res ?? []).filter((r) => r.status !== "refunded").reduce((s, r) => s + Number(r.estimate_cents), 0);
  if (stillCharged > 0) {
    const { data: p } = await sb.from("platform_budget").select("spend_cents").eq("day", new Date().toISOString().slice(0, 10)).maybeSingle();
    if (p) await sb.from("platform_budget").update({ spend_cents: Math.max(0, Number(p.spend_cents) - stillCharged) })
      .eq("day", new Date().toISOString().slice(0, 10));
  }
  for (const t of ["usage_events", "budget_reservations", "brand_budget"]) await sb.from(t).delete().eq("brand_id", brand);
  console.log(fails ? `\n${fails} FAILING` : "\nAll passed.");
  process.exit(fails ? 1 : 0);
}
