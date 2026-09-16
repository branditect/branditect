/**
 * Answering the questions has to produce a strategy.
 *
 * "I just answered all strategy questions but I got no strategy. It still just
 * says start questionnaire." The answers were stored in `onboarding` and
 * nothing ever built a strategy from them, so Brand ▸ Strategy stayed empty.
 *
 * Seeds a brand whose questionnaire is answered, then checks both doors: the
 * Finish button at the end of the questions, and the button on the strategy
 * screen for answers that are already in. Costs one model call per run.
 *
 * Usage: BASE=http://localhost:3000 npm run strategy:e2e
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { launch } from "./cdp.mjs";
const BASE = process.env.BASE ?? "http://localhost:3000", S = process.argv[2] ?? "/tmp";
const env = {};
for (const f of [new URL("../.env.local", import.meta.url), new URL("../.env", import.meta.url)]) {
  try { for (const l of readFileSync(f, "utf8").split("\n")) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, ""); } } catch {}
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const stamp = Date.now().toString(36), email = `zz-sq-${stamp}@branditect-test.invalid`, PW = "TestPassword!2026";
let fails = 0;
const ok = (m, d = "") => console.log(`PASS  ${m}${d ? " — " + d : ""}`);
const bad = (m, d = "") => { fails++; console.log(`FAIL  ${m}${d ? " — " + d : ""}`); };
const { data } = await admin.auth.admin.createUser({ email, password: PW, email_confirm: true });
let page;
try {
  const brandId = `zz-sq-${stamp}`;
  await admin.from("brands").insert({ brand_id: brandId, user_id: data.user.id, brand_name: "Sorbify", onboarding_completed: true });
  // A questionnaire that is answered, the way it is after someone finishes.
  const answers = {};
  const said = [
    "Absorbent granules for workshops and garages", "Independent garages with one to five bays",
    "No more sawdust and no more slip claims", "Finnish made, tested for oil and coolant",
    "We never claim food safety", "Workshops that clean up spills daily",
    "Sold through trade distributors", "Quality over price", "Fast delivery",
    "Rakennussuojat and the big builders merchants", "Trust and competence",
    "Plain, direct, no marketing noise", "Never fluffy or salesy", "Professionals, not consumers",
    "Word of mouth in the trade", "We are the default after one spill", "Repeat orders",
    "Calm and precise", "Safety first", "Grow with the merchants",
  ];
  said.forEach((a, i) => { answers[i + 1] = a; });
  await admin.from("onboarding").insert({
    brand_id: brandId, user_id: data.user.id, answers, status: "partial", last_question: 20, furthest_question: 20,
    profile: { track: "physical", charge_model: "oneoff", team_size: "just_me" }, skipped: [],
  });

  page = await launch({ port: 9480, profile: `/tmp/cdp-sq-${stamp}` });
  await page.setViewport(1440, 950);
  await page.go(`${BASE}/login`); await page.waitForHydration("form");
  await page.type('input[type="email"]', email); await page.type('input[type="password"]', PW);
  await page.eval('document.querySelector("form").requestSubmit()'); await page.sleep(7000);
  await page.eval(`localStorage.setItem("branditect_welcome_dismissed","true")`);

  // Door one: the screen someone lands on with answers already in.
  await page.go(`${BASE}/brand/strategy`, 8000); await page.waitForHydration("main"); await page.sleep(3000);
  const empty = await page.eval(`document.querySelector("main")?.innerText.replace(/\\s+/g," ") ?? ""`);
  /answered 20|20 of the questions|Build my strategy/i.test(empty)
    ? ok("the empty state knows the questions are answered", empty.match(/You have answered[^.]*\./)?.[0] ?? "")
    : bad("it still just says start the questionnaire", empty.slice(0, 160));
  writeFileSync(`${S}/strategy-empty.png`, Buffer.from((await page.send("Page.captureScreenshot", { format: "png" })).data, "base64"));

  const clicked = await page.eval(`(() => { const b=[...document.querySelectorAll("button")].find(x=>/build my strategy|rakenna strategiani/i.test(x.textContent)); if(!b) return "no build button"; b.click(); return b.textContent.trim(); })()`);
  console.log("build:", clicked);
  for (let i = 0; i < 90; i++) {
    const row = (await admin.from("brand_strategies").select("id").eq("brand_id", brandId)).data ?? [];
    if (row.length) break;
    await page.sleep(1000);
  }
  await page.sleep(6000);
  const strat = (await admin.from("brand_strategies").select("*").eq("brand_id", brandId).maybeSingle()).data;
  strat ? ok("a strategy was built and saved", `source=${strat.source} v=${strat.version} json=${(strat.generated_strategy ?? "").length} chars`)
        : bad("still no strategy row");
  if (strat) {
    let parsed = null;
    try { parsed = JSON.parse(strat.generated_strategy); } catch {}
    parsed && Object.keys(parsed).length > 5 ? ok("and it is a real strategy document", Object.keys(parsed).slice(0, 6).join(", "))
                                             : bad("the saved strategy is not usable JSON");
  }
  await page.go(`${BASE}/brand/strategy`, 9000); await page.waitForHydration("main"); await page.sleep(4000);
  const shown = await page.eval(`document.querySelector("main")?.innerText.replace(/\\s+/g," ") ?? ""`);
  !/start the questionnaire/i.test(shown) && shown.length > 200
    ? ok("and the screen shows it", shown.slice(0, 90) + "…")
    : bad("the screen still offers the questionnaire", shown.slice(0, 160));
  writeFileSync(`${S}/strategy-built.png`, Buffer.from((await page.send("Page.captureScreenshot", { format: "png" })).data, "base64"));
  // Door two: the Finish button at the end of the questions. Clear the
  // strategy first so this builds its own.
  await admin.from("brand_strategies").delete().eq("brand_id", brandId);
  await page.go(`${BASE}/start/q/20`, 8000); await page.waitForHydration("main"); await page.sleep(2500);
  const finish = await page.eval(`(() => { const b=[...document.querySelectorAll("button")].filter(x=>!x.disabled).find(x=>/^(finish|valmis)$/i.test(x.textContent.trim())); if(!b) return "no finish button: " + [...document.querySelectorAll("button")].map(x=>x.textContent.trim().slice(0,18)).filter(Boolean).join(" | "); b.click(); return b.textContent.trim(); })()`);
  console.log("finish:", finish);
  for (let i = 0; i < 90; i++) {
    if (((await admin.from("brand_strategies").select("id").eq("brand_id", brandId)).data ?? []).length) break;
    await page.sleep(1000);
  }
  await page.sleep(3000);
  const afterFinish = (await admin.from("brand_strategies").select("id, source").eq("brand_id", brandId)).data ?? [];
  afterFinish.length ? ok("finishing the questions builds one too", `source=${afterFinish[0].source}`)
                     : bad("Finish still produced no strategy");
  const landed = await page.eval("location.pathname");
  landed === "/brand/strategy" ? ok("and lands on the strategy, not the dashboard") : bad("finished somewhere else", landed);

  const errs = page.errors.filter(e=>!/DevTools|Fast Refresh|Largest Contentful|Lock/.test(e));
  errs.length ? bad(`${errs.length} console error(s)`, errs.slice(0,2).join(" | ").slice(0,200)) : ok("no console errors");
} catch (e) { bad("harness", e.stack ?? e.message); }
finally {
  page?.close();
  const b = `zz-sq-${stamp}`;
  await admin.from("brand_strategies").delete().eq("brand_id", b);
  await admin.from("onboarding").delete().eq("brand_id", b);
  await admin.from("brands").delete().eq("brand_id", b);
  await admin.auth.admin.deleteUser(data.user.id).catch(() => {});
  console.log(fails ? `\n${fails} FAILING` : "\nall pass");
}
