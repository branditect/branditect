/**
 * Criteria 4, 5 and 10 of branditect-ui/spec/studio-notes.md, in a browser.
 *
 * Criterion 10 is the merge blocker: deleting an image from Knowledge must
 * leave the block and the surrounding text intact and say the image is gone.
 *
 * Needs a dev server on :3000, a seeding route, and
 *   /tmp/zz-note-email, /tmp/zz-note-seed
 */
import { launch } from "./cdp.mjs";
import { readFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const EMAIL = readFileSync("/tmp/zz-note-email", "utf8").trim();
const BRAND = JSON.parse(readFileSync("/tmp/zz-note-seed", "utf8")).brandId;
let fails = 0;
const ok  = (m, d="") => console.log(`PASS  ${m}${d ? " — " + d : ""}`);
const bad = (m, d="") => { fails++; console.log(`FAIL  ${m}${d ? " — " + d : ""}`); };
const db = async () => (await (await fetch(`${BASE}/api/zz-note?brandId=${BRAND}`)).json());

const b = await launch({ port: 9810, profile: "/tmp/cdp-ni-" + Date.now() });
const waitFor = async (sel, n = 24) => {
  for (let i = 0; i < n; i++) {
    if (await b.eval(`!!document.querySelector(${JSON.stringify(sel)})`)) return true;
    await b.sleep(250);
  }
  return false;
};

try {
  await b.go(`${BASE}/login`, 6000);
  await b.waitForHydration("form");
  await b.type('input[type=email]', EMAIL);
  await b.type('input[type=password]', "TestPassword!2026");
  let signedIn = false;
  for (let attempt = 1; attempt <= 5 && !signedIn; attempt++) {
    await b.eval(`document.querySelector('form')?.requestSubmit()`);
    for (let i = 0; i < 12; i++) {
      await b.sleep(1000);
      if (await b.eval(`location.pathname`) !== "/login") { signedIn = true; break; }
    }
  }
  if (!signedIn) throw new Error("login did not sign in after 5 submits");

  await b.go(`${BASE}/studio/notes`, 9000);
  await b.waitForHydration("main");
  if (!(await waitFor('button[aria-label="New note"]'))) throw new Error("no New note button");
  await b.eval(`document.querySelector('button[aria-label="New note"]').click()`);
  if (!(await waitFor('input[aria-label="Note title"]'))) throw new Error("editor never opened");

  // Text before, image, text after — so criterion 10 has something either side.
  await b.eval(`[...document.querySelectorAll('button')].find(x=>/Paragraph/.test(x.innerText)).click()`);
  await waitFor('textarea[aria-label="text block"]');
  await b.type('textarea[aria-label="text block"]', "Before the picture.");
  await b.sleep(1600);

  const imagesBefore = (await db()).images?.length ?? null;

  await b.eval(`[...document.querySelectorAll('button')].find(x => x.getAttribute('aria-label') === 'Insert an image').click()`);
  if (!(await waitFor('[role=dialog] button img'))) throw new Error("the picker had no images");
  await b.eval(`document.querySelector('[role=dialog] button img').closest('button').click()`);

  /**
   * Poll for the row rather than guessing at a sleep. The debounce is 900ms
   * and a PATCH takes 1300-1700ms here, so a 2500ms wait read the database a
   * moment before the save landed and reported an empty block list — a
   * harness fault that looked exactly like the insert not working.
   */
  let blocks = [];
  for (let i = 0; i < 30; i++) {
    await b.sleep(700);
    blocks = (await db()).blocks ?? [];
    if (blocks.some((x) => x.kind === "image")) break;
  }
  const imgBlock = blocks.find((x) => x.kind === "image");
  imgBlock ? ok("4 · an image inserted from the picker is a block with an image_id", imgBlock.image_id?.slice(0, 8))
           : bad("4 · an image inserted from the picker is a block with an image_id", JSON.stringify(blocks.map(x=>x.kind)));

  // CRITERION 4: it must reference a row in brand_images, not just a URL.
  const known = (await db()).images ?? [];
  known.some((i) => i.id === imgBlock?.image_id)
    ? ok("4 · and that id is a real row in Knowledge, not a note-only file")
    : bad("4 · and that id is a real row in Knowledge", String(imgBlock?.image_id));

  await b.eval(`[...document.querySelectorAll('button')].find(x=>/Paragraph/.test(x.innerText)).click()`);
  await b.sleep(900);
  const areas = await b.eval(`document.querySelectorAll('textarea[aria-label="text block"]').length`);
  if (areas < 2) throw new Error("second paragraph never appeared");
  await b.eval(`(() => { const t=[...document.querySelectorAll('textarea[aria-label="text block"]')][1];
    t.focus(); return true })()`);
  await b.send("Input.insertText", { text: "After the picture." });
  for (let i = 0; i < 30; i++) {
    await b.sleep(700);
    if (((await db()).blocks ?? []).some((x) => (x.body ?? "").includes("After the picture"))) break;
  }

  /* ── CRITERION 5 ── */
  const fullFloat = await b.eval(`(() => { const f=document.querySelector('[data-image-block]');
    return f ? getComputedStyle(f).float : null })()`);
  fullFloat === "none" ? ok("5 · a full-width image does not float", fullFloat)
                       : bad("5 · a full-width image does not float", String(fullFloat));

  await b.eval(`document.querySelector('[data-image-block] button').click()`);
  await b.sleep(1200);
  const half = JSON.parse(await b.eval(`JSON.stringify((() => {
    const f = document.querySelector('[data-image-block]');
    const cs = getComputedStyle(f);
    return { float: cs.float, width: f.getBoundingClientRect().width,
             parent: f.parentElement.getBoundingClientRect().width,
             attr: f.getAttribute('data-width') };
  })())`));
  half.float === "left" ? ok("5 · half width floats left", `${half.attr}, float ${half.float}`)
                        : bad("5 · half width floats left", JSON.stringify(half));
  half.width < half.parent * 0.6
    ? ok("5 · and leaves room for text beside it", `${Math.round(half.width)}px of ${Math.round(half.parent)}px`)
    : bad("5 · and leaves room for text beside it", `${Math.round(half.width)}px of ${Math.round(half.parent)}px`);

  // Let the width change land before anything is deleted.
  for (let i = 0; i < 20; i++) {
    await b.sleep(700);
    if (((await db()).blocks ?? []).some((x) => x.kind === "image")) break;
  }

  /* ── CRITERION 10, THE MERGE BLOCKER ── */
  const deletedId = imgBlock?.image_id;
  if (!deletedId) throw new Error("no image block to delete — criterion 10 cannot be tested");
  const del = await fetch(`${BASE}/api/zz-note?imageId=${deletedId}`, { method: "PATCH" });
  if (!del.ok) throw new Error(`could not delete the image: ${del.status}`);

  await b.go(`${BASE}/studio/notes`, 9000);
  await b.waitForHydration("main");
  await b.eval(`(() => { const c=[...document.querySelectorAll('main button')]
    .find(x => x.innerText.includes('Before the picture')); if (c) c.click(); return !!c })()`);
  await waitFor('textarea[aria-label="text block"]');
  await b.sleep(1200);

  blocks = (await db()).blocks ?? [];
  const stillThere = blocks.find((x) => x.kind === "image");
  stillThere ? ok("10 · the image block survived the delete")
             : bad("10 · the image block survived the delete", JSON.stringify(blocks.map(x=>x.kind)));
  stillThere && stillThere.image_id === null
    ? ok("10 · its image_id was nulled, not cascaded away")
    : bad("10 · its image_id was nulled", String(stillThere?.image_id));

  const texts = await b.eval(`JSON.stringify([...document.querySelectorAll('textarea[aria-label="text block"]')].map(t=>t.value))`);
  const bodies = JSON.parse(texts);
  bodies.includes("Before the picture.") && bodies.includes("After the picture.")
    ? ok("10 · the text either side is untouched", bodies.join(" | "))
    : bad("10 · the text either side is untouched", texts);

  const says = await b.eval(`document.querySelector('[data-image-missing]')?.innerText.trim() ?? null`);
  says ? ok("10 · and the note says the image is gone", JSON.stringify(says.slice(0, 60)))
       : bad("10 · and the note says the image is gone", "nothing on screen");

  // One image was deleted on purpose, so exactly one fewer. Asserting the
  // count was unchanged was wrong and failed a passing run.
  const after = (await db()).images ?? [];
  after.length === imagesBefore - 1 && !after.some((i) => i.id === deletedId)
    ? ok("exactly the deleted image left the library", `${imagesBefore} -> ${after.length}`)
    : bad("exactly the deleted image left the library", `${imagesBefore} -> ${after.length}`);
} catch (e) {
  bad("harness", e.message);
} finally { b.close(); }

console.log(fails ? `\n${fails} FAILING` : "\nall pass");
process.exit(fails ? 1 : 0);
