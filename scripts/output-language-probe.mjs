/**
 * Inbox 4b and 5a: "Assert it end to end, not by reading the column."
 *
 * TWO PHASES, AND THE SECOND IS THE ONE THAT WAS MISSING.
 *
 *   1. The builders. It builds the real system prompt with copyStable and
 *      andyStable — the same functions the routes call — sets the language each
 *      way and sends both to the real API. This proves the thing that actually
 *      decides the output: stating the language produces Finnish, not stating
 *      it produces English. It needs no server and no database.
 *
 *   2. The route, over HTTP. A seeded zz- user, a real password grant, a real
 *      bearer token, a real POST to /api/copy-architect, with the brand's
 *      `output_language` column flipped between the two calls and nothing else
 *      changed. This is the half entry 4b could not do, because
 *      supabase/brand-language.sql was unrun and no brand could be set to 'fi'.
 *      Saara ran it on 10 Sep; both columns are on `brands` and phase 2 checks
 *      they are there before it trusts anything it reads.
 *
 * The brand's own material is English in both phases, deliberately. A Finnish
 * reply to English sources is the instruction winning over the material, which
 * is the whole point — a probe seeded with Finnish products would come back
 * Finnish whether the directive worked or not.
 *
 * Phase 2 seeds its own user, brand and product and deletes all three in a
 * finally. It never touches a real brand.
 *
 * Usage: npm run lang:probe          (phase 2 needs a dev server on :3000)
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { copyStable, copyPerRequest } from "../lib/prompts.ts";
import { cachedSystem } from "../lib/prompt-cache.ts";
import { languageDirective } from "../lib/output-language.ts";

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
const KEY = env.ANTHROPIC_API_KEY;
if (!KEY) { console.error("lang:probe needs ANTHROPIC_API_KEY"); process.exit(2); }
const BASE = env.BASE ?? "http://localhost:3000";

let failed = 0;
const ok  = (m, d = "") => console.log(`PASS  ${m}${d ? " — " + d : ""}`);
const bad = (m, d = "") => { failed++; console.log(`FAIL  ${m}${d ? " — " + d : ""}`); };

/**
 * Language, by two independent signals rather than one.
 *
 * Letters alone would call an English sentence with a Finnish product name
 * Finnish. Stopwords alone would call a Finnish sentence quoting an English
 * spec English. Both have to agree.
 */
const EN_STOPWORDS = /\b(the|and|your|with|that|this|from|for|are|is|it)\b/gi;
const FI_MARKERS = /[äöÄÖ]|\b(ja|joka|kun|sen|että|tämä|se|on|ei)\b/gi;

function classify(text) {
  const en = (text.match(EN_STOPWORDS) ?? []).length;
  const fi = (text.match(FI_MARKERS) ?? []).length;
  return { en, fi, verdict: fi > en ? "fi" : en > fi ? "en" : "?" };
}

/** An English brand context, on purpose: the material is English, the instruction is not. */
const POSITIONING =
  "Positioning: the granule that clears a spill before the shift ends. " +
  "Audience: site foremen who buy on downtime, not on price per litre. ";
const CONTEXT = [
  "=== BRAND ===\nZZ Probe Oy, industrial absorbents, Finland.\n",
  "=== STRATEGY ===\n", POSITIONING.repeat(40),
  "\n=== PRODUCTS ===\n", "Granule 20L, 42.00 EUR, absorbs 12x its weight. ".repeat(20),
].join("");

// ───────────────────────────────────────── phase 1: the builders, direct ──

async function draft(language) {
  const system = cachedSystem(
    copyStable({ brandName: "ZZ Probe Oy", context: CONTEXT, language }),
    copyPerRequest({ deliverable: "a short product description", wordTarget: "30-45 words", count: 1, product: null }),
  );
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-sonnet-5", max_tokens: 600, thinking: { type: "disabled" },
      system,
      messages: [{ role: "user", content: "What it's about: the 20 litre granule.\n\nWrite the 1 draft now. Return only the JSON." }],
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(json.error ?? json).slice(0, 200)}`);
  const text = json.content.filter((c) => c.type === "text").map((c) => c.text).join("");
  const body = (text.match(/"body"\s*:\s*"((?:\\.|[^"\\])*)"/) ?? [null, text])[1];
  return body.replace(/\\n/g, " ");
}

console.log("The directive, for the record:");
console.log(languageDirective("fi").trim().split("\n").map((l) => "  " + l).join("\n") || "  (empty for English)");
console.log(`\nEnglish directive is empty: ${languageDirective("en") === "" ? "yes" : "NO"}\n`);

console.log("── phase 1 · the builders, straight to the API ──\n");
for (const language of ["en", "fi"]) {
  const body = await draft(language);
  const c = classify(body);
  c.verdict === language
    ? ok(`output_language = ${language} -> ${c.verdict.toUpperCase()}`, `en markers ${c.en}, fi markers ${c.fi}`)
    : bad(`output_language = ${language} -> ${c.verdict.toUpperCase()}`, `en markers ${c.en}, fi markers ${c.fi}`);
  console.log(`      ${body.slice(0, 150)}\n`);
}

// ──────────────────────────────── phase 2: the route, over HTTP, with a column ──

console.log("── phase 2 · the route over HTTP, language read from the column ──\n");

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } });

const PW = "TestPassword!2026";
const stamp = Date.now().toString(36);
const brandId = `zz-lang-${stamp}`;
let user = null;

/**
 * The column has to be there before anything below means anything.
 *
 * Without this the whole phase passes vacuously in the one way that matters:
 * a missing column makes outputLanguageFor return "en", so the 'fi' call comes
 * back English and reads as a broken directive rather than a missing migration.
 */
async function requireColumns() {
  const { error } = await admin.from("brands").select("output_language, interface_language").limit(1);
  if (error) throw new Error(`brands has no language columns — run supabase/brand-language.sql (${error.message})`);
}

async function post(token, brief) {
  const res = await fetch(`${BASE}/api/copy-architect`, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ format: "product", brief, length: "short", drafts: 1 }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(json).slice(0, 200)}`);
  const bodies = (json.drafts ?? []).map((d) => d.body).join(" ");
  if (!bodies.trim()) throw new Error(`no drafts in the reply: ${JSON.stringify(json).slice(0, 200)}`);
  return bodies;
}

