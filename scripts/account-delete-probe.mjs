/**
 * Queue item 4, criteria 1-6. branditect-ui/spec/security-hardening.md part 4.
 *
 * Two real accounts, two real brands, a real password grant, a real POST.
 * Nothing mocked, and nothing this writes is outside a `zz-del-` brand.
 *
 * WHAT IT SEEDS, AND WHY GENERICALLY. It does not seed "the tables I thought
 * of" — it enumerates every relation with a `brand_id` from PostgREST's own
 * schema document, the same source the route uses, and seeds a row in each by
 * reading that relation's required columns. A table added tomorrow is seeded
 * tomorrow, so the coverage cannot drift away from the schema. Relations it
 * genuinely cannot seed are named in the output rather than skipped quietly.
 *
 *   1. every relation with a brand_id is cleared, enumerated at run time
 *   2. every storage object under the brand's prefixes is gone, all buckets
 *   3. the auth user is gone and the email can sign up again
 *   4. the old password no longer signs in
 *   5. brand B is untouched, counted in every relation before and after
 *   6. the operation logs table names and counts (in the server output)
 *
 * It also checks what the criteria do not: `product_specs` has no `brand_id`
 * and scopes through `catalog_products` with ON DELETE CASCADE, so it is
 * exactly the row that a brand_id-shaped deletion leaves behind. It is seeded
 * and checked.
 *
 * Usage: node scripts/account-delete-probe.mjs   (needs a dev server on :3000)
 */
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { storagePrefixesFor } from "../lib/account-deletion.ts";

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
const ok  = (m, d = "") => console.log(`PASS  ${m}${d ? " — " + d : ""}`);
const bad = (m, d = "") => { fails++; console.log(`FAIL  ${m}${d ? " — " + d : ""}`); };

// ─────────────────────────────────────────────────────────── the schema ──

async function liveSchema() {
  const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
  });
  if (!res.ok) throw new Error(`schema ${res.status}`);
  return res.json();
}
const schema = await liveSchema();

/**
 * The probe enumerates for itself.
 *
 * It used to call `relationsWithBrandId`, the function the route uses. A
 * control that removed one table from that function removed it from the check
 * as well, and "all relations cleared" went green over a table nobody had
 * deleted. A verification that shares its subject's reasoning verifies
 * nothing. This is the same filter written separately, on purpose.
 */
const TABLES = Object.entries(schema.definitions ?? {})
  .filter(([, d]) => "brand_id" in (d.properties ?? {}))
  .map(([name]) => name)
  .sort();
if (!TABLES.includes("brands")) { console.error("the schema has no brands table"); process.exit(2); }
console.log(`${TABLES.length} relations carry a brand_id, read from the live schema:\n  ${TABLES.join(", ")}\n`);

/** A value for a required column, from its declared format. */
function valueFor(prop) {
  const fmt = prop?.format ?? "text";
  if (fmt === "uuid") return randomUUID();
  if (/int|numeric|double|real/.test(fmt)) return 0;
  if (fmt === "boolean") return false;
  if (/timestamp|date/.test(fmt)) return new Date().toISOString();
  if (fmt === "jsonb" || fmt === "json") return {};
  if (fmt.endsWith("[]")) return [];
  return `zz-${stamp}`;
}

/** The table a column points at, from PostgREST's own FK annotation. */
function fkTarget(prop) {
  return prop?.description?.match(/<fk table='([^']+)'/)?.[1] ?? null;
}

/**
 * Seed one row in every relation, without a list of tables or of foreign keys.
 *
 * Two things make this generic rather than a pile of special cases:
 *
 *   - **A template row.** Half these columns carry CHECK constraints —
 *     `catalog_products.type`, `brand_images.format`, `note_blocks.kind` —
 *     and nothing in the schema document says what they allow. So it copies
 *     one row that already exists in the table and overwrites the keys. The
 *     copy lives under a `zz-del-` brand for the length of this run and is
 *     deleted in the finally; nothing is written to the row it copied.
 *   - **The FK annotation.** PostgREST states the target of every foreign key
 *     in the column description, so a `*_id` is filled with the id of the row
 *     this seeder already made in the table it points at — no map of parents
 *     here to go stale.
 *
 * Fixpoint, not topological: a table whose parent is not seeded yet is
 * retried on the next pass. What is still unseeded at the end is named.
 */
