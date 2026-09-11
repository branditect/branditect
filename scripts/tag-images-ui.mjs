/**
 * Inbox entry 6a, driven the way the entry was written: a real browser.
 *
 * The complaint was that the product card names tagging and offers no way to
 * do it, so the assertion has to be that the way in exists AND that pressing
 * it changes the database. Source alone cannot show the second.
 *
 * Everything runs against a `zz-tag-` brand with its own product and its own
 * uploaded images. **No real product or image is touched** — CLAUDE.md is
 * explicit about that, and the scratch product it names is not in the
 * database any more.
 *
 * Usage: npm run tag:ui   (needs a dev server on :3000)
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
const email = `zz-tag-${stamp}@branditect-test.invalid`;
const brandId = `zz-tag-${stamp}`;

let fails = 0;
const ok  = (m, d = "") => console.log(`PASS  ${m}${d ? " — " + d : ""}`);
const bad = (m, d = "") => { fails++; console.log(`FAIL  ${m}${d ? " — " + d : ""}`); };

/** A 1x1 PNG, so the tiles have something real to render. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64");

let user = null, page = null, productId = null;
try {
  const { data, error } = await admin.auth.admin.createUser({ email, password: PW, email_confirm: true });
  if (error) throw new Error(error.message);
  user = data.user;
  await admin.from("brands").insert({
    brand_id: brandId, user_id: user.id, brand_name: "ZZ Tagging", onboarding_completed: true });

  const { data: product } = await admin.from("catalog_products").insert({
    brand_id: brandId, name: "ZZ Tag Product", type: "physical", price_rrp: 10,
  }).select().single();
  productId = product.id;

  // Three images in the brand's library, tagged to nothing.
  const imageIds = [];
  for (const n of [1, 2, 3]) {
    const path = `${brandId}/zz-${n}.png`;
    await admin.storage.from("brand-images").upload(path, PNG, { contentType: "image/png", upsert: true });
    const { data: pub } = admin.storage.from("brand-images").getPublicUrl(path);
    const { data: row, error: e } = await admin.from("brand_images").insert({
      brand_id: brandId, file_url: pub.publicUrl, file_name: `zz-${n}.png`,
      category: "product", file_size: PNG.length, format: "square",
    }).select().single();
    if (e) throw new Error(`seed image ${n}: ${e.message}`);
    imageIds.push(row.id);
  }
  ok("seeded a product and three untagged library images");

  page = await launch({ port: 9457, profile: `/tmp/cdp-tag-${stamp}` });
  await page.go(`${BASE}/login`);
  await page.waitForHydration("form");
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', PW);
  await page.eval('document.querySelector("form").requestSubmit()');
  await page.sleep(5000);

  const waitFor = async (expr, ms = 25000) => {
    const until = Date.now() + ms;
    while (Date.now() < until) {
      if (await page.eval(`!!(${expr})`)) return true;
      await page.sleep(300);
    }
    return false;
  };
  const clickText = (text, root = "document") => page.eval(`(() => {
    const b = [...${root}.querySelectorAll("button, a")].find((x) => x.textContent.trim() === ${JSON.stringify(text)});
    if (!b) return false; b.click(); return true;
  })()`);

  await page.go(`${BASE}/knowledge/products`);
  await page.waitForHydration("main");
  await waitFor(`[...document.querySelectorAll("*")].some((e) => e.textContent.trim() === "ZZ Tag Product")`);

  // Open the product card, then its Media tab.
  await page.eval(`(() => {
    const el = [...document.querySelectorAll("button, a, tr, div[role='button']")]
      .find((x) => x.textContent.includes("ZZ Tag Product"));
    el?.click();
  })()`);
  await page.sleep(2500);
  (await clickText("Media")) || (await clickText("Images"));

  const body = () => page.eval('document.body.innerText');

  // Wait for the tab to finish loading. `images` is null until the fetch
  // resolves, and neither the empty state nor the header button renders
  // while it is — the first version asserted during that gap and reported
  // "no control on the empty state" for a tab that had not drawn one yet.
  (await waitFor(`/No images yet|Images and video[\\s\\S]{0,40}\\d/.test(document.body.innerText)
                   && !/Loading…/.test(document.body.innerText)`))
    ? ok("the Media tab finished loading")
    : bad("the Media tab never loaded", (await body()).slice(0, 200));

  // ── the complaint itself ─────────────────────────────────────────────
  const empty = await body();
  /No images yet/.test(empty)
    ? ok("the Media tab shows the empty state")
    : bad("no empty state to fix", empty.slice(0, 200));
  !/tag existing ones from Knowledge/i.test(empty)
    ? ok("6a · the old dead-end sentence is gone")
    : bad("6a · the empty state still points at Knowledge with no link");

  const hasButton = await page.eval(`[...document.querySelectorAll("button")].some((b) => b.textContent.trim() === "Tag images")`);
  hasButton ? ok("6a · and offers a Tag images control") : bad("6a · no control on the empty state");

  // ── it opens the chooser, and the chooser tags ───────────────────────
  await clickText("Tag images");
  await waitFor(`document.querySelector('[role="dialog"][aria-label="Tag images to this product"]')`)
    ? ok("6a · the chooser opens, in its tagging mode")
    : bad("6a · the chooser did not open");

  // Scoped to the dialog. The page behind it has its own "Tag images"
  // button — the one that opened this — and an unscoped query found that,
  // reported the confirm as enabled with nothing picked, and read its label
  // as the confirm's. The modal is the only place this button is.
  // The product drawer is also role="dialog", and its tab strip has
  // aria-pressed buttons. An unscoped query clicked those instead of the
  // tiles and read the drawer's own control as the confirm. Everything
  // inside the picker is addressed through its aria-label.
  const PICKER = `document.querySelector('[aria-label="Tag images to this product"]')`;
  const CONFIRM = `[...(${PICKER}?.querySelectorAll("button") ?? [])]
    .find((x) => /^(Tag image|Tag \\d+ images|Tagging)/.test(x.textContent.trim()))`;
  const disabledFirst = await page.eval(`(() => { const b = ${CONFIRM}; return b ? b.disabled : null; })()`);
  disabledFirst === true ? ok("the confirm starts disabled with nothing picked")
                         : bad("the confirm is live before anything is picked", String(disabledFirst));

  // Pick two.
  // Wait for the grid before touching it: the picker fetches brand_images
  // when it opens, and clicking into an empty grid selects nothing.
  await waitFor(`(${PICKER}?.querySelectorAll("button[aria-pressed]").length ?? 0) >= 3`);
  // One at a time, re-querying between them.
  for (const n of [0, 1]) {
    await page.eval(`(() => {
      const tiles = [...(${PICKER}?.querySelectorAll("button[aria-pressed]") ?? [])];
      tiles[${n}]?.click();
    })()`);
    await page.sleep(500);
  }
  const label = await page.eval(`(() => { const b = ${CONFIRM}; return b ? b.textContent.trim() : null; })()`);
  label === "Tag 2 images"
    ? ok("6c · the confirm says what pressing it does", label)
    : bad("6c · confirm label", String(label));

  await page.eval(`(() => { const b = ${CONFIRM}; b?.click(); })()`);
  await page.sleep(1500);

  // Poll. The POST is a real round trip and a fixed wait reported an empty
  // table that had two rows in it a moment later.
  let links = [];
  for (const until = Date.now() + 20000; Date.now() < until; ) {
    ({ data: links = [] } = await admin.from("product_images")
      .select("image_id").eq("product_id", productId));
    if (links.length >= 2) break;
    await page.sleep(700);
  }
  links.length === 2
    ? ok("6a · two rows written to product_images", `${links.length}`)
    : bad("6a · the tag did not reach the database", JSON.stringify(links));

  // Wait for the reload, do not assume it. The tab refetches after a
  // successful tag, and asserting the instant the modal closes read the
  // empty state that was still on screen.
  (await waitFor(`!/No images yet/.test(document.body.innerText)`))
    ? ok("6a · the tab reloaded and the empty state is gone")
    : bad("6a · the grid did not refresh after tagging", (await body()).slice(-200));

  // ── the second way in, once the empty state is gone ──────────────────
  await page.eval(`(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Tag images");
    b?.click();
  })()`);
  const reopened = await waitFor(`(${PICKER}?.querySelectorAll("button[aria-pressed]").length ?? 0) >= 3`);
  reopened ? ok("6a · still reachable from the header once images exist")
           : bad("6a · no way to add a second image");

  // Already-tagged images are shown as taken rather than hidden.
  const taken = await page.eval(`(() => {
    const tiles = [...(${PICKER}?.querySelectorAll("button[aria-pressed]") ?? [])];
    return { total: tiles.length, disabled: tiles.filter((t) => t.disabled).length };
  })()`);
  taken.total === 3 && taken.disabled === links.length
    ? ok("already-tagged images are shown as tagged, not hidden", JSON.stringify(taken))
    : bad("the chooser hides or re-offers tagged images", JSON.stringify(taken));

  // ── documents: the copy must not name an action nothing can do ───────
  const docs = await body();
  /Attaching one to a product is not built yet/.test(docs)
    ? ok("6a · the documents empty state says what is true")
    : bad("6a · documents copy", docs.slice(-200));

  const noise = page.errors.filter((e) => !/favicon|React DevTools|net::ERR|Largest Contentful Paint/i.test(e));
  noise.length === 0 ? ok("no console errors") : bad(`${noise.length} console error(s)`, noise.slice(0, 2).join(" | "));
} catch (e) {
  bad("harness", e.stack ?? e.message);
} finally {
  page?.close();
  for (const t of ["product_images", "catalog_products", "brand_images", "brands"]) {
    await admin.from(t).delete().eq("brand_id", brandId);
  }
  const { data: listed } = await admin.storage.from("brand-images").list(brandId, { limit: 100 });
  if (listed?.length) await admin.storage.from("brand-images").remove(listed.map((e) => `${brandId}/${e.name}`));
  if (user) await admin.auth.admin.deleteUser(user.id).catch(() => {});
}

console.log(fails ? `\n${fails} FAILING` : "\nall pass");
process.exit(fails ? 1 : 0);
