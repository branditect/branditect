/**
 * /api/vault/extract reads text-layer PDFs and Office files itself, with no
 * provider call (lib/local-extract.ts). This proves it end to end against a
 * running build: each file comes back ready, with its whole text, and no
 * usage_events row — nothing was metered, so nothing was spent.
 *
 * Uses a throwaway `zz-vx-` account and brand, deleted afterwards. Does not
 * send a scan or an image: those still go to the model, and cost money.
 *
 * Usage: next build && next start, then
 *   BASE=http://localhost:3000 node scripts/vault-extract-local.mjs
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { zipSync, strToU8 } from "fflate";

const BASE = process.env.BASE ?? "http://localhost:3000";
const env = {};
for (const l of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const PW = "TestPassword!2026";
const stamp = Date.now().toString(36);
const email = `zz-vx-${stamp}@branditect-test.invalid`, brandId = `zz-vx-${stamp}`;
let fails = 0;
const ok = (m, d = "") => console.log(`PASS  ${m}${d ? " — " + d : ""}`);
const bad = (m, d = "") => { fails++; console.log(`FAIL  ${m}${d ? " — " + d : ""}`); };

const LINE = "Sorbify absorbs oil spills fast and is made in Finland for professional use";
function pdf(lines) {
  const body = lines.map((l, i) => `BT /F1 12 Tf 50 ${750 - i * 16} Td (${l}) Tj ET`).join("\n");
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${body.length} >>\nstream\n${body}\nendstream`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n"; const offs = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
  return Buffer.from(out, "latin1");
}
const zip = (files) => Buffer.from(zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(v)]))));

const FILES = [
  { name: "brochure.pdf", type: "application/pdf", bytes: pdf(Array(8).fill(LINE)), expect: /made in Finland/ },
  { name: "plan.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    bytes: zip({ "word/document.xml": "<w:document><w:body><w:p><w:r><w:t>Hinta &amp; kate: 82,2 %</w:t></w:r></w:p></w:body></w:document>" }),
    expect: /Hinta & kate: 82,2 %/ },
  { name: "prices.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    bytes: zip({
      "xl/workbook.xml": '<workbook><sheets><sheet name="Hinnasto" sheetId="1"/></sheets></workbook>',
      "xl/sharedStrings.xml": "<sst><si><t>Sorbify Oil</t></si></sst>",
      "xl/worksheets/sheet1.xml": '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1"><v>24.9</v></c></row></sheetData></worksheet>',
    }),
    expect: /Sorbify Oil\t24\.9/ },
];

let user = null;
try {
  const { data, error } = await admin.auth.admin.createUser({ email, password: PW, email_confirm: true });
  if (error) throw new Error(error.message);
  user = data.user;
  await admin.from("brands").insert({ brand_id: brandId, user_id: user.id, brand_name: "ZZ Vault Extract", onboarding_completed: true });
  const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data: s, error: se } = await anon.auth.signInWithPassword({ email, password: PW });
  if (se) throw new Error(se.message);
  const token = s.session.access_token;

  for (const f of FILES) {
    const path = `${brandId}/${Date.now()}_${f.name}`;
    const up = await admin.storage.from("brand-documents").upload(path, f.bytes, { contentType: f.type });
    if (up.error) { bad(f.name, `upload: ${up.error.message}`); continue; }
    const { data: row } = await admin.from("brand_documents").insert({
      brand_id: brandId, file_name: f.name, file_type: f.name.split(".").pop(), category: "company-info",
      storage_path: path, pages_count: 0, status: "processing",
    }).select("id").single();
    const t0 = Date.now();
    const res = await fetch(`${BASE}/api/vault/extract`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ documentId: row.id, storagePath: path, brandId }),
    });
    const body = await res.json().catch(() => ({}));
    const { data: after } = await admin.from("brand_documents").select("status, extracted_text, content_sha256").eq("id", row.id).single();
    if (res.status === 200 && after.status === "ready" && f.expect.test(after.extracted_text ?? "")) {
      ok(`${f.name} read locally`, `${Date.now() - t0} ms, ${after.extracted_text.length} chars, hash ${after.content_sha256 ? "stored" : "missing"}`);
    } else {
      bad(`${f.name}`, `HTTP ${res.status} ${JSON.stringify(body).slice(0, 160)} status=${after?.status} text=${JSON.stringify((after?.extracted_text ?? "").slice(0, 80))}`);
    }
  }

  const { count } = await admin.from("usage_events").select("id", { count: "exact", head: true }).eq("brand_id", brandId);
  count === 0 ? ok("no provider call was metered", "usage_events has no row for this brand") : bad("provider calls were metered", `${count} usage_events rows`);
} catch (e) {
  bad("harness", e instanceof Error ? e.message : String(e));
} finally {
  const { data: objs } = await admin.storage.from("brand-documents").list(brandId);
  if (objs?.length) await admin.storage.from("brand-documents").remove(objs.map((o) => `${brandId}/${o.name}`));
  await admin.from("brand_documents").delete().eq("brand_id", brandId);
  await admin.from("usage_events").delete().eq("brand_id", brandId);
  await admin.from("brand_budget").delete().eq("brand_id", brandId);
  await admin.from("brands").delete().eq("brand_id", brandId);
  if (user) await admin.auth.admin.deleteUser(user.id).catch(() => {});
}
console.log(fails ? `\n${fails} failed` : "\nall passed");
process.exit(fails ? 1 : 0);
