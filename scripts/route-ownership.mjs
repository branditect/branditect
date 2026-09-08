/**
 * Criteria 2 and 3 of branditect-ui/spec/security-hardening.md.
 *
 * The chain this closes: an uploaded image is served from a public URL whose
 * path contains the brand id, and /api/catalog and /api/numbers took that id
 * from the query string, queried with the service-role client, and checked
 * nothing. Anyone with an image URL and no account could read a brand's
 * catalogue, unit costs and margins.
 *
 * Two real accounts, a real password grant, real tokens. Nothing mocked.
 *
 *   2. someone else's brand id → 403 signed in as another user, 401 as nobody
 *   3. a brand you do not own and a brand that does not exist return the same
 *      status and the same body, byte for byte, so the response cannot be used
 *      to discover which brand ids exist
 *
 * Usage: node scripts/route-ownership.mjs   (needs a dev server on :3000)
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const BASE = process.env.BASE ?? "http://localhost:3000";
function envFromFiles() {
  const out = {};
  for (const f of [".env.local", ".env"]) {
    let raw;
    try { raw = readFileSync(new URL(`../${f}`, import.meta.url), "utf8"); } catch { continue; }
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !out[m[1]]) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return out;
}
const env = { ...envFromFiles(), ...process.env };
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } });

const PW = "TestPassword!2026";
const stamp = Date.now().toString(36);
let fails = 0;
const ok  = (m, d="") => console.log(`PASS  ${m}${d ? " — " + d : ""}`);
const bad = (m, d="") => { fails++; console.log(`FAIL  ${m}${d ? " — " + d : ""}`); };

async function makeUser(letter) {
  const email = `zz-own-${letter}-${stamp}@branditect-test.invalid`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: PW, email_confirm: true });
  if (error) throw new Error(error.message);
  const brandId = `zz-own-${letter}-${stamp}`;
  await admin.from("brands").insert({
    brand_id: brandId, user_id: data.user.id, brand_name: `ZZ ${letter}`, onboarding_completed: true,
  });
  const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } });
  const { data: s } = await anon.auth.signInWithPassword({ email, password: PW });
  return { email, userId: data.user.id, brandId, token: s?.session?.access_token };
}

let A, B;
try {
  A = await makeUser("a");
  B = await makeUser("b");
  if (!A.token) throw new Error("A could not sign in");

  // Give B something worth stealing.
  await admin.from("catalog_products").insert({
    brand_id: B.brandId, name: "ZZ B SECRET", type: "physical", price: 99, landed_cost: 12,
  });

  const GET_ROUTES = [
    "/api/catalog?brand_id=", "/api/numbers?brand_id=", "/api/tone?brand_id=",
    "/api/visual?brand_id=", "/api/social-strategy?brandId=", "/api/templates/note?brandId=",
    "/api/mission-board/goals?brandId=", "/api/mission-board/notes?brandId=",
    "/api/mission-board/tasks?brandId=",
  ];

  for (const route of GET_ROUTES) {
    const asNobody = await fetch(`${BASE}${route}${B.brandId}`);
    const asOther  = await fetch(`${BASE}${route}${B.brandId}`, {
      headers: { Authorization: `Bearer ${A.token}` } });

    asNobody.status === 401
      ? ok(`2 · ${route.split("?")[0]} is 401 with no account`)
      : bad(`2 · ${route.split("?")[0]} with no account`, `got ${asNobody.status}`);
    asOther.status === 403
      ? ok(`2 · ${route.split("?")[0]} is 403 for another user's brand`)
      : bad(`2 · ${route.split("?")[0]} for another user's brand`, `got ${asOther.status}`);

    // CRITERION 3: unowned and non-existent must be indistinguishable.
    const missing = await fetch(`${BASE}${route}zz-does-not-exist-${stamp}`, {
      headers: { Authorization: `Bearer ${A.token}` } });
    const a = await asOther.text(), b = await missing.text();
    asOther.status === missing.status && a === b
      ? ok(`3 · ${route.split("?")[0]} answers the same for unowned and unknown`)
      : bad(`3 · ${route.split("?")[0]} leaks which brand ids exist`,
            `${asOther.status} ${JSON.stringify(a.slice(0,40))} vs ${missing.status} ${JSON.stringify(b.slice(0,40))}`);
  }

  // The chain, end to end: B's catalogue must not come back.
  const leak = await fetch(`${BASE}/api/catalog?brand_id=${B.brandId}`);
  const body = await leak.text();
  !body.includes("ZZ B SECRET")
    ? ok("the original chain is closed — no catalogue without an account")
    : bad("THE CHAIN IS STILL OPEN", body.slice(0, 120));

  // And A can still read its own, or the whole thing passes vacuously.
  const own = await fetch(`${BASE}/api/catalog?brand_id=${A.brandId}`, {
    headers: { Authorization: `Bearer ${A.token}` } });
  own.ok ? ok("A can still read its own catalogue", `${own.status}`)
         : bad("A can still read its own catalogue", `${own.status} — every pass above is vacuous`);
} catch (e) {
  bad("harness", e.message);
} finally {
  for (const u of [A, B]) {
    if (!u) continue;
    for (const t of ["catalog_products", "brands"]) await admin.from(t).delete().eq("brand_id", u.brandId);
    await admin.auth.admin.deleteUser(u.userId);
  }
}
console.log(fails ? `\n${fails} FAILING` : "\nall pass");
process.exit(fails ? 1 : 0);
