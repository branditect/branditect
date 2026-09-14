/**
 * Every main screen, signed in, in Finnish. Batch A extraction, 2026-09-14.
 *
 * Source checks can say a file calls t(); only a browser can say the screen
 * reads Finnish. For each route this reports:
 *   - visible text that exactly equals a key's English value while the Finnish
 *     differs: a string that has a key and still renders English, i.e. a
 *     missed wire (the case Home was in);
 *   - a crash into the error boundary, and console errors (hydration).
 *
 * Strings with no key are not reported here: those are the gap file's.
 *
 * Runs against a `zz-i18n-` account it creates and deletes.
 * Usage: BASE=http://localhost:3000 npm run i18n:ui
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { launch } from "./cdp.mjs";
import { en } from "../lib/i18n/en.ts";
import { fi } from "../lib/i18n/fi.ts";

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

const ROUTES = (process.env.ROUTES ?? [
  "/home",
  "/knowledge/documents", "/knowledge/images", "/knowledge/links", "/knowledge/presentations",
  "/knowledge/products", "/knowledge/products/import",
  "/studio/write", "/studio/create-images", "/studio/notes", "/studio/brand-book",
  "/studio/brand-guideline", "/studio/brand-bases", "/chat",
  "/numbers", "/numbers/cost", "/numbers/pricing", "/numbers/offers", "/numbers/recurring",
  "/numbers/running-costs",
  "/brand/strategy", "/brand/tone-of-voice", "/brand/visual-identity", "/brand/channels",
  "/settings", "/settings/plan",
].join(",")).split(",");

// English value → key, only where Finnish actually differs (so "Pro", "Studio"
// and other same-in-both words are never reported).
const norm = (s) => s.trim().replace(/\s+/g, " ");
const englishOnly = new Map();
for (const [k, v] of Object.entries(en)) {
  if (norm(v).length < 2 || norm(v) === norm(fi[k] ?? "")) continue;
  if (/\{\w+\}/.test(v)) continue;           // needs a value; cannot match rendered text exactly
  englishOnly.set(norm(v), k);
}

const PW = "TestPassword!2026";
const stamp = Date.now().toString(36);
const email = `zz-i18n-${stamp}@branditect-test.invalid`;
const brandId = `zz-i18n-${stamp}`;

let fails = 0;
const ok  = (m, d = "") => console.log(`PASS  ${m}${d ? " — " + d : ""}`);
const bad = (m, d = "") => { fails++; console.log(`FAIL  ${m}${d ? " — " + d : ""}`); };

let user = null, page = null;
try {
  const { data, error } = await admin.auth.admin.createUser({ email, password: PW, email_confirm: true });
  if (error) throw new Error(error.message);
  user = data.user;
  const ins = await admin.from("brands").insert({
    brand_id: brandId, user_id: user.id, brand_name: "ZZ Kieli",
    onboarding_completed: true, interface_language: "fi",
  });
  if (ins.error) throw new Error(ins.error.message);

  page = await launch({ port: 9459, profile: `/tmp/cdp-i18n-${stamp}` });
  await page.setViewport(1440, 900);
  await page.go(`${BASE}/login`);
  await page.waitForHydration("form");
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', PW);
  await page.eval('document.querySelector("form").requestSubmit()');
  await page.sleep(5000);
  await page.eval(`localStorage.setItem("branditect_welcome_dismissed", "true"); document.cookie = "bd_locale=fi; path=/; max-age=31536000; samesite=lax"`);

  for (const route of ROUTES) {
    const before = page.errors.length;
    await page.go(`${BASE}${route}`, 4500);
    try { await page.waitForHydration("main", 20000); } catch { bad(`${route} never hydrated`); continue; }
    await page.sleep(2500);
    const texts = await page.eval(`(() => {
      const out = new Set();
      const walk = (el) => {
        for (const n of el.childNodes) {
          if (n.nodeType === 3) { const t = n.textContent.replace(/\\s+/g, " ").trim(); if (t) out.add(t); }
          else if (n.nodeType === 1 && !["SCRIPT", "STYLE", "TEXTAREA"].includes(n.tagName)) {
            const cs = getComputedStyle(n); if (cs.display === "none" || cs.visibility === "hidden") continue;
            for (const a of ["aria-label", "placeholder", "title", "alt"]) { const v = n.getAttribute(a); if (v) out.add(v.replace(/\\s+/g, " ").trim()); }
            walk(n);
          }
        }
        // Whole element text too, for strings split across inline tags.
        const whole = el.innerText?.replace(/\\s+/g, " ").trim(); if (whole && whole.length < 200) out.add(whole);
      };
      walk(document.body);
      return [...out];
    })()`);
    const crashed = texts.some((t) => /^(Something went wrong|Jokin meni pieleen)/.test(t)) && route !== "/error";
    const english = texts.filter((t) => englishOnly.has(t)).map((t) => `${englishOnly.get(t)} "${t}"`);
    const errs = page.errors.slice(before).filter((e) => !/Download the React DevTools|Fast Refresh|Largest Contentful Paint|gotrue-js: Lock/.test(e));
    if (crashed) bad(`${route} crashed into the error boundary`);
    english.length === 0 ? ok(`${route} shows no keyed English`)
                         : bad(`${route} still shows ${english.length} keyed string(s) in English`, english.slice(0, 12).join(" · "));
    if (errs.length) bad(`${route} console errors`, errs.slice(0, 2).join(" | ").slice(0, 300));
  }
} catch (e) {
  bad("harness", e.stack ?? e.message);
} finally {
  page?.close();
  await admin.from("brands").delete().eq("brand_id", brandId);
  if (user) await admin.auth.admin.deleteUser(user.id).catch(() => {});
}

console.log(fails ? `\n${fails} FAILING` : "\nall pass");
process.exit(fails ? 1 : 0);
