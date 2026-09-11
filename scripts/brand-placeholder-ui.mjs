/**
 * Inbox 6e. "A literal placeholder string is reaching the screen before the
 * brand loads."
 *
 * This is a timing bug, so the check has to be a timing check. It polls the
 * DOM every 40ms from the moment navigation starts and records every frame
 * that contains "Your Brand". A single hit is a failure — the string was on
 * screen for about a second, which is long enough to read and long enough to
 * screenshot.
 *
 * Both surfaces the entry names: the sidebar footer, which is on every page
 * behind the login, and the Knowledge ▸ Images heading.
 *
 * Runs against a `zz-ph-` account it creates and deletes.
 *
 * Usage: npm run placeholder:ui   (needs a dev server on :3000)
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
const email = `zz-ph-${stamp}@branditect-test.invalid`;
const brandId = `zz-ph-${stamp}`;
const BRAND_NAME = "ZZ Placeholder";

let fails = 0;
const ok  = (m, d = "") => console.log(`PASS  ${m}${d ? " — " + d : ""}`);
const bad = (m, d = "") => { fails++; console.log(`FAIL  ${m}${d ? " — " + d : ""}`); };

let user = null, page = null;
try {
  const { data, error } = await admin.auth.admin.createUser({ email, password: PW, email_confirm: true });
  if (error) throw new Error(error.message);
  user = data.user;
  await admin.from("brands").insert({
    brand_id: brandId, user_id: user.id, brand_name: BRAND_NAME, onboarding_completed: true });

  page = await launch({ port: 9459, profile: `/tmp/cdp-ph-${stamp}` });
  await page.go(`${BASE}/login`);
  await page.waitForHydration("form");
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', PW);
  await page.eval('document.querySelector("form").requestSubmit()');
  await page.sleep(5000);

  /**
   * Navigate and watch every frame until the brand has resolved.
   *
   * Returns the frames that contained the placeholder, and whether the real
   * name ever arrived — without the second half, a page that simply never
   * loads passes this by rendering nothing at all.
   */
  async function watch(path) {
    await page.send("Page.navigate", { url: `${BASE}${path}` });
    const hits = [];
    let resolved = false;
    const started = Date.now();
    while (Date.now() - started < 15000) {
      const frame = await page.eval('document.body ? document.body.innerText : ""').catch(() => "");
      if (frame.includes("Your Brand")) hits.push(Math.round(Date.now() - started));
      if (frame.includes(BRAND_NAME)) { resolved = true; break; }
      await page.sleep(40);
    }
    return { hits, resolved, ms: Date.now() - started };
  }

  for (const path of ["/knowledge/images", "/home", "/knowledge/products"]) {
    const r = await watch(path);
    if (!r.resolved) { bad(`${path} never showed the real brand name`, `${r.ms}ms`); continue; }
    r.hits.length === 0
      ? ok(`6e · no placeholder on ${path}`, `resolved in ${r.ms}ms`)
      : bad(`6e · "Your Brand" was on screen at ${path}`,
            `${r.hits.length} frame(s), first at ${r.hits[0]}ms, last at ${r.hits[r.hits.length - 1]}ms`);
  }

  // And the sentence that carried it still reads as a sentence once loaded.
  await page.go(`${BASE}/knowledge/images`);
  await page.waitForHydration("main");
  await page.sleep(2500);
  const heading = await page.eval(`(() => {
    const p = [...document.querySelectorAll("p")].find((x) => /brand assets in one place/.test(x.textContent));
    return p ? p.textContent.trim() : null;
  })()`);
  heading === `Access and manage all of ${BRAND_NAME}’s brand assets in one place.`
    ? ok("6e · and the loaded sentence names the brand", heading)
    : bad("6e · the loaded sentence", JSON.stringify(heading));

  const org = await page.eval(`(() => {
    const b = document.querySelector('button[aria-haspopup="menu"]');
    return b ? b.innerText.replace(/\\n+/g, " / ").trim() : null;
  })()`);
  org && org.includes(BRAND_NAME) && !org.includes("Your Brand")
    ? ok("6e · the sidebar footer settles on the real brand", org)
    : bad("6e · sidebar footer", JSON.stringify(org));
} catch (e) {
  bad("harness", e.stack ?? e.message);
} finally {
  page?.close();
  await admin.from("brands").delete().eq("brand_id", brandId);
  if (user) await admin.auth.admin.deleteUser(user.id).catch(() => {});
}

console.log(fails ? `\n${fails} FAILING` : "\nall pass");
process.exit(fails ? 1 : 0);
