/**
 * The language toggle behind the login. Inbox 7b follow-up.
 *
 * "I can see the Finnish toggle on the website but not when logged in." The
 * only switch behind the login was two cards inside Settings. This checks the
 * sidebar toggle as a person uses it: it is on screen, clicking Suomi turns the
 * interface Finnish, the choice is written to brands.interface_language, it
 * survives a reload, and English puts it back.
 *
 * Runs against a `zz-lang-` account this script creates and deletes.
 *
 * Usage: BASE=http://localhost:3000 npm run language:ui
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { launch } from "./cdp.mjs";

const BASE = process.env.BASE ?? "http://localhost:3000";
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
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } });

const PW = "TestPassword!2026";
const stamp = Date.now().toString(36);
const email = `zz-lang-${stamp}@branditect-test.invalid`;
const brandId = `zz-lang-${stamp}`;

let fails = 0;
const ok  = (m, d = "") => console.log(`PASS  ${m}${d ? " — " + d : ""}`);
const bad = (m, d = "") => { fails++; console.log(`FAIL  ${m}${d ? " — " + d : ""}`); };

let user = null, page = null;
try {
  const { data, error } = await admin.auth.admin.createUser({ email, password: PW, email_confirm: true });
  if (error) throw new Error(error.message);
  user = data.user;
  const ins = await admin.from("brands").insert({
    brand_id: brandId, user_id: user.id, brand_name: "ZZ Language",
    onboarding_completed: true, interface_language: "en",
  });
  if (ins.error) throw new Error(ins.error.message);

  page = await launch({ port: 9457, profile: `/tmp/cdp-lang-${stamp}` });
  await page.go(`${BASE}/login`);
  await page.waitForHydration("form");
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', PW);
  await page.eval('document.querySelector("form").requestSubmit()');
  await page.sleep(5000);

  const waitFor = async (expr, ms = 20000) => {
    const until = Date.now() + ms;
    while (Date.now() < until) {
      if (await page.eval(`!!(${expr})`)) return true;
      await page.sleep(300);
    }
    return false;
  };
  const TOGGLE = `document.querySelector('nav [role="group"] button[aria-pressed]')?.parentElement`;
  const toggleState = () => page.eval(`(() => {
    const g = ${TOGGLE}; if (!g) return null;
    const r = g.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { onScreen: r.width > 0 && r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight && g.contains(hit),
      label: g.getAttribute("aria-label"),
      pressed: [...g.querySelectorAll("button")].find((b) => b.getAttribute("aria-pressed") === "true")?.textContent };
  })()`);
  const settingsLink = () => page.eval(`document.querySelector('nav a[href="/settings"]')?.textContent.trim()`);
  // The switch is disabled until the brand has loaded (see language-switch.tsx),
  // so wait for it to be clickable the way a person would.
  const click = async (name) => {
    const btn = `[...(${TOGGLE}).querySelectorAll("button")].find((b) => b.textContent === ${JSON.stringify(name)})`;
    if (!(await waitFor(`${btn} && !${btn}.disabled`))) throw new Error(`${name} never became clickable`);
    await page.eval(`${btn}.click()`);
  };
  const storedBecomes = async (want, ms = 10000) => {
    const until = Date.now() + ms;
    while (Date.now() < until) { if ((await stored()) === want) return true; await page.sleep(400); }
    return false;
  };
  const stored = async () => (await admin.from("brands").select("interface_language").eq("brand_id", brandId).single()).data?.interface_language;

  // A new account opens on the Welcome modal, which covers the sidebar on
  // purpose. Dismissed the way a person's click dismisses it, so the check
  // below is about the toggle and not about the modal.
  await page.eval(`localStorage.setItem("branditect_welcome_dismissed", "true")`);

  for (const [w, h] of [[1440, 900], [1280, 720]]) {
    await page.setViewport(w, h);
    await page.go(`${BASE}/home`);
    await page.waitForHydration("main");
    await waitFor(TOGGLE);
    const s = await toggleState();
    s?.onScreen ? ok(`toggle on screen in the sidebar at ${w}×${h}`, `${s.label}: ${s.pressed} pressed`)
                : bad(`toggle not on screen at ${w}×${h}`, JSON.stringify(s));
  }

  await click("Suomi");
  (await waitFor(`document.querySelector('nav a[href="/settings"]')?.textContent.trim() === "Asetukset"`))
    ? ok("Suomi turns the interface Finnish", `sidebar reads "${await settingsLink()}"`)
    : bad("interface did not turn Finnish", `sidebar reads "${await settingsLink()}"`);
  (await storedBecomes("fi")) ? ok("brands.interface_language is fi") : bad("column not written", String(await stored()));
  // A saved choice must not also say it was only saved in this browser: that
  // note is for the case with no brand row, and showing it over a real write
  // is the "claims the wrong thing" failure the switch exists to avoid.
  const note = await page.eval(`[...(${TOGGLE}).closest("nav").querySelectorAll("p")].map((p) => p.innerText).join(" ").trim()`);
  note === "" ? ok("no local-only note over a saved choice") : bad("a note shows beside the toggle", note);

  // SHOTS=dir writes the sidebar foot for a human to look at.
  const shot = async (name) => {
    if (!process.env.SHOTS) return;
    const r = await page.eval(`(() => { const g = ${TOGGLE}.closest("nav").getBoundingClientRect(); const t = (${TOGGLE}).getBoundingClientRect(); return { x: g.left, y: Math.max(0, t.top - 260), width: g.width, height: 330 }; })()`);
    const png = await page.send("Page.captureScreenshot", { format: "png", clip: { ...r, scale: 2 } });
    (await import("node:fs")).writeFileSync(`${process.env.SHOTS}/${name}.png`, Buffer.from(png.data, "base64"));
  };
  await shot("sidebar-fi-1280");
  await page.setViewport(390, 844);
  await page.go(`${BASE}/home`);
  await page.waitForHydration("main");
  await waitFor(TOGGLE);
  await page.eval(`(${TOGGLE}).scrollIntoView({ block: "center" })`);
  await page.sleep(300);
  const narrow = await toggleState();
  narrow?.onScreen ? ok("toggle on screen with the sidebar stacked at 390×844", `${narrow.pressed} pressed`)
                   : bad("toggle not on screen at 390×844", JSON.stringify(narrow));
  await shot("sidebar-fi-390");
  await page.setViewport(1280, 720);

  await page.go(`${BASE}/knowledge/products`);
  await page.waitForHydration("main");
  await waitFor(TOGGLE);
  const after = await toggleState();
  (await settingsLink()) === "Asetukset" && after?.pressed === "Suomi" && after?.label === "Kieli"
    ? ok("Finnish survives a navigation and a fresh load", "Suomi pressed, group labelled Kieli")
    : bad("did not survive", JSON.stringify({ link: await settingsLink(), after }));

  await click("English");
  (await waitFor(`document.querySelector('nav a[href="/settings"]')?.textContent.trim() === "Settings"`))
    ? ok("English puts it back") : bad("English did not restore", await settingsLink());
  (await storedBecomes("en")) ? ok("brands.interface_language is en again") : bad("column not restored", String(await stored()));

  await page.go(`${BASE}/settings`);
  await page.waitForHydration("main");
  await waitFor(TOGGLE);
  const cards = await page.eval(`[...document.querySelectorAll("main button[aria-pressed]")].length`);
  cards >= 4 ? ok("Settings still carries both language cards", `${cards} buttons`) : bad("Settings cards missing", String(cards));

  // The LCP notice is next/image's dev-only advice about the login artwork.
  const noise = page.errors.filter((e) => !/Download the React DevTools|Fast Refresh|Largest Contentful Paint/.test(e));
  noise.length === 0 ? ok("no unexpected console errors")
                     : bad(`${noise.length} console error(s)`, noise.slice(0, 2).join(" | "));
} catch (e) {
  bad("harness", e.stack ?? e.message);
} finally {
  page?.close();
  await admin.from("brands").delete().eq("brand_id", brandId);
  if (user) await admin.auth.admin.deleteUser(user.id).catch(() => {});
}

console.log(fails ? `\n${fails} FAILING` : "\nall pass");
process.exit(fails ? 1 : 0);
