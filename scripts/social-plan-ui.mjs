/**
 * Brand ▸ Channels, end to end: five questions, then a week of posts.
 *
 * It used to ask five questions and say "the synthesis layer ships in step 2".
 * So this checks the whole chain: a brand with no strategy is sent to write
 * one first; a brand with a strategy gets five questions where the channel
 * choice caps at two and the pillars and the people are suggested from the
 * strategy rather than asked for blank; and finishing writes a real week.
 *
 * Costs one model call per run (the week).
 *
 * Needs supabase/social-media.sql to have been run. Without it the page says
 * so, and this harness says so too rather than reporting a broken feature.
 *
 * Usage: BASE=http://localhost:3000 node scripts/social-plan-ui.mjs [outdir]
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

const stamp = Date.now().toString(36), email = `zz-sp-${stamp}@branditect-test.invalid`, PW = "TestPassword!2026";
let fails = 0;
const ok = (m, d = "") => console.log(`PASS  ${m}${d ? " — " + d : ""}`);
const bad = (m, d = "") => { fails++; console.log(`FAIL  ${m}${d ? " — " + d : ""}`); };
const text = (page) => page.eval(`document.querySelector("main")?.innerText.replace(/\\s+/g," ") ?? ""`);
/** Wait for the page to actually be on the step before reading it. */
const waitFor = async (page, re, ms = 12000) => {
  for (let i = 0; i < ms / 300; i++) {
    if (re.test(await text(page))) return true;
    await page.sleep(300);
  }
  return false;
};
const clickText = (page, re) => page.eval(`(() => {
  const b = [...document.querySelectorAll("button,a")].find(x => ${re}.test(x.textContent.trim()));
  if (!b) return "not found";
  b.click(); return b.textContent.trim();
})()`);

const STRATEGY = JSON.stringify({
  core: { whoWeAre: "A Finnish maker of absorbent granules.", whatWeDo: "We make granules for garages and workshops.", promise: "No more slip claims." },
  positioning: { difference: "Made for the two liquids that cause workshop accidents.", weAre: "Workshop absorbents", forWhom: "Independent garages", unlike: "Sawdust", because: "Tested against oil and coolant", notFor: "Not for consumers." },
  voice: { description: "Plain and direct. Never sells before it explains.", doSay: ["tested, not claimed"], dontSay: ["revolutionary"] },
  audience: [
    { name: "Jari", age: 44, role: "Garage owner", detail: "Two bays, four staff.", isPrimary: true, wants: "A floor that is not slippery.", frustratedBy: "Slip claims.", caresAbout: ["safety"], channels: [{ label: "Facebook groups", stage: null }] },
    { name: "Mira", age: 36, role: "Merchant buyer", detail: "Buys for twelve branches.", isPrimary: false, wants: "Stock that sells itself.", frustratedBy: "Returns.", caresAbout: ["margin"], channels: [] },
  ],
  pillars: [{ title: "Tested", body: "Every claim has a test behind it.", proof: "Absorbs 1.2 litres per kilo", icon: "" }],
  messages: { tagline: "No more sawdust.", supporting: [] },
  boundaries: { never: [{ rule: "Claim food safety", reason: "It is not certified" }], always: ["Name the test"], wordsUsed: ["tested", "absorbs", "coolant"], wordsAvoided: ["revolutionary"], neverCompromise: [] },
  focus: { goal: "Be the default after one spill", priorities: [] },
  analysis: { themes: [], tensions: [], problemLadder: { functional: "", emotional: "", human: "" }, differentiation: [], whiteSpace: "", coreIdea: "The tested default", unresolved: [] },
});

