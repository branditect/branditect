/**
 * The brand guideline, end to end: upload it, read its colours, edit one,
 * remove it.
 *
 * Nothing in the app wrote `brand_visual.guideline_url` — Home asked for a
 * brand guideline as one of the four readiness checks, the check linked to
 * Visual identity, and Visual identity had no way to take one. So this checks
 * the whole chain: the empty state offers an upload, the upload lands in the
 * column Home reads, the palette printed in the PDF arrives as swatches, a
 * swatch can be corrected, and removing it puts the page back.
 *
 * Costs one model call per run (the colour extraction).
 *
 * Usage: BASE=http://localhost:3000 node scripts/brand-guideline-ui.mjs [outdir]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { launch } from "./cdp.mjs";

const BASE = process.env.BASE ?? "http://localhost:3000", S = process.argv[2] ?? "/tmp";
const PDF = process.env.GUIDELINE_PDF;
const env = {};
for (const f of [new URL("../.env.local", import.meta.url), new URL("../.env", import.meta.url)]) {
  try { for (const l of readFileSync(f, "utf8").split("\n")) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, ""); } } catch {}
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const stamp = Date.now().toString(36), email = `zz-bg-${stamp}@branditect-test.invalid`, PW = "TestPassword!2026";
let fails = 0;
const ok = (m, d = "") => console.log(`PASS  ${m}${d ? " — " + d : ""}`);
const bad = (m, d = "") => { fails++; console.log(`FAIL  ${m}${d ? " — " + d : ""}`); };

const { data } = await admin.auth.admin.createUser({ email, password: PW, email_confirm: true });
let page;
try {
  const brandId = `zz-bg-${stamp}`;
  await admin.from("brands").insert({ brand_id: brandId, user_id: data.user.id, brand_name: "Sorbify", onboarding_completed: true });

  page = await launch({ port: 9492, profile: `/tmp/cdp-bg-${stamp}` });
  await page.setViewport(1440, 1150);
  await page.go(`${BASE}/login`); await page.waitForHydration("form");
  await page.type('input[type="email"]', email); await page.type('input[type="password"]', PW);
  await page.eval('document.querySelector("form").requestSubmit()'); await page.sleep(7000);
  await page.eval(`localStorage.setItem("branditect_welcome_dismissed","true")`);

  await page.go(`${BASE}/brand/visual-identity`, 16000); await page.waitForHydration("main"); await page.sleep(3500);
  const empty = await page.eval(`document.querySelector("main")?.innerText.replace(/\\s+/g," ") ?? ""`);
  /no brand guideline yet|ei vielä brändiohjeistoa/i.test(empty)
    ? ok("the empty state offers an upload")
    : bad("nothing on the page asks for a guideline", empty.slice(-200));

  // Upload through the real file input.
  const node = await page.eval(`(() => { const i=[...document.querySelectorAll('input[type=file]')].find(x=>/pdf/.test(x.accept)); if(!i) return "no input"; i.setAttribute("data-zz","1"); return "ready"; })()`);
  if (node !== "ready") bad("no file input for the guideline", node);
  const doc = await page.send("DOM.getDocument", { depth: -1 });
  const found = await page.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: 'input[data-zz="1"]' });
  try {
    await page.send("DOM.setFileInputFiles", { nodeId: found.nodeId, files: [PDF] });
  } catch (e) { bad("could not hand the file to the input", e.message); }
  await page.sleep(2500);

  // The model reads the PDF: allow for it.
  let row = null;
  for (let i = 0; i < 60; i++) {
    await page.sleep(1000);
    row = (await admin.from("brand_visual").select("guideline_url").eq("brand_id", brandId).maybeSingle()).data;
    if (row?.guideline_url) break;
  }
  row?.guideline_url
    ? ok("the guideline is saved where Home reads it", row.guideline_url.slice(-46))
    : bad("brand_visual.guideline_url is still empty");

  let colours = [];
  for (let i = 0; i < 40; i++) {
    await page.sleep(1000);
    colours = (await admin.from("brand_book_colors").select("hex, name").eq("brand_id", brandId)).data ?? [];
    if (colours.length) break;
  }
  const hexes = colours.map((c) => String(c.hex).toLowerCase());
  hexes.includes("#f0562a") && hexes.includes("#15151b")
    ? ok("its colours were read out of the file", colours.map((c) => `${c.name} ${c.hex}`).join(", "))
    : bad("the palette printed in the PDF did not arrive", JSON.stringify(colours));

  await page.sleep(4000);
  const shown = await page.eval(`document.querySelector("main")?.innerText.replace(/\\s+/g," ") ?? ""`);
  /#F0562A/i.test(shown) ? ok("and the swatches are on the page") : bad("the page does not show them", shown.slice(0, 200));
  writeFileSync(`${S}/guideline-uploaded.png`, Buffer.from((await page.send("Page.captureScreenshot", { format: "png" })).data, "base64"));

  // Editing a colour: open the pencil on the first swatch, change the name.
  const opened = await page.eval(`(() => { const b=document.querySelector('[class*="swatchEdit"] button'); if(!b) return "no pencil"; b.click(); return "open"; })()`);
  await page.sleep(700);
  if (opened !== "open") bad("a swatch cannot be edited", opened);
  const target = colours[0];
  const named = await page.eval(`(() => {
    // The first element whose class contains "panel" is not necessarily the
    // open editor — the page has panels of its own.
    const panel = [...document.querySelectorAll('[class*="panel"]')]
      .find((p) => p.querySelectorAll("input").length >= 2);
    const inputs = panel ? [...panel.querySelectorAll("input")] : [];
    if (inputs.length < 2) return "no fields";
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(inputs[1], "Renamed by the test");
    inputs[1].dispatchEvent(new Event("input", { bubbles: true }));
    const save = [...panel.querySelectorAll("button")].find(b => /save this colour|tallenna tämä väri/i.test(b.textContent));
    if (!save) return "no save button";
    save.click();
    return "saved";
  })()`);
  await page.sleep(3500);
  const after = (await admin.from("brand_book_colors").select("name").eq("brand_id", brandId).eq("hex", target?.hex ?? "").maybeSingle()).data;
  after?.name === "Renamed by the test"
    ? ok("a colour can be edited in place")
    : bad("editing a colour did not save", `${named} → ${JSON.stringify(after)}`);

  // Removing the guideline.
  const removed = await page.eval(`(() => { const b=[...document.querySelectorAll("button")].find(x=>/^\\s*remove\\s*$/i.test(x.textContent.trim())); if(!b) return "no remove"; b.click(); return "clicked"; })()`);
  await page.sleep(600);
  await page.eval(`(() => { const b=[...document.querySelectorAll("button")].find(x=>/yes, remove it|kyllä, poista/i.test(x.textContent)); b?.click(); })()`);
  await page.sleep(4000);
  const cleared = (await admin.from("brand_visual").select("guideline_url").eq("brand_id", brandId).maybeSingle()).data;
  cleared && !cleared.guideline_url
    ? ok("removing it clears the column Home reads", `remove button: ${removed}`)
    : bad("the guideline is still there after removing", JSON.stringify(cleared));

  const errs = page.errors.filter((e) => !/DevTools|Fast Refresh|Largest Contentful|Lock|404/.test(e));
  errs.length ? bad(`${errs.length} console error(s)`, errs.slice(0, 2).join(" | ").slice(0, 200)) : ok("no console errors");
} catch (e) { bad("harness", e.stack ?? e.message); }
finally {
  page?.close();
  const b = `zz-bg-${stamp}`;
  await admin.from("brand_book_colors").delete().eq("brand_id", b);
  await admin.from("brand_visual").delete().eq("brand_id", b);
  await admin.from("brands").delete().eq("brand_id", b);
  await admin.auth.admin.deleteUser(data.user.id).catch(() => {});
  console.log(fails ? `\n${fails} FAILING` : "\nall pass");
}
