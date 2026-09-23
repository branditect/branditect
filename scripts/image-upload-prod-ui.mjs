/**
 * Saving an image to Knowledge ▸ Images, in production, as a new account.
 *
 * The user reported that a freshly confirmed account still saves nothing after
 * the brand-repair fix shipped. Everything up to now has been checked against
 * the database with the anon key; this drives the deployed site in a browser,
 * which is the only thing that exercises the real client bundle, the real
 * session handling and the real upload button.
 *
 * The account is created confirmed and with NO brand row — exactly the door
 * that was broken — so the repair in lib/useBrand.ts has to fire for the
 * upload to land.
 *
 * Käyttö: node scripts/image-upload-prod-ui.mjs
 *         BASE=http://localhost:3000 node scripts/image-upload-prod-ui.mjs
 * Kuvakaappaukset: /tmp/bt-upload-*.png
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { launch } from "./cdp.mjs";

const BASE = process.env.BASE ?? "https://www.branditect.io";

const env = {};
for (const l of readFileSync(".env.local", "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

let fails = 0;
const ok = (m, d = "") => console.log(`PASS  ${m}${d ? " — " + d : ""}`);
const bad = (m, d = "") => { fails++; console.log(`FAIL  ${m}${d ? " — " + d : ""}`); };

const stamp = Date.now().toString(36);
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const FILE = `/tmp/bt-upload-${stamp}.png`;

let page;
let userId = null;
let brandId = null;

const shot = async (name) => {
  const { data } = await page.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  writeFileSync(`/tmp/bt-upload-${name}.png`, Buffer.from(data, "base64"));
};
const text = () => page.eval("document.body.innerText");

try {
  writeFileSync(FILE, png);
  const email = `zz-prod-${stamp}@branditect-test.invalid`;
  const password = "TestPassword!2026";
  const { data: created, error: ce } = await svc.auth.admin.createUser({ email, password, email_confirm: true });
  if (ce) throw ce;
  userId = created.user.id;

  page = await launch({ port: 9655, profile: `/tmp/cdp-bt-upload-${stamp}` });
  await page.setViewport(1440, 900);
  await page.send("DOM.enable");

  /* ── Sign in ────────────────────────────────────────────────────── */

  await page.go(`${BASE}/login`, 9000);
  await page.waitForHydration("form", 20000);
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', password);
  // Not `form button`: the first one is a demo SSO tile, and clicking it
  // leaves the form filled and untouched — which reads as a hung sign-in.
  const submit = await page.eval(`(() => {
    const b = [...document.querySelectorAll('button')].find(x => /^log ?in$|kirjaudu/i.test(x.innerText.trim()));
    if (!b) return 'NO SUBMIT: ' + [...document.querySelectorAll('button')].map(x => x.innerText.trim()).slice(0, 8).join(' | ');
    b.click();
    return 'clicked: ' + b.innerText.trim();
  })()`);
  console.log('      ', submit);
  await page.sleep(12000);

  const landed = await page.url();
  landed !== "/login" ? ok("signed in", landed) : bad("still on /login", (await text()).slice(0, 200));
  await shot("after-login");

  /* ── The repair ─────────────────────────────────────────────────── */

  const { data: brands } = await svc.from("brands").select("brand_id, brand_name").eq("user_id", userId);
  brandId = brands?.[0]?.brand_id ?? null;
  brandId
    ? ok("the app created a brand for the new account", brandId)
    : bad("NO BRAND ROW — the repair did not fire");

  /* ── Upload ─────────────────────────────────────────────────────── */

  await page.go(`${BASE}/knowledge/images`, 12000);
  await page.waitForHydration("main", 20000);
  await shot("images-page");

  const shown = await page.eval(`(() => {
    const el = [...document.querySelectorAll('*')].find(e => /brand/i.test(e.getAttribute?.('data-brand') ?? ''));
    return { hasFileInput: !!document.querySelector('input[type="file"]'), body: document.body.innerText.slice(0, 300) };
  })()`);
  shown.hasFileInput ? ok("the images page offers an upload") : bad("no file input on the page", shown.body);

  // DOM.setFileInputFiles is the only way to put a real File on the input;
  // a synthetic event would not carry one and the harness would "prove" a bug
  // the product does not have (CLAUDE.md).
  const { root } = await page.send("DOM.getDocument", { depth: -1 });
  const { nodeId } = await page.send("DOM.querySelector", { nodeId: root.nodeId, selector: 'input[type="file"]' });
  await page.send("DOM.setFileInputFiles", { nodeId, files: [FILE] });
  await page.sleep(2500);
  await shot("picked");

  const pending = await text();
  /1 image|1 kuva|nothing is saved|ei ole vielä tallennettu/i.test(pending)
    ? ok("the picked file shows as pending")
    : bad("the file did not appear as pending", pending.slice(0, 300));

  const clicked = await page.eval(`(() => {
    const b = [...document.querySelectorAll('button')].find(x => /upload \\d+ image|lähetä|tallenna/i.test(x.innerText));
    if (!b) return 'NO BUTTON: ' + [...document.querySelectorAll('button')].map(x => x.innerText.trim()).filter(Boolean).slice(0, 12).join(' | ');
    b.click();
    return 'clicked: ' + b.innerText.trim();
  })()`);
  console.log('      ', clicked);
  await page.sleep(12000);
  await shot("after-upload");

  const after = await text();
  const errorShown = await page.eval(`(() => {
    const m = document.body.innerText.match(/[^\\n]*(could not|ei voitu|row-level|istunto|brändiä|session)[^\\n]*/i);
    return m ? m[0].trim() : null;
  })()`);
  if (errorShown) bad("the page reports a failure", errorShown);
  else ok("no failure message on screen");

  /* ── Did it actually land? ──────────────────────────────────────── */

  const { data: rows } = await svc.from("brand_images").select("file_name, file_url").eq("brand_id", brandId ?? "-");
  (rows ?? []).length > 0
    ? ok("the image row is in the database", rows[0].file_name)
    : bad("NOTHING WAS SAVED — no brand_images row", after.slice(0, 200));

  const { data: objs } = await svc.storage.from("brand-images").list(brandId ?? "-", { limit: 5 });
  (objs ?? []).length > 0 ? ok("the bytes are in storage", objs[0].name) : bad("no object in storage");

  const errors = page.errors.filter((e) => !/favicon|DevTools|hydrat/i.test(e));
  errors.length === 0 ? ok("no console errors") : bad("console errors", errors.slice(0, 3).join(" | "));
} catch (e) {
  bad("check crashed", e instanceof Error ? e.stack : String(e));
} finally {
  page?.close();
  if (brandId) {
    const { data: objs } = await svc.storage.from("brand-images").list(brandId, { limit: 100 });
    if (objs?.length) await svc.storage.from("brand-images").remove(objs.map((o) => `${brandId}/${o.name}`));
    await svc.from("brand_images").delete().eq("brand_id", brandId);
    await svc.from("brands").delete().eq("brand_id", brandId);
  }
  if (userId) await svc.auth.admin.deleteUser(userId).catch(() => {});
}

console.log(fails ? `\n${fails} failed.` : "\nAll good.");
process.exit(fails ? 1 : 0);
