/**
 * NOT RUN. Written so the four rows the audit blocks on can be fixed in one
 * reviewable step, by Saara, when she chooses.
 *
 * It writes to production storage and to production rows, which rule 2 of
 * branditect-ui/spec/queue.md puts out of reach here. Supabase Free has no
 * point-in-time recovery.
 *
 * WHAT IT FIXES. Four objects sit under a path that is neither their brand's
 * slug nor its UUID, so the prefix policies in supabase/private-buckets.sql
 * would hide them from their own owner the moment the buckets go private:
 *
 *   brand_images   x2  vetra/web/...                the slug before the -6zc3 suffix
 *   brands         x1  logos/primary-logo-...       a shared namespace
 *   brand_visual   x1  guidelines/small Sorbify...  a shared namespace
 *
 * HOW. Copy, verify, update the row, and only then remove the original. Never
 * move-then-update: a move that succeeds and an update that fails leaves a row
 * pointing at nothing, which is the outcome this whole item exists to avoid.
 *
 *   npm run storage:remediate -- --dry-run     (default; changes nothing)
 *   npm run storage:remediate -- --apply
 *   npm run storage:remediate -- --apply --delete-originals
 *
 * The originals are left in place unless asked for. They cost a few kilobytes
 * and they are the only way back.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { parseStorageUrl, brandPrefixOf } from "../lib/storage-paths.ts";

const APPLY = process.argv.includes("--apply");
const DELETE_ORIGINALS = process.argv.includes("--delete-originals");

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
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/** Every row whose object path is not under its own brand. */
const TARGETS = [
  { table: "brand_images", column: "file_url", pathColumn: "storage_path", bucket: "brand-images" },
  { table: "brands", column: "logo_url", pathColumn: "logo_storage_path", bucket: "brand-assets", brandFrom: "brand_id" },
  { table: "brand_visual", column: "guideline_url", pathColumn: "guideline_storage_path", bucket: "brand-assets" },
];

const { data: brands } = await admin.from("brands").select("id, brand_id");
const keysFor = new Map((brands ?? []).map((b) => [b.brand_id, [b.brand_id, String(b.id)]]));

let planned = 0, done = 0, failed = 0;

for (const t of TARGETS) {
  const { data, error } = await admin.from(t.table).select("*").limit(5000);
  if (error) { console.error(`${t.table}: ${error.message}`); failed++; continue; }

  for (const row of data ?? []) {
    const ref = parseStorageUrl(row[t.column]);
    if (!ref || ref.bucket !== t.bucket) continue;
    const brand = row.brand_id ?? null;
    if (!brand) continue;
    const allowed = keysFor.get(brand) ?? [brand];
    if (allowed.indexOf(brandPrefixOf(ref.path)) !== -1) continue;

    // Keep the filename; put it under the brand. Never flatten two files with
    // the same name into one key.
    const target = `${brand}/${ref.path}`;
    planned++;
    console.log(`${APPLY ? "MOVE" : "would move"}  ${t.table}#${row.id}`);
    console.log(`            ${t.bucket}/${ref.path}`);
    console.log(`         -> ${t.bucket}/${target}`);
    if (!APPLY) continue;

    const { error: copyErr } = await admin.storage.from(t.bucket).copy(ref.path, target);
    if (copyErr && !/exists/i.test(copyErr.message)) {
      console.error(`  copy failed: ${copyErr.message}`); failed++; continue;
    }
    // Verify before touching the row. A copy that reported success and did not
    // land would otherwise be written into the database as truth.
    const dir = target.split("/").slice(0, -1).join("/");
    const name = target.split("/").pop();
    const { data: listed } = await admin.storage.from(t.bucket).list(dir, { limit: 1000 });
    if (!(listed ?? []).some((e) => e.name === name)) {
      console.error("  copy reported success but the object is not there"); failed++; continue;
    }

    const patch = { [t.pathColumn]: target };
    const { error: upErr } = await admin.from(t.table).update(patch).eq("id", row.id);
    if (upErr) { console.error(`  row update failed: ${upErr.message}`); failed++; continue; }

    if (DELETE_ORIGINALS) {
      const { error: rmErr } = await admin.storage.from(t.bucket).remove([ref.path]);
      if (rmErr) console.error(`  original left in place: ${rmErr.message}`);
    }
    done++;
  }
}

console.log(
  APPLY
    ? `\n${done} moved, ${failed} failed. Re-run npm run storage:audit — it must reach zero before any bucket goes private.`
    : `\n${planned} row(s) would move. Nothing was changed. Add --apply to do it.`);
process.exit(failed ? 1 : 0);
