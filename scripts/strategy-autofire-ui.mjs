/**
 * The questionnaire generates itself, and shows the work while it does.
 *
 * "Fire it when the last required answer is saved instead. Do not fire it
 * twice, and do not fire it on every keystroke of the last answer." And:
 * "the client throws the streaming away and only renders once the whole
 * response has arrived."
 *
 * So this seeds a brand whose questionnaire is one answer short, opens Brand ▸
 * Strategy on that last question, types the answer, and clicks nothing. What
 * has to happen: the overlay appears on its own, its checklist names the
 * document's real sections and ticks them WHILE the model is still writing,
 * and exactly one strategy row exists at the end.
 *
 * Costs one model call per run.
 *
 * Usage: BASE=http://localhost:3000 node scripts/strategy-autofire-ui.mjs
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

const stamp = Date.now().toString(36), email = `zz-af-${stamp}@branditect-test.invalid`, PW = "TestPassword!2026";
let fails = 0;
const ok = (m, d = "") => console.log(`PASS  ${m}${d ? " — " + d : ""}`);
const bad = (m, d = "") => { fails++; console.log(`FAIL  ${m}${d ? " — " + d : ""}`); };

// The ids the page files answers under, read from the source rather than
// retyped: a renamed question would otherwise seed answers nobody reads.
const ids = [...readFileSync(new URL("../lib/strategy-questions.ts", import.meta.url), "utf8")
  .matchAll(/\{\s*id:\s*"([^"]+)"/g)].map((m) => m[1]);
if (ids.length !== 20) bad("expected 20 question ids", `got ${ids.length}`);

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

const { data } = await admin.auth.admin.createUser({ email, password: PW, email_confirm: true });
let page;
try {
  const brandId = `zz-af-${stamp}`;
  await admin.from("brands").insert({ brand_id: brandId, user_id: data.user.id, brand_name: "Sorbify", onboarding_completed: true });

  // Nineteen answered, the twentieth blank: the state the page is in one
  // keystroke before it should start on its own.
  const draft = { answers: {}, category: "products", currentIndex: 19, existingText: "", screen: "questions" };
  ids.slice(0, 19).forEach((id, i) => { draft.answers[id] = said[i]; });

  page = await launch({ port: 9482, profile: `/tmp/cdp-af-${stamp}` });
  await page.setViewport(1440, 950);
  await page.go(`${BASE}/login`); await page.waitForHydration("form");
  await page.type('input[type="email"]', email); await page.type('input[type="password"]', PW);
  await page.eval('document.querySelector("form").requestSubmit()'); await page.sleep(7000);
  await page.eval(`localStorage.setItem("branditect_welcome_dismissed","true")`);
  await page.eval(`localStorage.setItem(${JSON.stringify(`branditect:strategy-draft:${brandId}`)}, ${JSON.stringify(JSON.stringify(draft))})`);

  await page.go(`${BASE}/brand/strategy`, 9000); await page.waitForHydration("main"); await page.sleep(3000);

  const header = await page.eval(`document.querySelector("main")?.innerText.replace(/\\s+/g," ") ?? ""`);
  /Question 20 of 20|Kysymys 20 \/ 20/i.test(header) ? ok("the draft restored to the last question")
    : bad("not on question 20", header.slice(0, 200));

  // Type it a character at a time, as a person does. Nothing may fire until
  // the typing stops.
  await page.eval(`document.querySelector("textarea")?.focus()`);
  const last = said[19];
  for (const ch of last) { await page.send("Input.insertText", { text: ch }); }
  const midTyping = await page.eval(`document.body.innerText.includes(${JSON.stringify("Reading your answers")})`);
  midTyping ? bad("it fired while the last answer was still being typed") : ok("nothing fired on the keystrokes");

  // Now wait, without touching anything.
  let appeared = 0;
  for (let i = 0; i < 20; i++) {
    await page.sleep(500);
    if (await page.eval(`/Reading your answers|Writing/i.test(document.body.innerText)`)) { appeared = i * 500; break; }
  }
  appeared || (await page.eval(`/Reading your answers|Writing/i.test(document.body.innerText)`))
    ? ok("generation started on its own", `after ~${appeared + 1500}ms`)
    : bad("the last answer was saved and nothing happened");

  writeFileSync(`${S}/autofire-overlay.png`, Buffer.from((await page.send("Page.captureScreenshot", { format: "png" })).data, "base64"));

  // The checklist has to be the document's sections, and it has to move while
  // the model is still writing — that is the whole point of the stream.
  const first = await page.eval(`document.body.innerText.replace(/\\s+/g," ")`);
  /Positioning/i.test(first) && /Voice/i.test(first)
    ? ok("the checklist names the document's own sections")
    : bad("the overlay does not list the real sections", first.slice(0, 200));

  const ticks = [];
  for (let i = 0; i < 100; i++) {
    const w = await page.eval(`(document.body.innerText.match(/Writing ([^\\n…]+)…/) ?? [])[1] ?? ""`);
    if (w && ticks[ticks.length - 1] !== w) ticks.push(w);
    if (!(await page.eval(`/Reading your answers|Writing/i.test(document.body.innerText)`))) break;
    await page.sleep(1000);
  }
  ticks.length > 1 ? ok("sections tick past as they are written", ticks.slice(0, 6).join(" → "))
    : bad("the progress never moved while the model wrote", ticks.join(" → ") || "(nothing)");

  await page.sleep(5000);
  const rows = (await admin.from("brand_strategies").select("id, source, version").eq("brand_id", brandId)).data ?? [];
  rows.length === 1 ? ok("exactly one strategy was written", `source=${rows[0].source} v=${rows[0].version}`)
    : bad(`${rows.length} strategy rows`, "it fired twice, or not at all");

  const shown = await page.eval(`document.querySelector("main")?.innerText.replace(/\\s+/g," ") ?? ""`);
  /Rewrite the strategy/i.test(shown) ? ok("the manual regenerate is on the finished document")
    : bad("no way to run it again by hand", shown.slice(-200));
  writeFileSync(`${S}/autofire-document.png`, Buffer.from((await page.send("Page.captureScreenshot", { format: "png" })).data, "base64"));

  const errs = page.errors.filter((e) => !/DevTools|Fast Refresh|Largest Contentful|Lock/.test(e));
  errs.length ? bad(`${errs.length} console error(s)`, errs.slice(0, 2).join(" | ").slice(0, 200)) : ok("no console errors");
} catch (e) { bad("harness", e.stack ?? e.message); }
finally {
  page?.close();
  const b = `zz-af-${stamp}`;
  await admin.from("brand_strategies").delete().eq("brand_id", b);
  await admin.from("onboarding").delete().eq("brand_id", b);
  await admin.from("brands").delete().eq("brand_id", b);
  await admin.auth.admin.deleteUser(data.user.id).catch(() => {});
  console.log(fails ? `\n${fails} FAILING` : "\nall pass");
}