try {
  const ping = await fetch(BASE, { signal: AbortSignal.timeout(5000) }).catch(() => null);
  if (!ping) throw new Error(`no dev server on ${BASE} — phase 2 is the point of this probe, start one`);
  await requireColumns();

  const email = `zz-lang-${stamp}@branditect-test.invalid`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: PW, email_confirm: true });
  if (error) throw new Error(error.message);
  user = data.user;

  // Both inserts are checked. A discarded { error } here would leave the route
  // with no brand material, and the model would answer "no confirmed details"
  // in two languages — which classifies correctly and proves nothing about copy.
  const seeded = await admin.from("brands").insert({
    brand_id: brandId, user_id: user.id, brand_name: "ZZ Probe Oy",
    onboarding_completed: true, output_language: "en",
  });
  if (seeded.error) throw new Error(`could not seed the brand: ${seeded.error.message}`);

  // English material, same as phase 1: the route must write Finnish over it.
  // These are the columns buildBrandContext actually reads — price_rrp, not
  // price, or the context comes back empty and the phase passes vacuously.
  const product = await admin.from("catalog_products").insert({
    brand_id: brandId, name: "Granule 20L", type: "physical", category: "Absorbents",
    price_rrp: 42, price_model: "one-off", delivery_time: "Next working day",
    ideal_client: ["Site foremen who buy on downtime, not on price per litre"],
    description: "An industrial absorbent granule. Absorbs twelve times its own weight "
      + "and clears a spill before the shift ends.",
  });
  if (product.error) throw new Error(`could not seed the product: ${product.error.message}`);

  // Read it back through buildBrandContext's own column list. Not the builder
  // itself: brandContext.ts imports through the "@/" alias, which
  // --experimental-strip-types does not resolve. This catches the failure that
  // matters anyway — a column named differently from the one the context reads,
  // which leaves the route with nothing and makes both calls a refusal.
  const back = await admin.from("catalog_products")
    .select("name, description, price_rrp, ideal_client, deleted_at")
    .eq("brand_id", brandId).maybeSingle();
  if (!back.data?.description || back.data.price_rrp == null) {
    throw new Error(`the seeded product is not readable as brand context: ${JSON.stringify(back.data ?? back.error)}`);
  }

  const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } });
  const { data: s } = await anon.auth.signInWithPassword({ email, password: PW });
  const token = s?.session?.access_token;
  if (!token) throw new Error("the seeded user could not sign in");

  for (const language of ["en", "fi"]) {
    const { error: upErr } = await admin.from("brands")
      .update({ output_language: language }).eq("brand_id", brandId);
    if (upErr) throw new Error(`could not set output_language: ${upErr.message}`);

    // Read it back. An update that silently did nothing would make the 'fi'
    // call come back English and look like the directive failing.
    const { data: row } = await admin.from("brands")
      .select("output_language").eq("brand_id", brandId).maybeSingle();
    if (row?.output_language !== language) {
      bad(`the column did not take '${language}'`, `reads ${JSON.stringify(row?.output_language)}`);
      continue;
    }

    const body = await post(token, "the 20 litre granule");
    const c = classify(body);
    c.verdict === language
      ? ok(`POST /api/copy-architect with output_language='${language}' -> ${c.verdict.toUpperCase()}`,
           `en markers ${c.en}, fi markers ${c.fi}`)
      : bad(`POST /api/copy-architect with output_language='${language}' -> ${c.verdict.toUpperCase()}`,
            `en markers ${c.en}, fi markers ${c.fi}`);
    console.log(`      ${body.slice(0, 150)}\n`);
  }
} catch (e) {
  bad("phase 2", e.message);
} finally {
  for (const t of ["catalog_products", "brands"]) await admin.from(t).delete().eq("brand_id", brandId);
  if (user) await admin.auth.admin.deleteUser(user.id);
}

console.log(failed === 0
  ? "\nThe language is stated and it lands. The brand context was English in every run,\n" +
    "so this is the instruction winning over the material — through the route, from the column."
  : `\n${failed} check(s) failed.`);
process.exit(failed ? 1 : 0);
