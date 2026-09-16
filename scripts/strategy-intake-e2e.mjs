/**
 * Bring your own strategy, end to end, against a real model call.
 *
 * Paste a strategy, let /api/strategy-extract read it, confirm the review, and
 * check what was written: the answers it could quote, their provenance, the
 * questions it left alone, the questionnaire mirror, and the strategy screen.
 *
 * This is the check that caught brand_strategies_source_check: the column
 * already existed with its own vocabulary and "document" was refused, which
 * source-level tests could not see.
 *
 * Usage: BASE=http://localhost:3000 npm run intake:e2e
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { launch } from "./cdp.mjs";
const BASE = process.env.BASE ?? "http://localhost:3000", S = process.argv[2] ?? "/tmp";
const env = {};
for (const l of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, ""); }
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const stamp = Date.now().toString(36), email = `zz-e2e-${stamp}@branditect-test.invalid`, PW = "TestPassword!2026";
const { data } = await admin.auth.admin.createUser({ email, password: PW, email_confirm: true });
let fails = 0;
const ok = (m, d = "") => console.log(`PASS  ${m}${d ? " — " + d : ""}`);
const bad = (m, d = "") => { fails++; console.log(`FAIL  ${m}${d ? " — " + d : ""}`); };

// A short strategy that answers a FEW questions and is silent on the rest.
const STRATEGY = `Sorbify brand strategy, 2026

What we sell: absorbent granules for workshops and garages, made in Finland.

Who it is for: independent garages with one to five bays, and the people who
clean up after a spill rather than the people who buy the machinery.

What changes for them: no more sawdust on the floor and no more slip claims
after a wet spill.

We will never claim our products are food safe, because they are not tested
for it.`;
let page;
try {
  page = await launch({ port: 9479, profile: `/tmp/cdp-e2e-${stamp}` });
  await page.setViewport(1440, 950);
  await page.go(`${BASE}/login`); await page.waitForHydration("form");
  await page.type('input[type="email"]', email); await page.type('input[type="password"]', PW);
  await page.eval('document.querySelector("form").requestSubmit()'); await page.sleep(7000);
  await page.eval(`localStorage.setItem("branditect_welcome_dismissed","true")`);
  const brand = (await admin.from("brands").select("brand_id").eq("user_id", data.user.id)).data?.[0]?.brand_id;

  await page.go(`${BASE}/start/strategy`, 7000); await page.waitForHydration("main"); await page.sleep(2500);
  const pasteTab = await page.eval(`(() => { const b=[...document.querySelectorAll("button")].find(x=>/paste/i.test(x.textContent)); if(b) b.click(); return b ? b.textContent.trim() : "no paste tab"; })()`);
  await page.sleep(1200);
  await page.eval(`(() => { const ta=document.querySelector("textarea"); ta.focus(); return true; })()`);
  await page.send("Input.insertText", { text: STRATEGY });
  await page.sleep(800);
  const go = await page.eval(`(() => { const b=[...document.querySelectorAll("button")].filter(x=>!x.disabled).find(x=>/read|lue|continue|jatka/i.test(x.textContent)); if(!b) return "no read button: " + [...document.querySelectorAll("button")].map(x=>x.textContent.trim().slice(0,20)).filter(Boolean).join(" | "); b.click(); return b.textContent.trim(); })()`);
  console.log("paste tab:", pasteTab, "| read:", go);
  for (let i = 0; i < 60; i++) { if (/\/review/.test(await page.eval("location.pathname"))) break; await page.sleep(1000); }
  await page.waitForHydration("main"); await page.sleep(2500);
  const review = await page.eval(`document.querySelector("main")?.innerText.replace(/\\s+/g," ") ?? ""`);
  /answered/i.test(review) ? ok("review screen reports what it found", review.match(/We read your strategy[^.]*\./)?.[0] ?? review.slice(0, 80))
                           : bad("no review screen", review.slice(0, 160));
  const boxes = await page.eval(`document.querySelectorAll("main textarea").length`);
  boxes > 0 ? ok("extracted answers are editable", `${boxes} boxes`) : bad("no editable answers");
  writeFileSync(`${S}/intake-review.png`, Buffer.from((await page.send("Page.captureScreenshot", { format: "png" })).data, "base64"));

  await page.eval(`(() => { window.__calls=[]; const f=window.fetch; window.fetch=async(...a)=>{ const r=await f(...a); const u=String(a[0]); if(u.includes("/api/")){ let b=""; try{b=await r.clone().text();}catch{} window.__calls.push({u:u.slice(0,50),s:r.status,b:b.slice(0,220)}); } return r; }; })()`);
  const confirm = await page.eval(`(() => { const b=[...document.querySelectorAll("button")].filter(x=>!x.disabled).find(x=>/save|use these|confirm|tallenna/i.test(x.textContent)); if(!b) return "no confirm: " + [...document.querySelectorAll("button")].map(x=>x.textContent.trim().slice(0,24)).filter(Boolean).join(" | "); b.click(); return b.textContent.trim(); })()`);
  console.log("confirm:", confirm);
  await page.sleep(9000);
  console.log("api:", JSON.stringify(await page.eval(`window.__calls`)));
  console.log("after confirm, path:", await page.eval("location.pathname"));
  console.log("screen says:", await page.eval(`document.querySelector("main")?.innerText.replace(/\\s+/g," ").slice(0,200)`));
  const row = (await admin.from("brand_strategies").select("*").eq("brand_id", brand).maybeSingle()).data;
  row ? ok("a strategy row was written", `source=${row.source} v=${row.version} current=${row.is_current} answers=${Object.keys(row.answers ?? {}).length} provenance=${Object.keys(row.provenance ?? {}).length}`)
      : bad("nothing was saved");
  if (row) {
    // brand_strategies_source_check allows questionnaire | paste | pdf.
    ["paste", "pdf"].includes(row.source) ? ok("marked as read from a document", row.source)
                                          : bad("source is wrong", String(row.source));
    Object.keys(row.provenance ?? {}).length === Object.keys(row.answers ?? {}).length
      ? ok("every saved answer carries its source sentence")
      : bad("provenance does not match answers", `${Object.keys(row.provenance ?? {}).length} vs ${Object.keys(row.answers ?? {}).length}`);
    const total = 19;
    Object.keys(row.answers ?? {}).length < total
      ? ok("and the questions it did not answer stayed unanswered", `${Object.keys(row.answers ?? {}).length} of ${total}`)
      : bad("everything got filled in", JSON.stringify(Object.keys(row.answers ?? {})));
  }
  const onb = (await admin.from("onboarding").select("answers").eq("brand_id", brand).maybeSingle()).data;
  Object.keys(onb?.answers ?? {}).length > 0 ? ok("the questionnaire knows what was answered", `${Object.keys(onb.answers).length} mirrored`)
                                             : bad("onboarding was not updated");
  await page.go(`${BASE}/brand/strategy`, 8000); await page.waitForHydration("main"); await page.sleep(3000);
  const screen = await page.eval(`document.querySelector("main")?.innerText.replace(/\\s+/g," ") ?? ""`);
  console.log("strategy screen:", screen.slice(0, 240));
  writeFileSync(`${S}/intake-strategy.png`, Buffer.from((await page.send("Page.captureScreenshot", { format: "png" })).data, "base64"));
  const errs = page.errors.filter(e=>!/DevTools|Fast Refresh|Largest Contentful|Lock/.test(e));
  errs.length ? bad(`${errs.length} console error(s)`, errs.slice(0,2).join(" | ").slice(0,200)) : ok("no console errors");
} catch (e) { bad("harness", e.stack ?? e.message); }
finally {
  page?.close();
  const b = (await admin.from("brands").select("brand_id").eq("user_id", data.user.id)).data?.[0]?.brand_id;
  if (b) { await admin.from("brand_strategies").delete().eq("brand_id", b); await admin.from("onboarding").delete().eq("brand_id", b); await admin.from("brands").delete().eq("brand_id", b); }
  await admin.auth.admin.deleteUser(data.user.id).catch(() => {});
  console.log(fails ? `\n${fails} FAILING` : "\nall pass");
}
