/**
 * The notes editor grows, and an answer can be copied or kept. 2026-09-16.
 *
 * Two reports from Saara: "the notes app is broken, when I write a note I can
 * only see a tiny part of it", and "on the AI chat, make sure I can copy the
 * answer and save it as a note". Both are statements about a browser: the note
 * blocks were `rows={3}` with `overflow: hidden`, so the text was saved and
 * invisible, and the old save wrote to localStorage rather than to Notes.
 *
 * Runs against a `zz-nc-` account it creates and deletes, with Finnish set.
 * It sends one real question to /api/andy, so it costs a few tokens.
 *
 * Usage: BASE=http://localhost:3000 npm run notes:ui
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { launch } from "./cdp.mjs";
const BASE = process.env.BASE ?? "http://localhost:3217";
const env = {};
for (const f of [new URL("../.env.local", import.meta.url), new URL("../.env", import.meta.url)]) {
  try { for (const l of readFileSync(f, "utf8").split("\n")) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, ""); } } catch {}
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const stamp = Date.now().toString(36), email = `zz-nc-${stamp}@branditect-test.invalid`, PW = "TestPassword!2026", brandId = `zz-nc-${stamp}`;
let fails = 0;
const ok = (m, d = "") => console.log(`PASS  ${m}${d ? " — " + d : ""}`);
const bad = (m, d = "") => { fails++; console.log(`FAIL  ${m}${d ? " — " + d : ""}`); };
let user = null, page = null;
try {
  const { data, error } = await admin.auth.admin.createUser({ email, password: PW, email_confirm: true });
  if (error) throw new Error(error.message);
  user = data.user;
  const ins = await admin.from("brands").insert({ brand_id: brandId, user_id: user.id, brand_name: "ZZ Notes", onboarding_completed: true, interface_language: "fi" });
  if (ins.error) throw new Error(ins.error.message);
  page = await launch({ port: 9461, profile: `/tmp/cdp-nc-${stamp}` });
  await page.setViewport(1440, 900);
  await page.go(`${BASE}/login`); await page.waitForHydration("form");
  await page.type('input[type="email"]', email); await page.type('input[type="password"]', PW);
  await page.eval('document.querySelector("form").requestSubmit()'); await page.sleep(5000);
  await page.eval(`localStorage.setItem("branditect_welcome_dismissed","true"); document.cookie="bd_locale=fi; path=/; max-age=31536000; samesite=lax"`);

  // ── notes editor ─────────────────────────────────────────────────────────
  await page.go(`${BASE}/studio/notes`, 5000);
  await page.waitForHydration("main");
  // The new-note control is icon-only: notes.new is its aria-label.
  const madeNote = await page.eval(`(() => { const b=document.querySelector('button[aria-label="Uusi muistiinpano"], button[aria-label="New note"]'); if(b){b.click();return "clicked";} return "not found"; })()`);
  await page.sleep(3500);
  const ta = `document.querySelector('textarea[aria-label]:not([placeholder*="Kysy"])')`;
  if (!(await page.eval(`!!${ta}`))) { bad("no note editor opened", String(madeNote)); }
  else {
    const LONG = Array.from({ length: 14 }, (_, i) => `Rivi ${i + 1}: tämä on pitkä muistiinpano jossa on tarpeeksi tekstiä useammalle riville.`).join(" ");
    await page.eval(`${ta}.focus()`);
    await page.send("Input.insertText", { text: LONG });
    await page.sleep(1200);
    const m = await page.eval(`(() => { const el = ${ta}; const r = el.getBoundingClientRect(); const pane = el.closest('[class*="right"]') ?? document.scrollingElement;
      return { h: Math.round(r.height), scrollH: el.scrollHeight, clipped: el.scrollHeight > Math.ceil(r.height) + 2, chars: el.value.length, paneScrolls: pane.scrollHeight > pane.clientHeight }; })()`);
    m.clipped ? bad("note text is clipped", JSON.stringify(m)) : ok("the note grows to fit what you type", JSON.stringify(m));

    // "It still aligns very thin on the left side." A textarea sizes itself to
    // about twenty characters, so the width is measured against the note body.
    const w = await page.eval(`(() => { const el = ${ta}; const body = el.closest('[class*="body"]');
      const e = el.getBoundingClientRect(), b = body.getBoundingClientRect();
      return { block: Math.round(e.width), body: Math.round(b.width), left: Math.round(e.left - b.left) }; })()`);
    w.block >= w.body - 2 && w.left <= 2
      ? ok("the text fills the note, left to right", `${w.block}px of ${w.body}px`)
      : bad("the text is a narrow column", JSON.stringify(w));

    // And it must still shrink beside a floated half-width image rather than
    // slide under it: a real figure is put in front of it and measured.
    const beside = await page.eval(`(() => {
      const el = ${ta}; const wrap = el.parentElement; const body = el.closest('[class*="body"]');
      const fig = document.createElement("figure");
      fig.className = [...document.querySelectorAll('[class*="imageBlock"]')].map(x=>x.className)[0] ??
        wrap.className.replace(/blockWrap\\S*/, "");
      fig.style.cssText = "float:left;width:250px;height:120px;margin:0 14px 10px 0;background:#ddd";
      body.insertBefore(fig, wrap);
      const r = el.getBoundingClientRect(), f = fig.getBoundingClientRect();
      const out = { textLeft: Math.round(r.left), textWidth: Math.round(r.width), figRight: Math.round(f.right) };
      fig.remove();
      return out;
    })()`);
    beside.textLeft >= beside.figRight - 2
      ? ok("and shrinks beside a half-width image instead of sliding under it", JSON.stringify(beside))
      : bad("the text runs under a floated image", JSON.stringify(beside));
    const png = await page.send("Page.captureScreenshot", { format: "png" });
    if (process.env.SHOTS) (await import("node:fs")).writeFileSync(`${process.env.SHOTS}/note-editor.png`, Buffer.from(png.data, "base64"));
  }

  // ── chat rail: copy + save as note ───────────────────────────────────────
  await page.send("Browser.grantPermissions", { origin: BASE, permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"] }).catch(() => {});
  await page.go(`${BASE}/home`, 5000);
  await page.waitForHydration("main");
  await page.eval(`(() => { const i = document.querySelector('aside input[placeholder]'); i.focus(); return true; })()`);
  await page.send("Input.insertText", { text: "Moi" });
  await page.eval(`document.querySelector("aside form").requestSubmit()`);
  for (let i = 0; i < 40; i++) { if (await page.eval(`document.querySelectorAll('aside button').length > 3 && !!document.querySelector('aside [class*="text-micro"]')`)) break; await page.sleep(1000); }
  await page.sleep(2000);
  const btns = await page.eval(`[...document.querySelectorAll("aside button")].map(b=>b.textContent.trim()).filter(Boolean)`);
  const hasCopy = btns.some((b) => /kopioi/i.test(b)), hasSave = btns.some((b) => /muistiinpano/i.test(b));
  hasCopy && hasSave ? ok("the answer offers copy and save as note", btns.join(" | ")) : bad("buttons missing", btns.join(" | "));
  if (hasCopy) {
    await page.eval(`[...document.querySelectorAll("aside button")].find(b=>/kopioi/i.test(b.textContent)).click()`);
    await page.sleep(800);
    const clip = await page.eval(`navigator.clipboard.readText().catch(() => "")`);
    const label = await page.eval(`[...document.querySelectorAll("aside button")].map(b=>b.textContent.trim()).find(x=>/kopioitu/i.test(x)) ?? ""`);
    clip.length > 0 || label ? ok("copy puts the answer on the clipboard", label || `${clip.slice(0, 40)}…`) : bad("copy did nothing");
  }
  if (hasSave) {
    const clicked = await page.eval(`(() => { const b=[...document.querySelectorAll("aside button")].find(b=>/tallenna muistiinpano/i.test(b.textContent)); if(!b) return "no button"; if(b.disabled) return "disabled"; b.click(); return "clicked"; })()`);
    for (let i = 0; i < 15; i++) {
      const st = await page.eval(`[...document.querySelectorAll("aside button")].map(b=>b.textContent.trim()).find(x=>/tallennettu|epäonnistui/i.test(x)) ?? ""`);
      if (st) break;
      await page.sleep(1000);
    }
    console.log("      save click:", clicked, "| labels:", await page.eval(`[...document.querySelectorAll("aside button")].map(b=>b.textContent.trim()).filter(Boolean).join(" / ")`));
    // The note the CHAT wrote, not the one the editor test made: its block
    // carries source "chat" and its title is the question.
    const { data: blocks } = await admin.from("note_blocks").select("note_id, body, source").eq("brand_id", brandId).eq("source", "chat");
    const fromChat = (blocks ?? []).filter((b) => (b.body ?? "").length > 0);
    const { data: notes } = await admin.from("notes").select("id, title, flat_text").eq("brand_id", brandId);
    const note = (notes ?? []).find((n) => fromChat.some((b) => b.note_id === n.id));
    fromChat.length && note && note.title === "Moi" && (note.flat_text ?? "").length > 0
      ? ok("the answer is saved as a real note", `title="${note.title}" chars=${note.flat_text.length} source=chat`)
      : bad("the chat did not write a note", JSON.stringify({ fromChat: fromChat.length, note }));
    const label = await page.eval(`[...document.querySelectorAll("aside button")].map(b=>b.textContent.trim()).find(x=>/tallennettu|epäonnistui/i.test(x)) ?? ""`);
    /tallennettu/i.test(label) ? ok("and the button says so", label) : bad("button state after save", label || "(none)");
  }
  const errs = page.errors.filter((e) => !/DevTools|Fast Refresh|Largest Contentful|gotrue-js: Lock/.test(e));
  errs.length ? bad(`${errs.length} console error(s)`, errs.slice(0, 2).join(" | ").slice(0, 300)) : ok("no console errors");
} catch (e) { bad("harness", e.stack ?? e.message); }
finally {
  page?.close();
  await admin.from("brands").delete().eq("brand_id", brandId);
  if (user) await admin.auth.admin.deleteUser(user.id).catch(() => {});
}
console.log(fails ? `\n${fails} FAILING` : "\nall pass");
process.exit(fails ? 1 : 0);
