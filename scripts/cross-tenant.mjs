/**
 * Sign in as user A. Try to read user B's brand. Every table.
 *
 * The browser talks to Supabase directly, so RLS is the only thing between one
 * tester's margins and another's. A policy audit checks what is written down;
 * this checks what actually happens over the wire, as a signed-in user with a
 * real JWT and the anon key — the same path the app uses.
 *
 * TWO GUARDS AGAINST A PASS THAT MEANS NOTHING. Both exist because an earlier
 * version of this audit counted foreign rows and reported a world-open table
 * with no rows in it as closed.
 *
 *   1. B's brand is seeded with a real row in every table before A goes
 *      looking. A table A cannot read because it is empty proves nothing.
 *   2. A must be able to read its OWN row in that table. If A can read
 *      nothing anywhere, "A cannot read B" is true and worthless.
 *
 * A table that cannot be seeded is reported UNVERIFIED, never PASS.
 *
 * Usage: node scripts/cross-tenant.mjs
 * Needs NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and
 * SUPABASE_SERVICE_ROLE_KEY, from .env.local or the environment.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

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
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !ANON || !SERVICE) {
  console.error("cross-tenant needs the Supabase URL, the anon key and the service role key");
  process.exit(2);
}

const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });

/** Every table the application reads or writes, from a grep of app/, lib/, components/. */
const TABLES = [
  "brand_book_assets", "brand_book_colors", "brand_book_pages", "brand_catalog",
  "brand_documents", "brand_financial_rules", "brand_fonts", "brand_guideline",
  "brand_images", "brand_logos", "brand_strategies", "brand_templates",
  "brand_tone", "brand_visual", "brand_visual_dna", "brands", "catalog_products",
  "mission_goals", "mission_notes", "mission_tasks", "note_blocks", "notes",
  "onboarding", "product_documents", "product_images", "product_specs",
  "social_strategy",
];

/**
 * Hints for tables the generic seeder cannot guess: enum-style CHECK
 * constraints, array columns, and rows that need a real foreign key. Without
 * these the interesting tables report UNVERIFIED, and catalog_products — where
 * the margins live — is the one that matters most.
 */
const HINTS = {
  catalog_products: { name: "ZZ Product", type: "physical" },
  note_blocks: { kind: "text", body: "zz" },
  brand_catalog: { business_types: ["physical"] },
};

/** Tables whose row needs a parent created first. */
const DEPENDENT = new Set(["note_blocks", "product_images", "product_documents", "brand_templates"]);

const PW = "TestPassword!2026";
const stamp = Date.now().toString(36);

async function makeUser(letter) {
  const email = `zz-xt-${letter}-${stamp}@branditect-test.invalid`;
  const { data, error } = await admin.auth.admin.createUser({
    email, password: PW, email_confirm: true,
  });
  if (error) throw new Error(`could not create user ${letter}: ${error.message}`);
  const brandId = `zz-xt-${letter}-${stamp}`;
  const { error: bErr } = await admin.from("brands").insert({
    brand_id: brandId, user_id: data.user.id, brand_name: `ZZ ${letter}`,
    onboarding_completed: true,
  });
  if (bErr) throw new Error(`could not create brand ${letter}: ${bErr.message}`);
  return { email, userId: data.user.id, brandId };
}

/**
 * Insert one row, discovering required columns from the errors rather than
 * hardcoding a schema that would go stale. Returns null when the table cannot
 * be seeded, which is reported as UNVERIFIED rather than quietly skipped.
 */
async function seedRow(table, brandId, extra = {}) {
  // product_specs is scoped by product, not brand, and has no brand_id column.
  const row = table === "product_specs" ? { ...extra } : { brand_id: brandId, ...extra };
  for (let attempt = 0; attempt < 14; attempt++) {
    const { data, error } = await admin.from(table).insert(row).select().limit(1);
    if (!error) return data?.[0] ?? row;

    const msg = error.message;
    const missing = msg.match(/null value in column "([^"]+)"/)?.[1]
      ?? msg.match(/column "([^"]+)" of relation .* does not exist/)?.[1];
    if (missing && !(missing in row)) {
      // Guess by name, then by the type error the next attempt returns.
      row[missing] = /_at$|date/.test(missing) ? new Date().toISOString()
        : /count|order|index|number|qty|amount|price|cost/.test(missing) ? 0
        : /^is_|^has_|enabled|completed/.test(missing) ? false
        : `zz-${missing}`;
      continue;
    }
    const badType = msg.match(/invalid input syntax for type (\w+)/)?.[1];
    if (badType) {
      const guessed = Object.keys(row).find((k) => typeof row[k] === "string" && k !== "brand_id");
      if (guessed) {
        row[guessed] = badType === "boolean" ? false
          : /int|numeric|double/.test(badType) ? 0
          : badType === "uuid" ? "00000000-0000-0000-0000-000000000000"
          : new Date().toISOString();
        continue;
      }
    }
    const checkFail = msg.match(/violates check constraint "([^"]+)"/);
    if (checkFail) {
      // A CHECK we cannot satisfy blindly. Report rather than guess forever.
      return { __unseedable: `check constraint ${checkFail[1]}` };
    }
    return { __unseedable: msg.slice(0, 90) };
  }
  return { __unseedable: "gave up after 14 attempts" };
}

