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

  for (let round = 1; round <= ROUNDS; round++) {
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

    // Let everything queued drain.
    await b.sleep(6000);

    const row = (await db()).notes.find((n) => n.id === noteId);
    const blocks = (await db()).blocks.filter((x) => x.note_id === noteId);

    const titleOk = row?.title === title;
    const flatOk  = (row?.flat_text ?? "").includes(body);
    const blockOk = blocks.some((x) => (x.body ?? "").includes(body));

    if (titleOk && flatOk && blockOk) {
      ok(`r${round} the last edit of each field is what the database holds`);
    } else {
      bad(`r${round} an edit was lost or overwritten`,
        `title=${JSON.stringify(row?.title)} flatOk=${flatOk} blockOk=${blockOk}`);
    }

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