async function seedEveryTable(brandId, userId) {
  const created = {};
  const errors = {};
  let todo = TABLES.filter((t) => t !== "brands");

  for (let pass = 0; pass < 5 && todo.length; pass++) {
    const still = [];
    for (const table of todo) {
      const def = schema.definitions[table] ?? {};
      const props = def.properties ?? {};

      // A row that already exists, for its constraint-satisfying values.
      const { data: template } = await admin.from(table).select("*").limit(1).maybeSingle();
      const row = {};
      for (const [col, prop] of Object.entries(props)) {
        if (template && template[col] !== null && template[col] !== undefined) row[col] = template[col];
        else if ((def.required ?? []).includes(col)) row[col] = valueFor(prop);
      }

      // Keys, last, so they beat anything the template brought.
      row.brand_id = brandId;
      if ("user_id" in props) row.user_id = userId;
      // A fresh primary key only where it is a uuid. Eight of these tables
      // have a bigint id from a sequence, and handing one a uuid is how the
      // first version of this seeder "proved" they could not be seeded.
      if ("id" in props) {
        if (props.id.format === "uuid") row.id = randomUUID();
        else delete row.id;
      }

      let waiting = null;
      for (const [col, prop] of Object.entries(props)) {
        const target = fkTarget(prop);
        if (!target) continue;
        if (target === "brands") { row[col] = col.endsWith("brand_id") ? brandId : created.brands; continue; }
        if (created[target]) row[col] = created[target];
        else if ((def.required ?? []).includes(col)) waiting = target;
        else delete row[col];
      }
      if (waiting) { still.push(table); errors[table] = `waiting for ${waiting}`; continue; }

      const { data, error } = await admin.from(table).insert(row).select().maybeSingle();
      if (error) { still.push(table); errors[table] = error.message; continue; }
      created[table] = data?.id ?? true;
      delete errors[table];
    }
    if (still.length === todo.length) { todo = still; break; }   // no progress
    todo = still;
  }
  return { created, unseeded: todo, errors };
}

/** Counts for one brand in every relation, so B can be compared to itself. */
async function countAll(brandId) {
  const out = {};
  for (const t of TABLES) {
    const { count, error } = await admin.from(t).select("*", { count: "exact", head: true }).eq("brand_id", brandId);
    out[t] = error ? `ERR ${error.message}` : (count ?? 0);
  }
  return out;
}

async function objectsUnder(bucket, prefix) {
  const keys = [], queue = [prefix];
  while (queue.length) {
    const dir = queue.shift();
    const { data } = await admin.storage.from(bucket).list(dir, { limit: 1000 });
    for (const e of data ?? []) {
      const key = dir ? `${dir}/${e.name}` : e.name;
      (e.id === null || e.id === undefined) ? queue.push(key) : keys.push(key);
    }
  }
  return keys;
}

async function makeAccount(letter) {
  const email = `zz-del-${letter}-${stamp}@branditect-test.invalid`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: PW, email_confirm: true });
  if (error) throw new Error(error.message);
  const brandId = `zz-del-${letter}-${stamp}`;
  const { data: brand, error: bErr } = await admin.from("brands")
    .insert({ brand_id: brandId, user_id: data.user.id, brand_name: `ZZ Delete ${letter.toUpperCase()}`, onboarding_completed: true })
    .select().single();
  if (bErr) throw new Error(bErr.message);
  return { email, userId: data.user.id, brandId, brand };
}

let A = null, B = null;
const buckets = (await admin.storage.listBuckets()).data ?? [];

