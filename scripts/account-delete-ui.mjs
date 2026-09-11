/**
 * Queue item 4, criterion 4 — and the half a POST cannot show.
 *
 * "Signing in afterwards gives a clean signup, not a broken session or a
 * half-empty dashboard." That is a statement about a browser, so this drives
 * one: a real sign-in, the real Settings screen, the real confirmation box,
 * and the real button.
 *
 * It also checks the thing the API test cannot see — the button is disabled
 * until the typed name matches. The server checks the name again, so this is
 * a courtesy rather than the guard, but a courtesy that silently stopped
 * working would put a one-click irreversible delete on the screen.
 *
 * Everything it touches is a `zz-uidel-` account it created. It deletes that
 * account through the UI, which is the point, and cleans up whatever the
 * deletion left if the run fails.
 *
 * Usage: node scripts/account-delete-ui.mjs   (needs a dev server on :3000)
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
const email = `zz-uidel-${stamp}@branditect-test.invalid`;
const brandId = `zz-uidel-${stamp}`;
const BRAND_NAME = "ZZ UI Delete";

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
  await admin.from("notes").insert({ brand_id: brandId, title: "zz" });
  await admin.storage.from("brand-images").upload(`${brandId}/zz.txt`, new Blob(["zz"]), { upsert: true });

  page = await launch({ port: 9455, profile: `/tmp/cdp-uidel-${stamp}` });

  await page.go(`${BASE}/login`);
  await page.waitForHydration("form");
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', PW);
  await page.eval('document.querySelector("form").requestSubmit()');
  await page.sleep(5000);
  const landed = await page.url();
  landed !== "/login" ? ok("signed in", landed) : bad("could not sign in", await page.eval("document.body.innerText.slice(0,200)"));

  // Through the account menu, not by typing the URL. Settings carried a
  // "Soon" tag over a page that existed, so /settings was reachable no other
  // way — and this is where the delete button now lives.
  await page.go(`${BASE}/home`);
  await page.waitForHydration("main");
  await page.sleep(1200);
  // The welcome modal is in the way on a first visit.
  await page.eval(`(() => {
    const b = [...document.querySelectorAll("button")].find((x) => /Explore first|Don.t show this/.test(x.textContent));
    if (b) b.click();
  })()`);
  await page.sleep(600);
  // The account row is the one carrying the signed-in email.
  const opened = await page.eval(`(() => {
    const trigger = [...document.querySelectorAll("button")].find((b) => b.textContent.includes(${JSON.stringify(email.slice(0, 20))}));
    if (!trigger) return "no account row";
    trigger.click();
    return "opened";
  })()`);
  await page.sleep(500);
  const menuLink = await page.eval(`(() => {
    const a = [...document.querySelectorAll('[role="menuitem"]')].find((x) => x.textContent.trim().startsWith("Settings"));
    if (!a) return { found: false };
    const soon = /soon/i.test(a.textContent);
    a.click();
    return { found: true, tag: a.tagName, soon };
  })()`);
  menuLink.found && menuLink.tag === "A" && !menuLink.soon
    ? ok("Settings is reachable from the account menu", `${menuLink.tag}, no Soon tag`)
    : bad("Settings cannot be clicked to", `${opened} / ${JSON.stringify(menuLink)}`);
  await page.sleep(3000);

  if (await page.url() !== "/settings") await page.go(`${BASE}/settings`);
  await page.waitForHydration("main");
  await page.sleep(1500);

  const findButton = (text) => `(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === ${JSON.stringify(text)});
    return b ? { found: true, disabled: b.disabled } : { found: false };
  })()`;
  const click = (text) => `(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === ${JSON.stringify(text)});
    if (!b) return false; b.click(); return true;
  })()`;

  const opener = await page.eval(findButton("Delete account"));
  opener.found ? ok("the Settings page offers deletion") : bad("no delete button on /settings");

  await page.eval(click("Delete account"));
  await page.sleep(600);

  let state = await page.eval(findButton("Delete everything"));
  state.found && state.disabled
    ? ok("the button starts disabled, with nothing typed")
    : bad("the button is live before the name is typed", JSON.stringify(state));

  await page.type("#confirm-brand", "not the name");
  state = await page.eval(findButton("Delete everything"));
  state.disabled ? ok("still disabled on a wrong name") : bad("a wrong name arms the button");

  // Select the existing text and type over it. The first version cleared the
  // field with the native value setter and a synthetic input event, which is
  // the pattern CLAUDE.md warns about: it drove React state only sometimes,
  // so the run that mattered found "not the nameZZ UI Delete" in the box and
  // reported that the right name does not arm the button.
  await page.eval('(() => { const i = document.querySelector("#confirm-brand"); i.focus(); i.setSelectionRange(0, i.value.length); })()');
  await page.send("Input.insertText", { text: BRAND_NAME });
  await page.sleep(400);
  const typed = await page.eval('document.querySelector("#confirm-brand").value');
  if (typed !== BRAND_NAME) bad("the harness did not type what it meant to", JSON.stringify(typed));
  state = await page.eval(findButton("Delete everything"));
  !state.disabled ? ok("armed once the name matches") : bad("the right name does not arm the button");

  await page.eval(click("Delete everything"));

  // Poll rather than sleep. The route counts, deletes and re-counts 27
  // relations and walks four buckets twice, which takes tens of seconds
  // against a dev server, and a fixed wait either flakes or wastes a minute.
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    if (await page.url() === "/") break;
    if (await page.eval('!!document.querySelector("main")?.innerText.match(/Nothing was deleted|did not complete/)')) break;
    await page.sleep(1000);
  }

  const after = await page.url();
  if (after === "/") ok("signed out and sent to the landing page", after);
  else bad("ended up somewhere else", `${after} — panel said: ` +
    JSON.stringify((await page.eval('document.querySelector("main")?.innerText ?? ""')).slice(-300)));

  const { data: brandLeft } = await admin.from("brands").select("brand_id").eq("brand_id", brandId).maybeSingle();
  !brandLeft ? ok("the brand row is gone") : bad("the brand row survived the UI flow");

  const { data: gone } = await admin.auth.admin.getUserById(user.id);
  !gone?.user ? ok("the auth user is gone") : bad("the auth user survived the UI flow");

  // Criterion 4, the actual sentence: a clean signup, not a broken session.
  await page.go(`${BASE}/login`);
  await page.waitForHydration("form");
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', PW);
  await page.eval('document.querySelector("form").requestSubmit()');
  await page.sleep(5000);
  const back = await page.url();
  back === "/login" ? ok("the deleted account cannot sign in again", "stays on /login")
                    : bad("the deleted account still signs in", back);

  const noise = page.errors.filter((e) => !/favicon|React DevTools|net::ERR|Largest Contentful Paint/i.test(e));
  noise.length === 0 ? ok("no console errors on the way through")
                     : bad(`${noise.length} console error(s)`, noise.slice(0, 2).join(" | "));
} catch (e) {
  bad("harness", e.stack ?? e.message);
} finally {
  page?.close();
  // Whatever the run left behind, in case it failed midway.
  await admin.from("notes").delete().eq("brand_id", brandId);
  await admin.from("brands").delete().eq("brand_id", brandId);
  const { data: listed } = await admin.storage.from("brand-images").list(brandId, { limit: 100 });
  if (listed?.length) await admin.storage.from("brand-images").remove(listed.map((e) => `${brandId}/${e.name}`));
  if (user) await admin.auth.admin.deleteUser(user.id).catch(() => {});
}

console.log(fails ? `\n${fails} FAILING` : "\nall pass");
process.exit(fails ? 1 : 0);
