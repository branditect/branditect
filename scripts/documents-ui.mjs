/**
 * Knowledge ▸ Documents: preview, download, delete, in a browser.
 *
 * Asked for on 2026-09-16: "documents in knowledge, add an option to delete
 * them or to preview or download them." Delete existed as a hover-only × with
 * no confirmation and no check that it had worked; preview and download did
 * not exist at all.
 *
 * Seeds a real PDF and a pasted entry on a throwaway `zz-docs-` brand, then
 * checks each control does what it says. Deletes the account afterwards.
 *
 * Usage: BASE=http://localhost:3000 npm run documents:ui
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { launch } from "./cdp.mjs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const env = {};
for (const f of [new URL("../.env.local", import.meta.url), new URL("../.env", import.meta.url)]) {
  try { for (const l of readFileSync(f, "utf8").split("\n")) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, ""); } } catch {}
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const PW = "TestPassword!2026";
const stamp = Date.now().toString(36);
const email = `zz-docs-${stamp}@branditect-test.invalid`, brandId = `zz-docs-${stamp}`;
let fails = 0;
const ok = (m, d = "") => console.log(`PASS  ${m}${d ? " — " + d : ""}`);
const bad = (m, d = "") => { fails++; console.log(`FAIL  ${m}${d ? " — " + d : ""}`); };

// The smallest file that is really a PDF: one page, one word.
const PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
  "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n" +
  "4 0 obj<</Length 44>>stream\nBT /F1 18 Tf 20 100 Td (Sorbify) Tj ET\nendstream endobj\n" +
  "5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R>>\n", "utf8");

let user = null, page = null;
try {
  const { data, error } = await admin.auth.admin.createUser({ email, password: PW, email_confirm: true });
  if (error) throw new Error(error.message);
  user = data.user;
  await admin.from("brands").insert({ brand_id: brandId, user_id: user.id, brand_name: "ZZ Docs", onboarding_completed: true });

  const path = `${brandId}/${Date.now()}_strategy.pdf`;
  const up = await admin.storage.from("brand-documents").upload(path, PDF, { contentType: "application/pdf" });
  if (up.error) throw new Error(`upload: ${up.error.message}`);
  const seed = await admin.from("brand_documents").insert([
    { brand_id: brandId, file_name: "strategy.pdf", file_type: "pdf", category: "company-info",
      storage_path: path, pages_count: 1, status: "ready", extracted_text: "Sorbify sells absorbents." },
    { brand_id: brandId, file_name: "Pasted notes", file_type: "txt", category: "company-info",
      storage_path: "", pages_count: 0, status: "ready", extracted_text: "Pasted body text for the brain." },
  ]).select("id, file_name");
  if (seed.error) throw new Error(`seed: ${seed.error.message}`);

  page = await launch({ port: 9472, profile: `/tmp/cdp-docs-${stamp}` });
  await page.setViewport(1440, 950);
  await page.go(`${BASE}/login`); await page.waitForHydration("form");
  await page.type('input[type="email"]', email); await page.type('input[type="password"]', PW);
  await page.eval('document.querySelector("form").requestSubmit()'); await page.sleep(5000);
  await page.eval(`localStorage.setItem("branditect_welcome_dismissed","true")`);
  await page.go(`${BASE}/knowledge/documents`, 6000); await page.waitForHydration("main");
  for (let i = 0; i < 20 && !(await page.eval(`/strategy\\.pdf/.test(document.body.innerText)`)); i++) await page.sleep(500);

  const row = (name) => `[...document.querySelectorAll("div")].find(d => d.className.includes("group") && d.textContent.includes(${JSON.stringify(name)}))`;
  const buttons = await page.eval(`${row("strategy.pdf")} ? [...${row("strategy.pdf")}.querySelectorAll("button")].map(b => b.getAttribute("title")) : []`);
  const has = (re) => buttons.some((b) => re.test(b ?? ""));
  has(/preview/i) && has(/download/i) && has(/delete/i)
    ? ok("a file offers preview, download and delete", buttons.filter(Boolean).join(" | "))
    : bad("controls missing", JSON.stringify(buttons));

  const pasted = await page.eval(`${row("Pasted notes")} ? [...${row("Pasted notes")}.querySelectorAll("button")].map(b => b.getAttribute("title")) : []`);
  !pasted.some((b) => /download/i.test(b ?? "")) && pasted.some((b) => /preview/i.test(b ?? ""))
    ? ok("a pasted entry previews but cannot be downloaded", pasted.filter(Boolean).join(" | "))
    : bad("pasted entry controls", JSON.stringify(pasted));

  await page.eval(`${row("strategy.pdf")}.querySelector('button[title*="review" i], button[title*="katsele" i]').click()`);
  await page.sleep(2500);
  const preview = await page.eval(`(() => { const d = document.querySelector('[role="dialog"]'); if (!d) return null;
    const f = d.querySelector("iframe"); return { open: true, src: f ? f.getAttribute("src") : null, text: d.innerText.slice(0, 60) }; })()`);
  preview?.open && /token=|\/object\/sign\//.test(preview.src ?? "")
    ? ok("preview opens the PDF from a signed URL", (preview.src ?? "").slice(0, 60) + "…")
    : bad("preview did not open a signed PDF", JSON.stringify(preview));
  await page.eval(`document.querySelector('[role="dialog"] button[aria-label]')?.click()`);
  await page.sleep(800);

  const dl = await page.eval(`(async () => { const r = ${row("strategy.pdf")};
    const b = [...r.querySelectorAll("button")].find(x => /download|lataa/i.test(x.getAttribute("title") ?? ""));
    let href = null; const orig = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { href = this.href; };
    b.click(); await new Promise(r => setTimeout(r, 2500));
    HTMLAnchorElement.prototype.click = orig; return href; })()`);
  /\/object\/sign\/|token=/.test(dl ?? "")
    ? ok("download hands over a signed URL", (dl ?? "").slice(0, 60) + "…")
    : bad("download did not sign", String(dl));

  await page.eval(`${row("strategy.pdf")}.querySelector('button[title*="elete" i], button[title*="oista" i]').click()`);
  await page.sleep(1200);
  const dialog = await page.eval(`(() => { const d = document.querySelector('[role="dialog"]'); return d ? d.innerText.replace(/\\s+/g," ").trim().slice(0, 150) : null; })()`);
  /strategy\.pdf/.test(dialog ?? "") ? ok("delete asks first, and names the file", dialog.slice(0, 80) + "…")
                                     : bad("no confirm dialog", String(dialog));
  const before = (await admin.from("brand_documents").select("id").eq("brand_id", brandId)).data?.length ?? 0;
  await page.eval(`[...document.querySelectorAll('[role="dialog"] button')].find(b => /delete document|poista dokumentti/i.test(b.textContent)).click()`);
  await page.sleep(3000);
  const after = (await admin.from("brand_documents").select("id, file_name").eq("brand_id", brandId)).data ?? [];
  after.length === before - 1 && !after.some((d) => d.file_name === "strategy.pdf")
    ? ok("and the row is really gone", `${before} → ${after.length}`)
    : bad("the row survived the delete", `${before} → ${after.length}`);
  const gone = await admin.storage.from("brand-documents").list(brandId);
  (gone.data ?? []).length === 0 ? ok("with its file") : bad("the file was left behind", JSON.stringify(gone.data?.map(f => f.name)));

  if (process.env.SHOTS) {
    await page.go(`${BASE}/knowledge/documents`, 5000); await page.waitForHydration("main"); await page.sleep(2000);
    const png = await page.send("Page.captureScreenshot", { format: "png" });
    (await import("node:fs")).writeFileSync(`${process.env.SHOTS}/documents-row.png`, Buffer.from(png.data, "base64"));
  }

  const errs = page.errors.filter((e) => !/DevTools|Fast Refresh|Largest Contentful|gotrue-js: Lock/.test(e));
  errs.length ? bad(`${errs.length} console error(s)`, errs.slice(0, 2).join(" | ").slice(0, 300)) : ok("no console errors");
} catch (e) { bad("harness", e.stack ?? e.message); }
finally {
  page?.close();
  await admin.from("brand_documents").delete().eq("brand_id", brandId);
  await admin.from("brands").delete().eq("brand_id", brandId);
  if (user) await admin.auth.admin.deleteUser(user.id).catch(() => {});
}
console.log(fails ? `\n${fails} FAILING` : "\nall pass");
process.exit(fails ? 1 : 0);
