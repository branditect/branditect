/**
 * Can a stranger read the files?
 *
 * The RLS audit reads policy text. This asks the live service the only
 * question that matters, the way an outsider would ask it: with the
 * publishable anon key that ships inside every page of the app, and no account
 * at all.
 *
 * It exists because the repo already had tests that would have caught this and
 * did not. lib/storage.test.ts asserts that every storage policy in supabase/
 * names the caller — true, and irrelevant, because the policies that were
 * actually live had been created by hand in the dashboard and named nobody.
 * A test that reads the repo cannot see the database.
 *
 * On 2026-09-18 this probe listed every brand's folder in brand-documents and
 * downloaded a 6 MB file belonging to another customer, signed in as no one.
 *
 * Usage: node scripts/storage-probe.mjs
 * Exits non-zero if anonymous access reads, writes or deletes anything.
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
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) {
  console.error("storage-probe needs NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(2);
}

let fails = 0;
const ok = (m, d = "") => console.log(`PASS  ${m}${d ? " — " + d : ""}`);
const bad = (m, d = "") => { fails++; console.log(`FAIL  ${m}${d ? " — " + d : ""}`); };

/** No session. This is a stranger with the key from the page source. */
const anon = createClient(url, anonKey, { auth: { persistSession: false } });

const PRIVATE = "brand-documents";
const PUBLIC_BUCKETS = ["brand-assets", "brand-images", "brand-reference-images"];

/* ── The private bucket: nothing, in any direction ───────────────────────── */

const { data: folders } = await anon.storage.from(PRIVATE).list("", { limit: 20 });
if ((folders ?? []).length > 0) {
  bad(`anonymous lists ${PRIVATE}`, `${folders.length} folders: ${folders.slice(0, 3).map((f) => f.name).join(", ")}`);

  // Follow it in, because an empty file list would understate the problem.
  const inner = await anon.storage.from(PRIVATE).list(folders[0].name, { limit: 3 });
  const file = (inner.data ?? [])[0];
  if (file) {
    const path = `${folders[0].name}/${file.name}`;
    const { data: blob } = await anon.storage.from(PRIVATE).download(path);
    if (blob) bad("anonymous DOWNLOADS a customer's document", `${(blob.size / 1048576).toFixed(1)} MB — ${path}`);
    const { data: signed } = await anon.storage.from(PRIVATE).createSignedUrl(path, 60);
    if (signed?.signedUrl) bad("anonymous mints a signed URL for it");
  }
} else {
  ok(`anonymous sees nothing in ${PRIVATE}`);
}

/* ── Writing: the damage nobody would notice until it was done ───────────── */

for (const bucket of [PRIVATE, ...PUBLIC_BUCKETS]) {
  const path = `zz-probe/${Date.now()}.txt`;
  const { error } = await anon.storage
    .from(bucket)
    .upload(path, new Blob(["probe"], { type: "text/plain" }));

  if (error) {
    ok(`anonymous cannot write to ${bucket}`, error.message.slice(0, 40));
  } else {
    bad(`ANONYMOUS WROTE INTO ${bucket}`, path);
    // Clean up after ourselves — and in doing so, measure delete too.
    const { error: delErr } = await anon.storage.from(bucket).remove([path]);
    if (!delErr) bad(`anonymous also DELETES from ${bucket}`);
  }
}

/* ── Public buckets: reads are open by design, for now ───────────────────── */

for (const bucket of PUBLIC_BUCKETS) {
  const { data } = await anon.storage.from(bucket).list("", { limit: 1 });
  if ((data ?? []).length > 0) {
    console.log(`NOTE  ${bucket} is still a public bucket — anyone with a URL can read it. ` +
      `Closing that is supabase/private-buckets.sql, after the paths are remediated.`);
  }
}

console.log(fails ? `\n${fails} FAILING — storage is open` : "\nNothing readable or writable without an account.");
process.exit(fails ? 1 : 0);