const results = [];
let A, B;

try {
  A = await makeUser("a");
  B = await makeUser("b");

  // Seed BOTH brands in every table. B so A has something to fail to find,
  // A so "A sees nothing" can be distinguished from "A sees nothing anywhere".
  const seeded = {};
  const parents = {};

  // Parents first, so the dependent tables have real ids to point at.
  for (const u of [A, B]) {
    const prod = await seedRow("catalog_products", u.brandId, HINTS.catalog_products);
    const img = await seedRow("brand_images", u.brandId,
      { file_name: "zz.png", file_url: "https://example.invalid/zz.png", category: "product" });
    const doc = await seedRow("brand_documents", u.brandId,
      { file_name: "zz.pdf", file_type: "pdf", category: "other", storage_path: "", status: "ready" });
    const note = await seedRow("notes", u.brandId, { title: "ZZ" });
    parents[u.brandId] = { prod, img, doc, note };
  }

  for (const t of TABLES) {
    if (t === "brands") { seeded[t] = true; continue; }
    const rows = {};
    for (const u of [A, B]) {
      const p = parents[u.brandId];
      const extra = { ...(HINTS[t] ?? {}) };
      if (t === "note_blocks") extra.note_id = p.note?.id;
      if (t === "product_images") { extra.product_id = p.prod?.id; extra.image_id = p.img?.id; }
      if (t === "product_documents") { extra.product_id = p.prod?.id; extra.document_id = p.doc?.id; }
      if (t === "product_specs") extra.product_id = p.prod?.id;
      if (t === "brand_templates") extra.name = "ZZ template";
      rows[u.brandId] = DEPENDENT.has(t) && Object.values(extra).some((v) => v === undefined)
        ? { __unseedable: "parent row could not be created" }
        : await seedRow(t, u.brandId, extra);
    }
    const bad = rows[B.brandId]?.__unseedable ?? rows[A.brandId]?.__unseedable;
    seeded[t] = !bad;
    if (bad) results.push({ table: t, verdict: "UNVERIFIED", why: bad });
  }

  // Sign in as A the way the browser does: anon key, password grant.
  const asA = createClient(URL_, ANON, { auth: { persistSession: false } });
  const { data: session, error: signInErr } =
    await asA.auth.signInWithPassword({ email: A.email, password: PW });
  if (signInErr || !session.session) throw new Error(`A could not sign in: ${signInErr?.message}`);

  for (const t of TABLES) {
    if (seeded[t] === false) continue;

    // product_specs is scoped by product rather than brand.
    const col = t === "product_specs" ? "product_id" : "brand_id";
    const bKey = t === "product_specs" ? parents[B.brandId].prod?.id : B.brandId;
    const aKey = t === "product_specs" ? parents[A.brandId].prod?.id : A.brandId;

    const { data: foreign, error: fErr } = await asA
      .from(t).select("*").eq(col, bKey).limit(5);
    const { data: own, error: oErr } = await asA
      .from(t).select("*").eq(col, aKey).limit(5);

    const leaked = (foreign ?? []).length;
    const seesOwn = (own ?? []).length > 0;

    if (leaked > 0) {
      results.push({ table: t, verdict: "LEAKS", why: `A read ${leaked} of B's rows` });
    } else if (!seesOwn) {
      // Not a leak, but this table's pass is not evidence: A cannot read its
      // own row either, so "A cannot read B" is true of everything.
      results.push({ table: t, verdict: "UNVERIFIED",
        why: `A cannot read its own row either${oErr ? ` (${oErr.message.slice(0, 50)})` : ""}` });
    } else {
      results.push({ table: t, verdict: "PASS", why: fErr ? `blocked: ${fErr.message.slice(0, 40)}` : "0 of B's rows" });
    }
  }
} catch (e) {
  console.error("cross-tenant could not run:", e.message);
  process.exitCode = 2;
} finally {
  for (const u of [A, B]) {
    if (!u) continue;
    for (const t of [...TABLES].reverse()) {
      const { error } = await admin.from(t).delete().eq("brand_id", u.brandId);
      if (error && !/does not exist|schema cache|column/.test(error.message)) {
        console.error(`cleanup: ${t}: ${error.message}`);
      }
    }
    await admin.auth.admin.deleteUser(u.userId);
  }
}

const leaks = results.filter((r) => r.verdict === "LEAKS");
const unverified = results.filter((r) => r.verdict === "UNVERIFIED");
const pass = results.filter((r) => r.verdict === "PASS");

for (const r of results.sort((x, y) => x.verdict.localeCompare(y.verdict) || x.table.localeCompare(y.table))) {
  console.log(`${r.verdict.padEnd(11)} ${r.table.padEnd(24)} ${r.why}`);
}
console.log(`\n${pass.length} closed · ${leaks.length} LEAKING · ${unverified.length} unverified` +
  ` · ${TABLES.length} tables`);
if (unverified.length) {
  console.log("Unverified is not a pass. Each one is a table this run could not put a row in,\n" +
    "or one where A could not read its own row, so nothing was actually proved about it.");
}
process.exit(leaks.length ? 1 : 0);