try {
  A = await makeAccount("a");
  B = await makeAccount("b");

  // ── seed both, generically ─────────────────────────────────────────────
  const seedA = await seedEveryTable(A.brandId, A.userId);
  const seedB = await seedEveryTable(B.brandId, B.userId);
  const seededCount = Object.keys(seedA.created).length;
  console.log(`seeded ${seededCount}/${TABLES.length - 1} relations for A`);
  for (const t of seedA.unseeded) console.log(`  not seeded · ${t}: ${seedA.errors[t]}`);
  // product_attachment_counts is a view over catalog_products and cannot be
  // inserted into. Anything else unseeded is coverage this probe does not have.
  const missed = seedA.unseeded.filter((t) => t !== "product_attachment_counts");
  missed.length === 0
    ? ok(`every insertable relation seeded`, `${seededCount} of ${TABLES.length - 1}`)
    : bad("the seeder missed relations, so their deletion is unproven", missed.join(", "));

  // product_specs: no brand_id, scoped through the product. The row a
  // brand_id-shaped deletion is most likely to strand.
  const { data: prodA } = await admin.from("catalog_products")
    .select("id").eq("brand_id", A.brandId).limit(1).maybeSingle();
  let specId = null;
  if (prodA?.id) {
    const { data: spec } = await admin.from("product_specs")
      .insert({ product_id: prodA.id, key: "zz", value: "zz", sort_order: 0 }).select().maybeSingle();
    specId = spec?.id ?? null;
  }
  specId ? ok("seeded a product_specs row, which has no brand_id of its own")
         : bad("could not seed product_specs", "the cascade check below proves nothing");

  // ── storage, under BOTH prefixes, in every bucket ──────────────────────
  const prefixes = storagePrefixesFor(A.brand);
  console.log(`A's storage prefixes: ${prefixes.join(", ")}`);
  let placed = 0;
  for (const b of buckets) {
    for (const p of prefixes) {
      const { error } = await admin.storage.from(b.name)
        .upload(`${p}/zz-probe/${stamp}.txt`, new Blob(["zz"]), { upsert: true });
      if (!error) placed++;
    }
    for (const p of storagePrefixesFor(B.brand)) {
      await admin.storage.from(b.name).upload(`${p}/zz-probe/${stamp}.txt`, new Blob(["zz"]), { upsert: true });
    }
  }
  placed === buckets.length * prefixes.length
    ? ok(`placed ${placed} object(s) for A across ${buckets.length} bucket(s), both prefixes`)
    : bad(`only ${placed} of ${buckets.length * prefixes.length} objects placed for A`);

  const beforeB = await countAll(B.brandId);
  const beforeA = await countAll(A.brandId);
  const seededTables = TABLES.filter((t) => typeof beforeA[t] === "number" && beforeA[t] > 0);
  console.log(`A has rows in ${seededTables.length} relations before deletion\n`);

  // ── the call ───────────────────────────────────────────────────────────
  const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } });
  const { data: s } = await anon.auth.signInWithPassword({ email: A.email, password: PW });
  const token = s?.session?.access_token;
  if (!token) throw new Error("A could not sign in");

  const call = (payload, bearer = token) => fetch(`${BASE}/api/account/delete`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) },
    body: JSON.stringify(payload),
  });

  const nobody = await call({ confirm: "ZZ Delete A" }, null);
  nobody.status === 401 ? ok("401 with no account") : bad("no account", `got ${nobody.status}`);

  const wrong = await call({ confirm: "not the brand name" });
  const stillThere = (await countAll(A.brandId))["brands"];
  wrong.status === 400 && stillThere === 1
    ? ok("a wrong confirmation deletes nothing", `${wrong.status}`)
    : bad("a wrong confirmation", `status ${wrong.status}, brands row ${stillThere}`);

  const empty = await call({ confirm: "" });
  empty.status === 400 ? ok("an empty confirmation is refused") : bad("empty confirmation", `got ${empty.status}`);

  const res = await call({ confirm: A.brand.brand_name });
  const json = await res.json().catch(() => ({}));
  res.ok ? ok("the deletion returned 200", JSON.stringify(json))
         : bad("the deletion failed", `${res.status} ${JSON.stringify(json).slice(0, 300)}`);

  // ── criterion 1 · every relation cleared ───────────────────────────────
  const afterA = await countAll(A.brandId);
  const leftover = TABLES.filter((t) => afterA[t] !== 0);
  leftover.length === 0
    ? ok(`1 · all ${TABLES.length} relations cleared`, `${seededTables.length} had rows`)
    : bad("1 · rows survived", leftover.map((t) => `${t}=${afterA[t]}`).join(", "));

  // the row with no brand_id, reached only by cascade
  if (specId) {
    const { data: spec } = await admin.from("product_specs").select("id").eq("id", specId).maybeSingle();
    spec ? bad("product_specs row survived", "no brand_id, so nothing deleted it")
         : ok("the product_specs row went with its product, by cascade");
  }

  // ── criterion 2 · every object gone, every bucket, both prefixes ───────
  let left = [];
  for (const b of buckets) {
    for (const p of prefixes) {
      for (const k of await objectsUnder(b.name, p)) left.push(`${b.name}/${k}`);
    }
  }
  left.length === 0 ? ok("2 · no storage object left under either prefix, in any bucket")
                    : bad("2 · storage survived", left.join(", "));

  // ── criteria 3 and 4 · the user, and the email ─────────────────────────
  const { data: gone } = await admin.auth.admin.getUserById(A.userId);
  !gone?.user ? ok("3 · the auth user is gone") : bad("3 · the auth user is still there");

  const { data: reSignin, error: reErr } = await anon.auth.signInWithPassword({ email: A.email, password: PW });
  (!reSignin?.session && reErr) ? ok("4 · the old password no longer signs in", reErr.message)
                                : bad("4 · the deleted account still signs in");

  const { data: reSignup, error: suErr } = await admin.auth.admin.createUser({
    email: A.email, password: PW, email_confirm: true });
  if (reSignup?.user) {
    ok("3 · the email can sign up again");
    await admin.auth.admin.deleteUser(reSignup.user.id);
  } else {
    bad("3 · the email cannot sign up again", suErr?.message);
  }

  // ── criterion 5 · B untouched, counted in every relation ───────────────
  const afterB = await countAll(B.brandId);
  const moved = TABLES.filter((t) => String(beforeB[t]) !== String(afterB[t]));
  moved.length === 0
    ? ok(`5 · brand B unchanged in all ${TABLES.length} relations`,
         `${TABLES.filter((t) => beforeB[t] > 0).length} of them non-empty`)
    : bad("5 · brand B changed", moved.map((t) => `${t} ${beforeB[t]}->${afterB[t]}`).join(", "));

  let bLeft = 0;
  for (const b of buckets) for (const p of storagePrefixesFor(B.brand)) bLeft += (await objectsUnder(b.name, p)).length;
  const bExpected = buckets.length * storagePrefixesFor(B.brand).length;
  bLeft === bExpected
    ? ok("5 · brand B's storage objects are all still there", `${bLeft}`)
    : bad("5 · brand B lost storage", `${bLeft} of ${bExpected} left`);
} catch (e) {
  bad("harness", e.stack ?? e.message);
} finally {
  for (const u of [A, B]) {
    if (!u) continue;
    for (const t of TABLES) await admin.from(t).delete().eq("brand_id", u.brandId);
    for (const b of buckets) {
      for (const p of storagePrefixesFor(u.brand ?? {})) {
        const keys = await objectsUnder(b.name, p);
        if (keys.length) await admin.storage.from(b.name).remove(keys);
      }
    }
    await admin.auth.admin.deleteUser(u.userId).catch(() => {});
  }
}

console.log(fails ? `\n${fails} FAILING` : "\nall pass");
process.exit(fails ? 1 : 0);
