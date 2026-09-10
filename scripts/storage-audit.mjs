/**
 * CRITERION 3, THE MERGE BLOCKER.
 *
 * "Every row has a non-NULL storage_path and every path resolves to an object
 * that exists, asserted BEFORE anything is flipped." A row that cannot be
 * parsed is an image that will disappear the moment the bucket goes private,
 * and there is no way back except making it public again.
 *
 * So this checks four things per URL-holding column, against the live
 * database and the live buckets:
 *
 *   1. Does the stored URL parse into a bucket and a path?
 *   2. Does that path start with the row's own brand_id? The storage policies
 *      scope on the first path segment, so a row that fails this becomes
 *      invisible to its owner rather than merely unsigned.
 *   3. Does an object actually exist at that path?
 *   4. Is any stored URL already a signed one? A signed URL in a column is a
 *      link with an expiry date sitting in the database.
 *
 * It writes nothing. Read-only, by construction: the only client calls are
 * select, list and getBucket.
 *
 * Usage: npm run storage:audit
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { COLUMNS, parseStorageUrl, brandPrefixOf, isSignedUrl } from "../lib/storage-paths.ts";

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
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("storage-audit needs the Supabase URL and the service role key");
  process.exit(2);
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/** Every object in a bucket, as a set of keys. One listing per directory. */
async function objectsIn(bucket) {
  const seen = new Set();
  const queue = [""];
  while (queue.length) {
    const prefix = queue.shift();
    let offset = 0;
    for (;;) {
      const { data, error } = await admin.storage.from(bucket)
        .list(prefix, { limit: 1000, offset });
      if (error) {
        console.error(`  could not list ${bucket}/${prefix}: ${error.message}`);
        break;
      }
      for (const entry of data ?? []) {
        const key = prefix ? `${prefix}/${entry.name}` : entry.name;
        // A directory comes back with no id.
        if (entry.id === null || entry.id === undefined) queue.push(key);
        else seen.add(key);
      }
      if ((data ?? []).length < 1000) break;
      offset += 1000;
    }
  }
  return seen;
}

const buckets = {};
{
  const { data, error } = await admin.storage.listBuckets();
  if (error) { console.error("listBuckets:", error.message); process.exit(2); }
  for (const b of data) buckets[b.name] = b.public;
}

console.log("BUCKETS");
for (const [name, isPublic] of Object.entries(buckets)) {
  console.log(`  ${name.padEnd(24)} ${isPublic ? "PUBLIC" : "private"}`);
}
const namedInSpec = ["brand-images", "brand-assets", "brand-logos"];
const missing = namedInSpec.filter((b) => !(b in buckets));
const extraPublic = Object.keys(buckets).filter((b) => buckets[b] && !namedInSpec.includes(b));
if (missing.length) console.log(`  ! named in the spec and does not exist: ${missing.join(", ")}`);
if (extraPublic.length) console.log(`  ! public and not named in the spec: ${extraPublic.join(", ")}`);

/**
 * brand_id (the TEXT slug) and id (the UUID) for every brand.
 *
 * Both are accepted as a path prefix, and that is not leniency. The templates
 * screen uploaded under `brands.id` while every other upload used
 * `brands.brand_id`; that same UUID-against-slug confusion is what made
 * templates render nowhere until supabase/brand-templates-key.sql fixed the
 * column. The objects are still on disk under the UUID. A policy that accepted
 * only the slug would hide five thumbnails the day the bucket went private,
 * which is precisely the silent mass breakage criterion 3 exists to prevent.
 * The SQL below accepts both, so the audit checks both.
 */
const brandKeys = new Map();
{
  const { data, error } = await admin.from("brands").select("id, brand_id");
  if (error) { console.error("brands:", error.message); process.exit(2); }
  for (const b of data ?? []) brandKeys.set(b.brand_id, [b.brand_id, String(b.id)]);
}

const contents = {};
for (const b of new Set(COLUMNS.map((c) => c.bucket))) contents[b] = await objectsIn(b);
const openBuckets = [];

/**
 * CRITERION 1, and it is not "read the bucket's config".
 *
 * A bucket row can say public = false while an old permissive policy on
 * storage.objects still serves the object to anyone with the URL. The only
 * honest test is to ask for a real object with no credentials at all and see
 * what comes back.
 */
