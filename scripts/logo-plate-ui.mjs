/**
 * A logo has to fit its plate, and be replaceable.
 *
 * "Make sure the logo (pngs and svgs) fit to the logo area you have. In
 * Sorbify brand mark, the brand mark stretches over the frame." An SVG with
 * only a viewBox has no intrinsic size, so the browser laid it out at its
 * default 300x150 and it ran past a 112px plate; max-width and max-height
 * alone did not hold it.
 *
 * So this seeds the three shapes that break it — viewBox with no width/height,
 * a 2400px-wide fixed size, and a tall narrow one — measures every logo
 * against the frame it sits in, then replaces one and deletes one.
 *
 * No model call. Usage: BASE=http://localhost:3000 node scripts/logo-plate-ui.mjs [outdir]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { launch } from "./cdp.mjs";

const BASE = process.env.BASE ?? "http://localhost:3000", S = process.argv[2] ?? "/tmp";
const SVG_DIR = process.env.LOGO_DIR ?? S;
const env = {};
for (const f of [new URL("../.env.local", import.meta.url), new URL("../.env", import.meta.url)]) {
  try { for (const l of readFileSync(f, "utf8").split("\n")) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, ""); } } catch {}
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const stamp = Date.now().toString(36), email = `zz-lg-${stamp}@branditect-test.invalid`, PW = "TestPassword!2026";
let fails = 0;
const ok = (m, d = "") => console.log(`PASS  ${m}${d ? " — " + d : ""}`);
const bad = (m, d = "") => { fails++; console.log(`FAIL  ${m}${d ? " — " + d : ""}`); };

const dataUri = (file) =>
  "data:image/svg+xml;base64," + readFileSync(`${SVG_DIR}/${file}`).toString("base64");

const { data } = await admin.auth.admin.createUser({ email, password: PW, email_confirm: true });
let page;
try {
  const brandId = `zz-lg-${stamp}`;
  await admin.from("brands").insert({ brand_id: brandId, user_id: data.user.id, brand_name: "Sorbify", onboarding_completed: true });
  await admin.from("brand_logos").insert([
    { brand_id: brandId, slot: "primary", file_url: dataUri("viewbox-only.svg"), file_name: "sorbify-mark.svg" },
    { brand_id: brandId, slot: "dark", file_url: dataUri("huge.svg"), file_name: "sorbify-reversed.svg" },
    { brand_id: brandId, slot: "icon", file_url: dataUri("tall.svg"), file_name: "sorbify-symbol.svg" },
  ]);

  page = await launch({ port: 9494, profile: `/tmp/cdp-lg-${stamp}` });
  await page.setViewport(1440, 1150);
  await page.go(`${BASE}/login`); await page.waitForHydration("form");
  await page.type('input[type="email"]', email); await page.type('input[type="password"]', PW);
  await page.eval('document.querySelector("form").requestSubmit()'); await page.sleep(7000);
  await page.eval(`localStorage.setItem("branditect_welcome_dismissed","true")`);
  await page.go(`${BASE}/brand/visual-identity`, 16000); await page.waitForHydration("main"); await page.sleep(3500);

  // Every logo, measured against the plate it is in. A pixel of tolerance for
  // sub-pixel layout; anything more is visible.
  const overflow = await page.eval(`(() => {
    return [...document.querySelectorAll('[class*="plate"] img')].map((img) => {
      const plate = img.closest('[class*="plate"]');
      const i = img.getBoundingClientRect(), p = plate.getBoundingClientRect();
      const style = getComputedStyle(plate);
      const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      return {
        cls: plate.className.slice(0, 60),
        file: (img.alt || "").slice(0, 28),
        over: +Math.max(i.width - (p.width - padX), i.height - (p.height - padY)).toFixed(1),
        w: +i.width.toFixed(1), h: +i.height.toFixed(1),
        plate: +(p.height - padY).toFixed(1),
      };
    });
  })()`);
  const spilling = overflow.filter((o) => o.over > 1);
  overflow.length === 3
    ? ok("all three logos render", overflow.map((o) => `${o.w}x${o.h}`).join(", "))
    : bad(`${overflow.length} logos on the page, expected 3`);
  spilling.length === 0
    ? ok("every logo fits inside its plate", `frame ${overflow[0]?.plate}px`)
    : bad("a logo runs past the frame", JSON.stringify(spilling));

  writeFileSync(`${S}/logo-plates.png`, Buffer.from((await page.send("Page.captureScreenshot", { format: "png" })).data, "base64"));

  // Replace the primary through its own control.
  const replaced = await page.eval(`(() => {
    const input = document.querySelector('[class*="plateActs"] input[type=file]');
    if (!input) return "no replace input";
    input.setAttribute("data-zz", "1");
    return "ready";
  })()`);
  if (replaced !== "ready") bad("no way to replace a logo", replaced);
  else {
    const doc = await page.send("DOM.getDocument", { depth: -1 });
    const found = await page.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: 'input[data-zz="1"]' });
    await page.send("DOM.setFileInputFiles", { nodeId: found.nodeId, files: [`${SVG_DIR}/tall.svg`] });
    await page.sleep(6000);
    const row = (await admin.from("brand_logos").select("file_name, slot").eq("brand_id", brandId).eq("slot", "primary").maybeSingle()).data;
    row?.file_name === "tall.svg"
      ? ok("a logo can be replaced in its slot", `primary is now ${row.file_name}`)
      : bad("replacing did not change the slot", JSON.stringify(row));
  }

  // Delete one, and check the row and the page.
  const clicked = await page.eval(`(() => {
    const b = [...document.querySelectorAll('[class*="plateActs"] button')].find(x => /^delete$|^poista$/i.test(x.textContent.trim()));
    if (!b) return "no delete button";
    b.click();
    return "clicked";
  })()`);
  await page.sleep(600);
  await page.eval(`(() => { const b=[...document.querySelectorAll("button")].find(x=>/yes, delete it|kyllä, poista/i.test(x.textContent)); b?.click(); })()`);
  await page.sleep(4000);
  const left = (await admin.from("brand_logos").select("slot").eq("brand_id", brandId)).data ?? [];
  left.length === 2
    ? ok("a logo can be deleted", `${left.length} left: ${left.map((r) => r.slot).join(", ")}`)
    : bad(`delete left ${left.length} logos`, `click: ${clicked}`);

  const errs = page.errors.filter((e) => !/DevTools|Fast Refresh|Largest Contentful|Lock|404/.test(e));
  errs.length ? bad(`${errs.length} console error(s)`, errs.slice(0, 2).join(" | ").slice(0, 200)) : ok("no console errors");
} catch (e) { bad("harness", e.stack ?? e.message); }
finally {
  page?.close();
  const b = `zz-lg-${stamp}`;
  await admin.from("brand_logos").delete().eq("brand_id", b);
  await admin.from("brands").delete().eq("brand_id", b);
  await admin.auth.admin.deleteUser(data.user.id).catch(() => {});
  console.log(fails ? `\n${fails} FAILING` : "\nall pass");
}
