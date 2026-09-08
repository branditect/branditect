/**
 * The autosave race, on its own. Committed rather than left in a scratchpad,
 * because it took a day to make it reproduce and the conditions are not
 * guessable.
 *
 * Needs: a dev server on :3000, a temporary seeding route, and
 *   /tmp/zz-note-email      an account that can sign in
 *   /tmp/zz-note-seed       {"brandId": "..."} for that account
 *
 * Run:  LATENCY=2500 ROUNDS=6 node scripts/check-notes-race.mjs
 *
 * WHAT IT TOOK TO MAKE IT FAIL, all of which is load-bearing:
 *
 *   - Edits spaced just past the debounce, not back to back. Zero-pause edits
 *     produce ONE save, because queueSave clears the timer on every edit.
 *     Eight rounds of that passed with both protections removed.
 *   - Network latency. Locally a PATCH finishes inside the gap, so the next
 *     save starts after the previous has landed and nothing overlaps.
 *   - Consecutive BLOCK edits. Each rewrites every row and recomputes
 *     flat_text, and two overlapping block writes are what leaves flat_text
 *     describing rows that are no longer there.
 *
 * With all three, and both protections removed, it fails 5 assertions in 6
 * rounds. With either the client serialisation or the server-side recompute
 * missing it is worth re-running; with both in place it is green.
 *
 * The full editor check could not produce it: its sleeps let every save settle
 * before the next edit, so two requests never overlapped, and ten rounds passed
 * with both protections deliberately removed. This does nothing but overlap
 * them — edits back to back with no pause, so a save is in flight when the
 * next one is queued.
 *
 * Assertions read the database, never the screen.
 */