console.log("\nREACHABLE WITH NO CREDENTIALS");
const base = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
for (const [bucket, keys] of Object.entries(contents)) {
  const sample = [...keys][0];
  if (!sample) { console.log(`  ${bucket.padEnd(24)} no objects, nothing to test`); continue; }
  const url = `${base}/storage/v1/object/public/${bucket}/${sample.split("/").map(encodeURIComponent).join("/")}`;
  let status = "?";
  try {
    const res = await fetch(url, { redirect: "manual" });
    status = String(res.status);
  } catch (e) { status = e.message.slice(0, 30); }
  const open = status === "200";
  if (open) openBuckets.push(bucket);
  console.log(`  ${bucket.padEnd(24)} ${status} ${open ? "OPEN — anyone with the URL can read it" : "closed"}`);
}

console.log("\nROWS");
console.log("  " + "table.column".padEnd(34) + "urls  parsed  prefix  exists  signed");
let blocking = 0;
const detail = [];

for (const col of COLUMNS) {
  const { data, error } = await admin.from(col.table).select("*").limit(5000);
  if (error) {
    console.log(`  ${(col.table + "." + col.column).padEnd(34)} — ${error.message.slice(0, 50)}`);
    blocking++;
    continue;
  }
  const rows = (data ?? []).filter((r) => {
    const v = r[col.column];
    return typeof v === "string" && (v.includes("/storage/v1/object/public/") || isSignedUrl(v));
  });

  let parsed = 0, prefixOk = 0, exists = 0, signed = 0;
  for (const r of rows) {
    const value = r[col.column];
    if (isSignedUrl(value)) { signed++; detail.push(`${col.table}#${r.id}: a SIGNED url is stored in ${col.column}`); }

    // mission_notes.content is prose: find the URL inside it rather than
    // treating the whole cell as one.
    // Prose, not a URL column: find the URL inside it. The trailing
    // punctuation matters — a markdown link ends ")" and \S+ swallows it, which
    // made this report three notes as pointing at objects that do not exist.
    // That was the audit being wrong, not the rows.
    const candidate = col.pathColumn === null
      ? (value.match(/https?:\/\/\S*\/storage\/v1\/object\/public\/\S+/) ?? [null])[0]
          ?.replace(/[)\]>.,;'"]+$/, "") ?? null
      : value;
    const ref = parseStorageUrl(candidate);
    if (!ref) { detail.push(`${col.table}#${r.id}: ${col.column} does not parse`); continue; }
    parsed++;

    if (ref.bucket !== col.bucket) {
      detail.push(`${col.table}#${r.id}: bucket is ${ref.bucket}, expected ${col.bucket}`);
    }
    const brand = r.brand_id ?? r.brandId ?? null;
    const allowed = brandKeys.get(brand) ?? (brand ? [brand] : []);
    if (allowed.indexOf(brandPrefixOf(ref.path)) !== -1) prefixOk++;
    else detail.push(
      `${col.table}#${r.id}: path "${ref.path}" is under neither ${brand} nor its uuid`);

    if (contents[ref.bucket]?.has(ref.path)) exists++;
    else detail.push(`${col.table}#${r.id}: no object at ${ref.bucket}/${ref.path}`);
  }

  const bad = rows.length - Math.min(parsed, prefixOk, exists) + signed;
  if (bad > 0) blocking += bad;
  console.log("  " + (col.table + "." + col.column).padEnd(34)
    + String(rows.length).padStart(4) + String(parsed).padStart(8)
    + String(prefixOk).padStart(8) + String(exists).padStart(8) + String(signed).padStart(8));
}

if (detail.length) {
  console.log("\nWHAT WOULD BREAK");
  for (const d of detail.slice(0, 60)) console.log("  " + d);
  if (detail.length > 60) console.log(`  … and ${detail.length - 60} more, not truncated in the count above`);
}

if (openBuckets.length) {
  console.log(`\n${openBuckets.join(", ")} still serve objects to anyone with the URL.`);
}

console.log(
  blocking === 0
    ? "\nEvery stored URL parses, sits under its own brand, and resolves to an object that exists.\n" +
      "Criterion 3 is met for the columns listed. That is what unblocks the flip — not this file existing."
    : `\n${blocking} row(s) would break. Do NOT make any bucket private until this is zero.`);
process.exit(blocking === 0 ? 0 : 1);
