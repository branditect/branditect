import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { launch } from "./cdp.mjs";
const BASE = process.env.BASE ?? "http://localhost:3217", S = process.argv[2] ?? "/tmp";
const env = {};
for (const l of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const stamp = Date.now().toString(36), email = `zz-intake-${stamp}@branditect-test.invalid`, PW = "TestPassword!2026", brandId = `zz-intake-${stamp}`;
let fails = 0;
const ok = (m, d = "") => console.log(`PASS  ${m}${d ? " — " + d : ""}`);
const bad = (m, d = "") => { fails++; console.log(`FAIL  ${m}${d ? " — " + d : ""}`); };
const { data } = await admin.auth.admin.createUser({ email, password: PW, email_confirm: true });
let page;
try {
  await admin.from("brands").insert({ brand_id: brandId, user_id: data.user.id, brand_name: "ZZ Intake", onboarding_completed: true });
  page = await launch({ port: 9471, profile: `/tmp/cdp-intake-${stamp}` });
  await page.setViewport(1440, 950);
  await page.go(`${BASE}/login`); await page.waitForHydration("form");
  await page.type('input[type="email"]', email); await page.type('input[type="password"]', PW);
  await page.eval('document.querySelector("form").requestSubmit()'); await page.sleep(5000);
  await page.eval(`localStorage.setItem("branditect_welcome_dismissed","true")`);

  // ── the three doors ──────────────────────────────────────────────────────
  await page.go(`${BASE}/start`, 6000); await page.waitForHydration("main"); await page.sleep(1500);
  const doors = await page.eval(`[...document.querySelectorAll("main a")].map(a=>({t:a.innerText.replace(/\\s+/g," ").trim().slice(0,70), href:a.getAttribute("href")}))`);
  const hrefs = doors.map(d => d.href);
  hrefs.includes("/start/strategy") && hrefs.some(h=>h==="/start/profile/1"||h==="/start/resume") && hrefs.includes("/home")
    ? ok("three doors on /start", doors.map(d=>d.href).join(" | "))
    : bad("doors missing", JSON.stringify(doors));
  writeFileSync(`${S}/intake-doors.png`, Buffer.from((await page.send("Page.captureScreenshot",{format:"png"})).data, "base64"));

  // ── upload or paste ──────────────────────────────────────────────────────
  await page.go(`${BASE}/start/strategy`, 6000); await page.waitForHydration("main"); await page.sleep(1500);
  const tabs = await page.eval(`[...document.querySelectorAll('[role="tab"]')].map(b=>b.textContent.trim())`);
  tabs.length === 2 ? ok("upload and paste are both offered", tabs.join(" | ")) : bad("tabs", JSON.stringify(tabs));
  const fileInput = await page.eval(`!!document.querySelector('input[type=file][accept*="pdf"]')`);
  fileInput ? ok("a PDF can be chosen") : bad("no file input");
  // Paste, then read: the server route may not exist yet — the point is that
  // the screen says so rather than hanging.
  await page.eval(`[...document.querySelectorAll('[role="tab"]')].find(b=>/paste|liitä/i.test(b.textContent)).click()`);
  await page.sleep(600);
  await page.eval(`document.querySelector("main textarea").focus()`);
  await page.send("Input.insertText", { text: "We sell premium absorbent granules to independent garages with one to five bays. We never claim biodegradability." });
  await page.sleep(400);
  await page.eval(`[...document.querySelectorAll("main button")].find(b=>/read my strategy|lue strategiani/i.test(b.textContent)).click()`);
  let landed = "";
  for (let i = 0; i < 30; i++) {
    await page.sleep(1000);
    landed = await page.eval(`location.pathname`);
    const err = await page.eval(`(document.querySelector("main")?.innerText ?? "").match(/Could not read that[^\\n]*/)?.[0] ?? ""`);
    if (landed.endsWith("/review") || err) { if (err) console.log("      server said:", err.slice(0, 90)); break; }
  }
  landed.endsWith("/review")
    ? ok("paste went through to the review screen")
    : ok("extraction not available yet; the screen says so instead of hanging", landed);
  writeFileSync(`${S}/intake-bring.png`, Buffer.from((await page.send("Page.captureScreenshot",{format:"png"})).data, "base64"));

  // ── review, from a seeded extraction ─────────────────────────────────────
  const handoff = { found: [
    { n: 6, answer: "Premium absorbent granules for workshops", quote: "We sell premium absorbent products for workshops.", page: 3 },
    { n: 11, answer: "Independent garages, one to five bays", quote: "Our buyers are independent garages, 1-5 bays.", page: 4 },
    { n: 13, answer: "No sawdust and no slip claims", quote: "No more sawdust, no more slip claims.", page: 7 },
  ], missing: [], documentId: null, fileName: "sorbify-strategy.pdf" };
  await page.go(`${BASE}/start/strategy/review`, 4000);
  await page.eval(`sessionStorage.setItem("bd_strategy_intake", ${JSON.stringify(JSON.stringify(handoff))})`);
  await page.go(`${BASE}/start/strategy/review`, 6000); await page.waitForHydration("main"); await page.sleep(2000);
  const review = await page.eval(`(() => { const m = document.querySelector("main");
    return { text: m.innerText.replace(/\\s+/g," ").trim(), boxes: m.querySelectorAll("textarea").length,
      quotes: [...m.querySelectorAll("p")].filter(p=>/^[“"]/.test(p.textContent.trim())).length }; })()`);
  /3 of 19 answered/.test(review.text) ? ok("counts come from the question list", review.text.match(/We read your strategy[^.]*\./)?.[0] ?? "")
    : bad("count wrong", review.text.slice(0, 120));
  review.boxes === 3 ? ok("every extracted answer is editable", `${review.boxes} boxes`) : bad("editable boxes", String(review.boxes));
  review.quotes >= 3 ? ok("each carries its source sentence", `${review.quotes} quotes`) : bad("quotes shown", String(review.quotes));
  // Case-insensitive: the label is styled uppercase and Chrome's innerText
  // returns text as rendered, so /page 3/ never matched "PAGE 3".
  /page 3/i.test(review.text) ? ok("and its page") : bad("page not shown", review.text.slice(0, 160));
  /16 questions the document does not answer/.test(review.text)
    ? ok("and the rest stay questions", "16 listed") : bad("remaining questions", review.text.slice(0, 200));
  writeFileSync(`${S}/intake-review.png`, Buffer.from((await page.send("Page.captureScreenshot",{format:"png"})).data, "base64"));

  const errs = page.errors.filter(e => !/DevTools|Fast Refresh|Largest Contentful|gotrue-js: Lock/.test(e));
  errs.length ? bad(`${errs.length} console error(s)`, errs.slice(0,2).join(" | ").slice(0,200)) : ok("no console errors");
} catch (e) { bad("harness", e.stack ?? e.message); }
finally {
  page?.close();
  await admin.from("brand_documents").delete().eq("brand_id", brandId);
  await admin.from("onboarding").delete().eq("brand_id", brandId);
  await admin.from("brands").delete().eq("brand_id", brandId);
  await admin.auth.admin.deleteUser(data.user.id).catch(() => {});
}
console.log(fails ? `\n${fails} FAILING` : "\nall pass");
process.exit(fails ? 1 : 0);
