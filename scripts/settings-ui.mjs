/**
 * branditect-ui/spec/settings.md, criteria 2, 3, 4, 5 and 6.
 *
 * Three of these are statements about a browser and cannot be asserted from
 * source. Criterion 2 in particular: "asserted by setting a name and
 * re-reading the greeting, not by checking the input" — so this types a name,
 * saves it, reloads Home and reads the greeting off the screen.
 *
 * Criterion 4 asks for a forced failure: the brand row is deleted out from
 * under the page between typing and saving, so the save hits a real error and
 * the panel has to say so. That is the case the spec calls the third silent
 * failure waiting to happen.
 *
 * Everything runs against a `zz-set-` account this script creates and deletes.
 *
 * Usage: npm run settings:ui   (needs a dev server on :3000)
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
const email = `zz-set-${stamp}@branditect-test.invalid`;
const brandId = `zz-set-${stamp}`;

let fails = 0;
const ok  = (m, d = "") => console.log(`PASS  ${m}${d ? " — " + d : ""}`);
const bad = (m, d = "") => { fails++; console.log(`FAIL  ${m}${d ? " — " + d : ""}`); };

let user = null, page = null;
try {
  const { data, error } = await admin.auth.admin.createUser({ email, password: PW, email_confirm: true });
  if (error) throw new Error(error.message);
  user = data.user;
  await admin.from("brands").insert({
    brand_id: brandId, user_id: user.id, brand_name: "ZZ Settings",
    onboarding_completed: true, website: null, industry: null,
  });

  page = await launch({ port: 9456, profile: `/tmp/cdp-set-${stamp}` });
  await page.go(`${BASE}/login`);
  await page.waitForHydration("form");
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', PW);
  await page.eval('document.querySelector("form").requestSubmit()');
  await page.sleep(5000);

  await page.go(`${BASE}/settings`);
  await page.waitForHydration("main");
  await page.sleep(2000);

  const text = () => page.eval('document.querySelector("main")?.innerText ?? ""');
  const replace = async (selector, value) => {
    await page.eval(`(() => { const i = document.querySelector(${JSON.stringify(selector)}); i.focus(); i.setSelectionRange(0, i.value.length); })()`);
    await page.send("Input.insertText", { text: value });
    await page.sleep(300);
  };
  /**
   * Save inside the section that owns a field.
   *
   * There are two Save buttons on this page, one per editable panel, and the
   * first version clicked whichever came first in the document — so every
   * Brand assertion below was reporting on the You panel's save. Scoped to
   * the <section> the field lives in.
   */
  const saveIn = (fieldLabel) => page.eval(`(() => {
    const f = document.querySelector('[aria-label="' + ${JSON.stringify(fieldLabel)} + '"]');
    const section = f?.closest("section");
    const b = [...(section?.querySelectorAll("button") ?? [])]
      .find((x) => /^(Save|Saving)/.test(x.textContent.trim()));
    if (!b) return false; b.click(); return true;
  })()`);
  const field = (label) => `input[aria-label="${label}"], select[aria-label="${label}"]`;

  /**
   * Wait for a condition instead of sleeping on one.
   *
   * useBrand does getUser() then a query, and against a dev server that runs
   * past any fixed wait often enough to matter. A two-second sleep reported
   * the brand panel as empty and disabled, which reads exactly like a broken
   * panel rather than a slow one.
   */
  const waitFor = async (expr, ms = 20000) => {
    const until = Date.now() + ms;
    while (Date.now() < until) {
      if (await page.eval(`!!(${expr})`)) return true;
      await page.sleep(300);
    }
    return false;
  };
  const brandReady = () => waitFor(`document.querySelector('input[aria-label="Brand name"]') && !document.querySelector('input[aria-label="Brand name"]').disabled`);

  // ── the four sections are there, in order ─────────────────────────────
  // Read from the section headings, not from main's text: `main` contains
  // the sidebar, whose nav items include "Brand", so a text search found
  // that one first and reported the page out of order.
  const headings = await page.eval(`[...document.querySelectorAll("section h2")].map((h) => h.textContent.trim())`);
  const eyebrow = await page.eval(`(() => {
    const h = [...document.querySelectorAll("h2")].find((x) => /coming up/i.test(x.textContent));
    return h ? h.textContent.trim() : null;
  })()`);
  JSON.stringify(headings) === JSON.stringify(["You", "Brand", "Language", "Account"]) && eyebrow
    ? ok("the four sections render in order, then the line")
    : bad("sections out of order or missing", `${JSON.stringify(headings)} / ${eyebrow}`);
  (await brandReady())
    ? ok("the brand panel loaded its own brand")
    : bad("the brand panel never enabled", JSON.stringify(await page.eval(`(() => ({
        name: document.querySelector('input[aria-label="Brand name"]')?.value,
        disabled: document.querySelector('input[aria-label="Brand name"]')?.disabled,
      }))()`)));

  // ── inbox 7a · the two hues, as rendered ──────────────────────────────
  // Not the class names — the computed colour. A Tailwind class naming a
  // token that does not exist renders nothing at all, and `text-violet` was
  // exactly that shape until 7a added the token. lib/tokens.test.ts catches
  // an undefined name; this catches a name that is defined and still does
  // not reach the screen.
  const hues = await page.eval(`(() => {
    const find = (t) => [...document.querySelectorAll("div")]
      .find((d) => d.children.length === 0 && d.textContent.trim().toUpperCase() === t);
    const you = find("FOR YOU"), them = find("FOR YOUR CUSTOMERS");
    const hero = document.querySelector("main section, main div");
    return {
      you: you ? getComputedStyle(you).color : null,
      them: them ? getComputedStyle(them).color : null,
      heroBg: hero ? getComputedStyle(hero).backgroundImage.slice(0, 90) : null,
    };
  })()`);
  hues.you === "rgb(107, 83, 172)"
    ? ok("7a · for-you renders in the violet token", hues.you)
    : bad("7a · for-you is not the violet", JSON.stringify(hues));
  hues.them === "rgb(232, 72, 31)"
    ? ok("7a · for-your-customers renders in the accent", hues.them)
    : bad("7a · for-your-customers is not the accent", JSON.stringify(hues));
  hues.you && hues.them && hues.you !== hues.them
    ? ok("7a · and the two are visibly different, which is the argument")
    : bad("7a · the contrast the screen exists to make is gone", JSON.stringify(hues));

  // ── criterion 6 · email read-only, and says why ───────────────────────
  const emailField = await page.eval(`(() => {
    const i = document.querySelector('input[aria-label="Email"]');
    return i ? { value: i.value, readOnly: i.readOnly } : null;
  })()`);
  emailField?.readOnly && emailField.value === email
    ? ok("6 · email is read-only and shows the real address")
    : bad("6 · email field", JSON.stringify(emailField));
  /Email is fixed for now/.test(await text())
    ? ok("6 · and says why") : bad("6 · no explanation beside the read-only field");

  // ── criterion 5 · the coming rows are not controls ────────────────────
  const rows = await page.eval(`(() => {
    const want = ["Plan", "Credit use", "Team", "Notifications", "Billing"];
    const out = [];
    for (const w of want) {
      const el = [...document.querySelectorAll("div")].find((d) =>
        d.children.length && d.firstElementChild?.nextElementSibling &&
        d.textContent.trim().startsWith(w) && d.className.includes("rounded-card"));
      if (!el) { out.push({ w, found: false }); continue; }
      out.push({ w, found: true, focusable: el.tabIndex >= 0 || !!el.closest("a,button"),
                 desc: el.innerText.split("\\n")[1] ?? "" });
    }
    return out;
  })()`);
  const missing = rows.filter((r) => !r.found).map((r) => r.w);
  const clickable = rows.filter((r) => r.focusable).map((r) => r.w);
  const undescribed = rows.filter((r) => r.found && !r.desc.trim()).map((r) => r.w);
  missing.length === 0 && clickable.length === 0 && undescribed.length === 0
    ? ok("5 · five coming rows, each described, none focusable or linked")
    : bad("5 · coming rows", `missing ${missing} / clickable ${clickable} / undescribed ${undescribed}`);

  // ── criterion 3 · brand fields save and survive a reload ──────────────
  await replace(field("Brand name"), "ZZ Settings Renamed");
  await replace(field("Website"), "zz-settings.example.com");
  await page.eval(`(() => { const s = document.querySelector('select[aria-label="Industry"]');
    s.value = "Food & Beverage"; s.dispatchEvent(new Event("change", { bubbles: true })); })()`);
  await page.sleep(300);
  await saveIn("Brand name");
  await page.sleep(2500);

  const { data: row } = await admin.from("brands")
    .select("brand_name, website, industry").eq("brand_id", brandId).maybeSingle();
  row?.brand_name === "ZZ Settings Renamed" && row?.website === "https://zz-settings.example.com"
    ? ok("3 · brand fields saved, and the scheme was added", JSON.stringify(row))
    : bad("3 · brand fields did not save", JSON.stringify(row));

  await page.go(`${BASE}/settings`);
  await page.waitForHydration("main");
  await brandReady();
  const reloaded = await page.eval(`(() => ({
    name: document.querySelector('input[aria-label="Brand name"]')?.value,
    site: document.querySelector('input[aria-label="Website"]')?.value,
    ind: document.querySelector('select[aria-label="Industry"]')?.value,
  }))()`);
  reloaded.name === "ZZ Settings Renamed" && reloaded.ind === "Food & Beverage"
    ? ok("3 · and they survive a reload", JSON.stringify(reloaded))
    : bad("3 · lost on reload", JSON.stringify(reloaded));

  // ── an invalid website is refused, visibly ────────────────────────────
  await replace(field("Website"), "not a website");
  await saveIn("Website");
  await page.sleep(1200);
  /does not look like a web address/.test(await text())
    ? ok("an invalid website is refused with a message")
    : bad("an invalid website saved silently");

  // ── criterion 2 · the name reaches the greeting on Home ───────────────
  await page.go(`${BASE}/settings`);
  await page.waitForHydration("main");
  await brandReady();
  await replace(field("Name"), "Aino Virtanen");
  await saveIn("Name");
  await page.sleep(2500);
  /Saved/.test(await text()) ? ok("2 · the save reported itself") : bad("2 · the save said nothing");

  await page.go(`${BASE}/home`);
  await page.waitForHydration("main");
  await page.sleep(2500);
  const greeting = await page.eval('document.querySelector("main")?.innerText.slice(0, 120) ?? ""');
  /Aino/.test(greeting)
    ? ok("2 · the greeting on Home uses the name", greeting.split("\n")[0])
    : bad("2 · the greeting did not pick up the name", JSON.stringify(greeting.slice(0, 80)));

  // ── criterion 4 · a forced failure has to be visible ──────────────────
  await page.go(`${BASE}/settings`);
  await page.waitForHydration("main");
  await brandReady();
  await replace(field("Brand name"), "ZZ Settings Broken");
  // Pulled out from under the page: RLS then refuses the update on a row the
  // caller no longer owns, which is a real failure rather than a simulated one.
  await admin.from("brands").update({ user_id: null }).eq("brand_id", brandId);
  await saveIn("Brand name");
  await page.sleep(2500);
  const after = await text();
  const said = /Nothing was saved|No brand|permission|policy|denied|violates|row-level/i.test(after);
  const lied = /Saved(?!\s*✓)/.test(after.split("Coming up")[0]) && !said;
  said && !lied
    ? ok("4 · a failed save says so")
    : bad("4 · a failed save reported nothing", JSON.stringify(after.slice(-260)));
  await admin.from("brands").update({ user_id: user.id }).eq("brand_id", brandId);

  const noise = page.errors.filter((e) => !/favicon|React DevTools|net::ERR|Largest Contentful Paint|401|403/i.test(e));
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