import { launch } from "./cdp.mjs";
import { readFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const EMAIL = readFileSync("/tmp/zz-note-email", "utf8").trim();
const BRAND = JSON.parse(readFileSync("/tmp/zz-note-seed", "utf8")).brandId;
const ROUNDS = Number(process.env.ROUNDS ?? 8);

let fails = 0;
const ok  = (m) => console.log(`PASS  ${m}`);
const bad = (m, d="") => { fails++; console.log(`FAIL  ${m}${d ? " — " + d : ""}`); };
const db = async () => (await (await fetch(`${BASE}/api/zz-note?brandId=${BRAND}`)).json());

const b = await launch({ port: 9790, profile: "/tmp/cdp-race-" + Date.now() });

async function waitFor(sel, tries = 24) {
  for (let i = 0; i < tries; i++) {
    if (await b.eval(`!!document.querySelector(${JSON.stringify(sel)})`)) return true;
    await b.sleep(250);
  }
  return false;
}

/** Replace a field's contents. No sleep — overlapping is the point. */
async function retype(sel, text) {
  const ready = await b.eval(`(() => { const el = document.querySelector(${JSON.stringify(sel)});
    if (!el) return false; el.focus(); el.setSelectionRange(0, el.value.length); return true })()`);
  if (!ready) throw new Error(`field missing: ${sel}`);
  await b.send("Input.insertText", { text });
}

try {
  /**
   * Latency, so requests actually overlap.
   *
   * Locally a PATCH finishes in well under the gap between edits, so the next
   * save starts after the previous one has already landed and nothing ever
   * races. Adding latency is what makes two requests in flight at once
   * reachable at all — it changes the timing, not the app.
   */
  const LATENCY = Number(process.env.LATENCY ?? 1500);

  await b.go(`${BASE}/login`, 6000);
  // Fail on a page React never attached to rather than calling it a login
  // that would not sign in. See CLAUDE.md.
  await b.waitForHydration("form");
  await b.type('input[type=email]', EMAIL);
  await b.type('input[type=password]', "TestPassword!2026");
  await b.eval(`document.querySelector('form').requestSubmit()`);
  await b.sleep(8000);
  if (await b.eval("location.pathname") === "/login") throw new Error("login did not sign in");

  await b.go(`${BASE}/studio/notes`, 9000);
  if (!(await waitFor('button[aria-label="New note"]'))) throw new Error("no New note button");

  // Latency goes on only now, after sign-in, so a slow login cannot read as a
  // failure of the thing under test.
  await b.send("Network.enable");
  await b.send("Network.emulateNetworkConditions", {
    offline: false, latency: LATENCY,
    downloadThroughput: -1, uploadThroughput: -1,
  });
  await b.eval(`document.querySelector('button[aria-label="New note"]').click()`);
  if (!(await waitFor('input[aria-label="Note title"]'))) throw new Error("editor never opened");

  await b.eval(`[...document.querySelectorAll('button')].find(x=>/Paragraph/.test(x.innerText)).click()`);
  if (!(await waitFor('textarea[aria-label="text block"]'))) throw new Error("no text block");

  const noteId = (await db()).notes[0]?.id;
  if (!noteId) throw new Error("no note row");

  /**
   * Make the FIRST save of each round the slow one.
   *
   * Emulated network latency is uniform, so requests complete in the order
   * they were issued and a later write always wins — which is why removing the
   * client serialisation changed nothing for four rounds. Real networks are
   * not uniform. Delaying only the first PATCH of a round reproduces the case
   * the serialisation exists for: an older request landing after a newer one
   * and overwriting it.
   */
  await b.eval(`(() => {
    const real = window.fetch;
    window.__roundFirst = false;
    window.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input.url;
      if (url.includes("/api/notes") && init?.method === "PATCH" && !window.__roundFirst) {
        window.__roundFirst = true;
        await new Promise((r) => setTimeout(r, 6000));
      }
      return real(input, init);
    };
    return true;
  })()`);

  for (let round = 1; round <= ROUNDS; round++) {
    await b.eval(`window.__roundFirst = false`);
    const title = `Race ${round}`;
    const body  = `Body for round ${round}, the last thing typed.`;

    /**
     * Spaced just past the debounce, not back to back.
     *
     * Zero-pause edits produce ONE save: queueSave clears the timer on every
     * edit, so the request only fires after the last one and nothing overlaps.
     * Eight rounds of that passed with both protections removed. Waiting a
     * little longer than AUTOSAVE_MS means each edit's save starts while the
     * previous request may still be running, which is the only way two are in
     * flight at once.
     */
    const GAP = Number(process.env.GAP ?? 950);
    // Consecutive BLOCK edits. Each one rewrites every row and recomputes
    // flat_text, so two overlapping block writes are what leaves flat_text
    // describing a set of rows that is no longer there.
    await retype('input[aria-label="Note title"]', title);
    await b.sleep(GAP);
    await retype('textarea[aria-label="text block"]', `${body} one`);
    await b.sleep(GAP);
    await retype('textarea[aria-label="text block"]', `${body} two`);
    await b.sleep(GAP);
    await retype('textarea[aria-label="text block"]', body);

    /**
     * A SECOND WRITER, made concurrent.
     *
     * Inserting an image writes the whole block list, so it races the text
     * edits rather than following them. Until step 3 there was only one
     * writer, which is why the client serialisation had no failing test — the
     * server-side recompute alone kept every assertion green.
     *
     * The picker is OPENED FIRST and its images allowed to load. Opening it
     * after the last edit meant its own query, slowed by the same latency, ran
     * long enough for the text save to land, and nothing overlapped: four
     * rounds passed with the serialisation removed. Pre-opened, the pick is
     * instantaneous and lands while the text save is still in flight.
     */
    await b.eval(`(() => {
      const btn = [...document.querySelectorAll('button')].find(x => x.getAttribute('aria-label') === 'Insert an image');
      if (btn) btn.click();
      return !!btn;
    })()`);
    for (let i = 0; i < 24; i++) {
      if (await b.eval(`!!document.querySelector('[role=dialog] button img')`)) break;
      await b.sleep(250);
    }

    // Text edit with the picker open — programmatic focus reaches the field.
    await retype('textarea[aria-label="text block"]', `${body} racing`);
    await b.sleep(GAP);
    // …and pick, with no pause, while that save is still going.
    await b.eval(`(() => {
      const el = document.querySelector('[role=dialog] button img');
      if (el) { el.closest('button').click(); return true; }
      const close = document.querySelector('[role=dialog] button');
      if (close) close.click();
      return false;
    })()`);

    /**
     * Let everything queued drain.
     *
     * Long enough for the injected 6s delay on the round's first request PLUS
     * the serialised follow-up behind it. Waiting only 6s reported failures
     * that were the probe reading mid-drain, not work being lost — the drain
     * is necessarily slower once requests are serialised, which is the whole
     * point of them.
     */
    const SETTLE = Number(process.env.SETTLE ?? 16000);
    await b.sleep(SETTLE);

    const row = (await db()).notes.find((n) => n.id === noteId);
    const blocks = (await db()).blocks.filter((x) => x.note_id === noteId);

    const titleOk = row?.title === title;
    const flatOk  = (row?.flat_text ?? "").includes(`${body} racing`);
    const blockOk = blocks.some((x) => (x.body ?? "").includes(`${body} racing`));

    if (titleOk && flatOk && blockOk) {
      ok(`r${round} the last edit of each field is what the database holds`);
    } else {
      bad(`r${round} an edit was lost or overwritten`,
        `title=${JSON.stringify(row?.title)} flatOk=${flatOk} blockOk=${blockOk}`);
    }

    // The image inserted mid-round must survive. This is what the client
    // serialisation protects: an older request carrying the pre-image block
    // list landing after the newer one and erasing it. The server-side
    // recompute cannot help here — it faithfully flattens whatever rows the
    // losing request wrote.
    const hasImage = blocks.some((x) => x.kind === "image");
    hasImage
      ? ok(`r${round} the image inserted mid-save survived`)
      : bad(`r${round} the image inserted mid-save survived`,
            `blocks: ${JSON.stringify(blocks.map((x) => x.kind))}`);

    // flat_text must agree with the block rows, whatever order things arrived.
    const fromBlocks = blocks.sort((a, c) => a.sort_order - c.sort_order)
      .map((x) => (x.body ?? "").trim()).filter(Boolean).join("\n");
    (row?.flat_text ?? "") === fromBlocks
      ? ok(`r${round} flat_text matches the block rows exactly`)
      : bad(`r${round} flat_text does not match the block rows`,
            `flat=${JSON.stringify(row?.flat_text)} blocks=${JSON.stringify(fromBlocks)}`);
  }
} catch (e) {
  bad("harness", e.message);
} finally { b.close(); }

console.log(fails ? `\n${fails} FAILING across ${ROUNDS} rounds` : `\nall pass, ${ROUNDS} rounds`);
process.exit(fails ? 1 : 0);