const { data } = await admin.auth.admin.createUser({ email, password: PW, email_confirm: true });
let page;
try {
  const brandId = `zz-sp-${stamp}`;
  await admin.from("brands").insert({ brand_id: brandId, user_id: data.user.id, brand_name: "Sorbify", onboarding_completed: true });

  page = await launch({ port: 9498, profile: `/tmp/cdp-sp-${stamp}` });
  await page.setViewport(1440, 1150);
  await page.go(`${BASE}/login`); await page.waitForHydration("form");
  await page.type('input[type="email"]', email); await page.type('input[type="password"]', PW);
  await page.eval('document.querySelector("form").requestSubmit()'); await page.sleep(7000);
  await page.eval(`localStorage.setItem("branditect_welcome_dismissed","true")`);

  // ── No strategy: the page says so and sends you to write one ──
  await page.go(`${BASE}/brand/channels`, 16000); await page.waitForHydration("main"); await page.sleep(3000);
  const gate = await text(page);
  /write your brand strategy first|kirjoita ensin/i.test(gate)
    ? ok("a brand with no strategy is sent to write one")
    : bad("the questionnaire opens without a strategy", gate.slice(0, 160));
  writeFileSync(`${S}/social-gate.png`, Buffer.from((await page.send("Page.captureScreenshot", { format: "png" })).data, "base64"));

  // ── With a strategy ──
  await admin.from("brand_strategies").insert({
    brand_id: brandId, user_id: data.user.id, category: "products", answers: {}, generated_strategy: STRATEGY,
  });
  await page.go(`${BASE}/brand/channels`, 16000); await page.waitForHydration("main"); await page.sleep(3000);
  console.log("begin:", await clickText(page, "/begin|aloita|change the answers/i"));
  await page.sleep(2500);

  // Q1 — two at most
  const q1 = await text(page);
  /reddit/i.test(q1) ? ok("every channel is offered, Reddit included") : bad("the channel list is short", q1.slice(0, 200));
  await page.eval(`(() => {
    const names = ["Instagram", "LinkedIn", "TikTok"];
    for (const n of names) {
      const b = [...document.querySelectorAll("button")].find(x => x.textContent.trim() === n);
      b?.click();
    }
  })()`);
  await page.sleep(600);
  const chosen = await page.eval(`(() => [...document.querySelectorAll("button")].filter(b => b.disabled && /Instagram|LinkedIn|TikTok|Facebook|Reddit|X|Pinterest|YouTube/.test(b.textContent.trim())).length)()`);
  chosen > 0 ? ok("the third channel cannot be chosen", `${chosen} disabled once two are on`)
             : bad("the two-channel cap does not hold");

  await clickText(page, "/continue|jatka/i"); await page.sleep(1800);
  // Q2 — goal
  await clickText(page, "/^authority|^asiantunt/i"); await page.sleep(400);
  await clickText(page, "/continue|jatka/i"); await page.sleep(1800);
  // Q3 — cadence
  await clickText(page, "/two or three times|kaksi tai kolme/i"); await page.sleep(400);
  await clickText(page, "/continue|jatka/i");
  await waitFor(page, /Q4|K4/);
  await page.sleep(1500);

  // Q4 — pillars, suggested from the strategy
  const q4 = await page.eval(`JSON.stringify([...document.querySelectorAll("input")].map(i => i.value).filter(Boolean))`);
  /tested/i.test(q4)
    ? ok("the pillars are suggested from the strategy", q4.slice(0, 120))
    : bad("question four opens blank", q4.slice(0, 200));
  writeFileSync(`${S}/social-pillars.png`, Buffer.from((await page.send("Page.captureScreenshot", { format: "png" })).data, "base64"));

  // Add one of the founder's own, with a subject under it.
  // Type first, then click: the button is disabled until React has the value,
  // and a click in the same tick lands on a disabled button and does nothing.
  await page.eval(`(() => {
    const boxes = [...document.querySelectorAll('input[placeholder]')];
    const name = boxes.filter(i => /two or three words|kahdella/i.test(i.placeholder)).pop();
    if (!name) return "no field";
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(name, "Workshop floor mistakes");
    name.dispatchEvent(new Event("input", { bubbles: true }));
    return "typed";
  })()`);
  await page.sleep(700);
  await page.eval(`(() => {
    const add = [...document.querySelectorAll("button")].find(b => /add a pillar|lisää teema/i.test(b.textContent) && !b.disabled);
    add?.click();
  })()`);
  await page.sleep(900);
  // A pillar renders as the value of an input, which innerText does not show.
  const added = await page.eval(`JSON.stringify([...document.querySelectorAll("input")].map(i => i.value).filter(Boolean))`);
  /workshop floor mistakes/i.test(added)
    ? ok("a founder can add their own pillar")
    : bad("adding a pillar did nothing", added.slice(0, 200));

  await clickText(page, "/continue|jatka/i");
  await waitFor(page, /Q5|K5/);
  await page.sleep(1200);

  // Q5 — the people, from the strategy
  const q5 = await page.eval(`JSON.stringify([...document.querySelectorAll("input")].map(i => i.value).filter(Boolean))`);
  /jari/i.test(q5)
    ? ok("the people come from the strategy's audience", q5.slice(0, 120))
    : bad("question five opens blank", q5.slice(0, 200));

  // Finish: this writes the week.
  console.log("generate:", await clickText(page, "/generate strategy|luo strategia|kirjoita/i"));
  let plan = null;
  for (let i = 0; i < 90; i++) {
    await page.sleep(1000);
    const row = (await admin.from("social_strategy").select("plan, status").eq("brand_id", brandId).maybeSingle()).data;
    if (row?.plan) { plan = row.plan; break; }
    const onScreen = await text(page);
    if (/social-media\.sql/i.test(onScreen)) {
      bad("the migration has not been run", "run supabase/social-media.sql in the Supabase SQL editor");
      break;
    }
  }
  if (plan) {
    ok("a real week was written", `${plan.week?.length ?? 0} posts, mix: ${(plan.mix ?? []).map((m) => m.pillar).join(", ")}`);
    const usesChosenChannels = (plan.week ?? []).every((p) => ["instagram", "linkedin"].includes(String(p.channel).toLowerCase()));
    usesChosenChannels ? ok("and only for the channels chosen") : bad("it posts to a channel nobody chose", JSON.stringify((plan.week ?? []).map((p) => p.channel)));
    const banned = (plan.week ?? []).filter((p) => /revolutionary/i.test(p.copy ?? ""));
    banned.length === 0 ? ok("and uses none of the brand's banned words") : bad("it used a banned word", banned[0]?.copy?.slice(0, 80));
  }
  await page.sleep(4000);
  const shown = await text(page);
  /monday|maanantai|hook|koukku/i.test(shown)
    ? ok("and the week is on the screen")
    : bad("the plan is not rendered", shown.slice(0, 200));
  writeFileSync(`${S}/social-plan.png`, Buffer.from((await page.send("Page.captureScreenshot", { format: "png" })).data, "base64"));

  // ── The metrics card ──
  const metrics = await page.eval(`(() => {
    const inputs = [...document.querySelectorAll('input[type=number]')];
    if (inputs.length < 4) return "no fields";
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    [3, 1240, 5600, 210].forEach((v, i) => { setter.call(inputs[i], String(v)); inputs[i].dispatchEvent(new Event("input", { bubbles: true })); });
    const save = [...document.querySelectorAll("button")].find(b => /save this week|tallenna tämä viikko/i.test(b.textContent));
    if (!save) return "no save button";
    save.click();
    return "saved";
  })()`);
  await page.sleep(4000);
  const week = (await admin.from("social_metrics").select("posts, followers, reach, engagements").eq("brand_id", brandId).maybeSingle()).data;
  week?.followers === 1240
    ? ok("a week of metrics can be typed in and saved", JSON.stringify(week))
    : bad("the metrics card did not save", `${metrics} → ${JSON.stringify(week)}`);
  writeFileSync(`${S}/social-metrics.png`, Buffer.from((await page.send("Page.captureScreenshot", { format: "png" })).data, "base64"));

  const errs = page.errors.filter((e) => !/DevTools|Fast Refresh|Largest Contentful|Lock|404/.test(e));
  errs.length ? bad(`${errs.length} console error(s)`, errs.slice(0, 2).join(" | ").slice(0, 200)) : ok("no console errors");
} catch (e) { bad("harness", e.stack ?? e.message); }
finally {
  page?.close();
  const b = `zz-sp-${stamp}`;
  for (const table of ["social_metrics", "social_strategy", "brand_strategies", "brands"]) {
    await admin.from(table).delete().eq("brand_id", b);
  }
  await admin.auth.admin.deleteUser(data.user.id).catch(() => {});
  console.log(fails ? `\n${fails} FAILING` : "\nall pass");
}
