/**
 * Finishing the questionnaire produces a strategy, in production.
 *
 * The failure this guards: "Vastauksesi on tallennettu, mutta strategiaa ei
 * voitu rakentaa: 504." A 504 is the platform killing the function, not the
 * model refusing — the route sat at maxDuration 60 while a real build measured
 * 33s (scripts/strategy-timing-probe.mjs), so a slow run died and the person
 * got a status code for an answer.
 *
 * This creates a throwaway account with its own brand, writes a full set of
 * answers to its onboarding row, calls the deployed endpoint with that
 * account's own token, and checks a strategy actually lands. It never touches
 * a real brand, and deletes everything it made.
 *
 * Käyttö: node scripts/strategy-generate-prod-check.mjs
 *         BASE=http://localhost:3000 node scripts/strategy-generate-prod-check.mjs
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const BASE = process.env.BASE ?? "https://www.branditect.io";

const env = {};
for (const l of readFileSync(".env.local", "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

let fails = 0;
const ok = (m, d = "") => console.log(`PASS  ${m}${d ? " — " + d : ""}`);
const bad = (m, d = "") => { fails++; console.log(`FAIL  ${m}${d ? " — " + d : ""}`); };

const stamp = Date.now().toString(36);
let userId = null;
const brandId = `zz-strat-${stamp}`;

/* Twenty answers of realistic length: the build time depends on how much
   there is to read, so a three-word answer per question would pass here and
   still time out for a real founder. */
const ANSWER =
  "We keep the knowledge that normally lives in one person's head: manuals, wiring, " +
  "renovation photos and receipts for a cabin or a boat, so the next owner is not " +
  "left guessing. Our customers are ordinary families, not professionals.";
const answers = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [String(i + 1), `${ANSWER} (${i + 1})`]));

try {
  const email = `zz-strat-${stamp}@branditect-test.invalid`;
  const password = "TestPassword!2026";
  const { data: created, error: ce } = await svc.auth.admin.createUser({ email, password, email_confirm: true });
  if (ce) throw ce;
  userId = created.user.id;

  await svc.from("brands").insert({
    user_id: userId, brand_id: brandId, brand_name: "ZZ Strategy",
    strategy_method: "questionnaire", onboarding_completed: true,
  });
  await svc.from("onboarding").insert({ brand_id: brandId, answers, status: "partial" });

  const c = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data: session, error: se } = await c.auth.signInWithPassword({ email, password });
  if (se) throw se;

  const t0 = Date.now();
  const res = await fetch(`${BASE}/api/strategy-generate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.session.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const seconds = ((Date.now() - t0) / 1000).toFixed(1);
  const body = await res.text();

  res.status === 200
    ? ok("the endpoint builds a strategy", `${seconds}s`)
    : bad(`the endpoint answered ${res.status}`, `${seconds}s — ${body.slice(0, 200)}`);

  // 504 is the one to name: it is what the person saw, and it comes back as
  // HTML from the platform rather than as the route's own JSON.
  if (res.status === 504) bad("still hitting the platform timeout", "maxDuration is not taking effect");

  const { data: rows } = await svc
    .from("brand_strategies").select("generated_strategy, section_positioning, status").eq("brand_id", brandId);
  const row = rows?.[0];
  row ? ok("a strategy row was written") : bad("no strategy row");

  const filled = row && (row.generated_strategy || row.section_positioning);
  filled ? ok("the strategy has content, not just a row") : bad("the row is empty", JSON.stringify(row ?? {}).slice(0, 200));
} catch (e) {
  bad("check crashed", e instanceof Error ? e.message : String(e));
} finally {
  await svc.from("brand_strategies").delete().eq("brand_id", brandId);
  await svc.from("onboarding").delete().eq("brand_id", brandId);
  await svc.from("brands").delete().eq("brand_id", brandId);
  if (userId) await svc.auth.admin.deleteUser(userId).catch(() => {});
}

console.log(fails ? `\n${fails} failed.` : "\nAll good.");
process.exit(fails ? 1 : 0);
