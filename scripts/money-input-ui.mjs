/**
 * Decimals, and which prices carry VAT. 2026-09-16.
 *
 * "One can add 0,2 or zero point something — now it only works for full
 * euros." The product drawer rendered each money field from the PARSED number,
 * so "0," came back as "0" and the separator was deleted under the cursor. The
 * add-product form used parseFloat, which reads "0,2" as 0.
 *
 * Types into a calculator, a product pricing line and the add-product form,
 * then reads the row back: the screen keeping "0,2" is only half the claim.
 *
 * Usage: BASE=http://localhost:3000 npm run money:ui
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { launch } from "./cdp.mjs";
const BASE = process.env.BASE ?? "http://localhost:3000", S = process.argv[2] ?? "/tmp";
const env = {};
for (const l of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, ""); }
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const stamp = Date.now().toString(36), email = `zz-dec-${stamp}@branditect-test.invalid`, PW = "TestPassword!2026";
const { data } = await admin.auth.admin.createUser({ email, password: PW, email_confirm: true });
const brandId = `zz-dec-${stamp}`;
let page;
try {
  await admin.from("brands").insert({ brand_id: brandId, user_id: data.user.id, brand_name: "ZZ Dec", onboarding_completed: true });
  await admin.from("catalog_products").insert({ brand_id: brandId, name: "Test Widget", type: "physical", is_active: true, price_rrp: 10 });
  page = await launch({ port: 9481, profile: `/tmp/cdp-dec-${stamp}` });
  await page.setViewport(1440, 950);
  await page.go(`${BASE}/login`); await page.waitForHydration("form");
  await page.type('input[type="email"]', email); await page.type('input[type="password"]', PW);
  await page.eval('document.querySelector("form").requestSubmit()'); await page.sleep(7000);
  await page.eval(`localStorage.setItem("branditect_welcome_dismissed","true")`);

  const typeInto = async (selector, text) => {
    await page.eval(`(() => { const el=document.querySelector(${JSON.stringify(selector)}); el.focus(); try { el.setSelectionRange(0, el.value.length); } catch { el.value = ""; } return true; })()`);
    for (const ch of text) { await page.send("Input.dispatchKeyEvent", { type: "keyDown", text: ch }); await page.sleep(60); }
    await page.sleep(400);
    return page.eval(`document.querySelector(${JSON.stringify(selector)}).value`);
  };

  // 1. Numbers ▸ cost calculator
  await page.go(`${BASE}/numbers/cost`, 8000); await page.waitForHydration("main"); await page.sleep(2500);
  const calcSel = `input[inputmode="decimal"]`;
  console.log("calc has fields:", await page.eval(`document.querySelectorAll('${calcSel}').length`));
  console.log("calc  '0,2' ->", JSON.stringify(await typeInto(calcSel, "0,2")));
  console.log("calc  '0.25' ->", JSON.stringify(await typeInto(calcSel, "0.25")));

  // 2. Product drawer ▸ pricing tab
  await page.go(`${BASE}/knowledge/products`, 8000); await page.waitForHydration("main"); await page.sleep(2500);
  await page.eval(`[...document.querySelectorAll("tr,button,a")].find(x=>/Test Widget/.test(x.textContent))?.click()`);
  await page.sleep(2500);
  await page.eval(`(() => { const b=[...document.querySelectorAll("button")].find(x=>/^pricing$|hinnoittelu/i.test(x.textContent.trim())); if(b) b.click(); return !!b; })()`);
  await page.sleep(1800);
  const priceSel = `input[inputmode="decimal"]`;
  const n = await page.eval(`document.querySelectorAll('${priceSel}').length`);
  console.log("drawer pricing fields:", n);
  if (n) {
    console.log("drawer '0,2' ->", JSON.stringify(await typeInto(priceSel, "0,2")));
    console.log("drawer '0.25' ->", JSON.stringify(await typeInto(priceSel, "0.25")));
  }

  // 3. Does it SAVE? Type into the retail price, save, read the row back.
  await page.go(`${BASE}/knowledge/products`, 8000); await page.waitForHydration("main"); await page.sleep(2500);
  await page.eval(`[...document.querySelectorAll("tr,button,a")].find(x=>/Test Widget/.test(x.textContent))?.click()`);
  await page.sleep(2500);
  await page.eval(`(() => { const b=[...document.querySelectorAll("button")].find(x=>/^pricing$|hinnoittelu/i.test(x.textContent.trim())); b?.click(); return !!b; })()`);
  await page.sleep(1800);
  const retailSel = `input#pl-retail`;
  const has = await page.eval(`!!document.querySelector('${retailSel}')`);
  console.log("retail field:", has ? "found" : "missing", has ? JSON.stringify(await typeInto(retailSel, "0,2")) : "");
  const saved = await page.eval(`(() => { const b=[...document.querySelectorAll("button")].find(x=>/^(save|tallenna)/i.test(x.textContent.trim()) && !x.disabled); if(!b) return "no save: " + [...document.querySelectorAll("button")].map(x=>x.textContent.trim().slice(0,16)).filter(Boolean).slice(0,12).join(" | "); b.click(); return b.textContent.trim(); })()`);
  console.log("save:", saved);
  await page.sleep(6000);
  const row = (await admin.from("catalog_products").select("price_retail, price_rrp, landed_cost").eq("brand_id", brandId).maybeSingle()).data;
  console.log("stored:", JSON.stringify(row));

  // The VAT basis has to be on the label, not in someone's head.
  await page.go(`${BASE}/knowledge/products`, 8000); await page.waitForHydration("main"); await page.sleep(2500);
  await page.eval(`[...document.querySelectorAll("tr,button,a")].find(x=>/Test Widget/.test(x.textContent))?.click()`);
  await page.sleep(2500);
  await page.eval(`(() => { const b=[...document.querySelectorAll("button")].find(x=>/^pricing$|hinnoittelu/i.test(x.textContent.trim())); b?.click(); return !!b; })()`);
  await page.sleep(1800);
  const labels = await page.eval(`[...document.querySelectorAll("label, dt")].map(l=>l.textContent.trim()).filter(x=>/price|hinta/i.test(x)).slice(0,6)`);
  console.log("price labels:", JSON.stringify(labels));
  writeFileSync(`${S}/pricing-vat.png`, Buffer.from((await page.send("Page.captureScreenshot", { format: "png" })).data, "base64"));

  // 4. And the add-product form, which used parseFloat
  await page.go(`${BASE}/knowledge/products/import`, 8000); await page.waitForHydration("main"); await page.sleep(2500);
  await page.eval(`[...document.querySelectorAll("button")].find(x=>/add product/i.test(x.textContent))?.click()`);
  await page.sleep(1500);
  await page.eval(`(() => { const m=document.querySelector(".fixed.inset-0"); [...m.querySelectorAll("button")].find(x=>/physical/i.test(x.textContent))?.click(); return true; })()`);
  await page.sleep(1500);
  await page.eval(`(() => { const i=document.querySelector(".fixed.inset-0 input"); i.focus(); return true; })()`);
  await page.send("Input.insertText", { text: "Decimal Widget" });
  const priceInputs = `.fixed.inset-0 input[inputmode="decimal"]`;
  console.log("modal decimal inputs:", await page.eval(`document.querySelectorAll('${priceInputs}').length`));
  console.log("modal '0,2' ->", JSON.stringify(await typeInto(priceInputs, "0,2")));
  await page.eval(`(() => { const m=document.querySelector(".fixed.inset-0"); [...m.querySelectorAll("button")].filter(x=>!x.disabled).find(x=>/add to catalogue|tallenna/i.test(x.textContent))?.click(); return true; })()`);
  await page.sleep(6000);
  const added = (await admin.from("catalog_products").select("name, price_rrp").eq("brand_id", brandId).eq("name", "Decimal Widget").maybeSingle()).data;
  console.log("stored from modal:", JSON.stringify(added));

} finally {
  page?.close();
  await admin.from("catalog_products").delete().eq("brand_id", brandId);
  await admin.from("brands").delete().eq("brand_id", brandId);
  await admin.auth.admin.deleteUser(data.user.id).catch(() => {});
}
