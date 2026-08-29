/**
 * Hydration smoke test.
 *
 * A page can server-render perfectly and then blank when hydration throws:
 * React discards the tree and you get an empty body, with the error visible
 * only in a console captured from before load. `npm run build`, tsc and lint
 * all pass in that state. This is the check that does not.
 *
 * Usage: node scripts/smoke.mjs [baseUrl]
 *   npm run smoke        local build
 *   npm run smoke:prod   the deployed site
 *
 * Run it against production, not only a local build. Both failures on
 * 2026-08-25 — the missing service-role key and the hydration crash — existed
 * only in the deployed environment, and a passing local build is what let two
 * red deploys sit unnoticed.
 */
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3000";
const ROUTES = ["/login", "/signup", "/start", "/start/q/1", "/start/q/7", "/start/resume",
                "/home", "/brand/strategy", "/knowledge/products", "/numbers"];
const CHROME = process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), "smoke-"));
const chrome = spawn(CHROME, ["--headless", "--disable-gpu", "--remote-debugging-port=9222",
  `--user-data-dir=${profile}`, "--window-size=1440,900", "--no-first-run"], { stdio: "ignore" });

let wsUrl;
for (let i = 0; i < 60; i++) {
  try {
    const list = await (await fetch("http://127.0.0.1:9222/json/list")).json();
    const page = list.find((t) => t.type === "page");
    if (page) { wsUrl = page.webSocketDebuggerUrl; break; }
  } catch { /* not up yet */ }
  await sleep(250);
}
if (!wsUrl) { console.error("could not start Chrome"); chrome.kill(); process.exit(1); }

const ws = new WebSocket(wsUrl);
await new Promise((r) => { ws.onopen = r; });
let id = 0;
const pending = new Map();
let errors = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
  if (m.method === "Runtime.exceptionThrown") {
    const d = m.params.exceptionDetails;
    errors.push((d.exception && (d.exception.description || d.exception.value)) || d.text);
  }
};
const send = (method, params = {}) => {
  const i = ++id;
  ws.send(JSON.stringify({ id: i, method, params }));
  return new Promise((r) => pending.set(i, r));
};

await send("Page.enable");
await send("Runtime.enable");

let failed = 0;
const lengths = [];
for (const route of ROUTES) {
  errors = [];
  await send("Page.navigate", { url: BASE + route });
  await sleep(5000);
  const res = await send("Runtime.evaluate", {
    expression: `JSON.stringify({
      len: document.body.innerText.trim().length,
      title: document.title,
      text: document.body.innerText.trim().slice(0, 120),
    })`,
    returnByValue: true,
  });
  let len = 0, title = "", text = "";
  try {
    const parsed = JSON.parse(res.result?.result?.value ?? "{}");
    len = parsed.len ?? 0; title = parsed.title ?? ""; text = parsed.text ?? "";
  } catch { /* keep defaults */ }

  // A non-empty body is not enough. An interstitial — a Vercel security
  // checkpoint, a WAF challenge, an error page — has plenty of text and would
  // otherwise pass on every route at once. Nine identical body lengths is the
  // tell, so treat a known interstitial as a failure outright.
  const interstitial = /Security Checkpoint|Just a moment|Attention Required|Application error|500: Internal/i;
  const blocked = interstitial.test(text) || interstitial.test(title);

  // Hydration errors are the point of this test, so they fail the route even
  // when the server HTML happened to survive.
  const fatal = errors.filter((e) => !/favicon|net::ERR/i.test(e));
  // The onboarding rail is a fixed-height column with a foot note pinned to the
  // bottom. A decorative element that falls into the document flow pushes the
  // logo, the eyebrow, the question and the guide card below the fold — which
  // npm test cannot see, because it is computed style in a real browser, and
  // which a user sees immediately as a third of empty lavender.
  let railWhy = "";
  if (route === "/start/q/7") {
    const railRes = await send("Runtime.evaluate", {
      expression: `JSON.stringify((() => {
        const rail = document.querySelector("aside");
        if (!rail) return { found: false };
        const first = rail.querySelector(":scope > *:nth-child(2)");
        const blob = rail.querySelector(":scope > *:nth-child(1)");
        return {
          found: true,
          railTop: first ? Math.round(first.getBoundingClientRect().top) : null,
          railHeight: Math.round(rail.getBoundingClientRect().height),
          viewport: window.innerHeight,
          blobPosition: blob ? getComputedStyle(blob).position : null,
        };
      })())`,
      returnByValue: true,
    });
    let rail = { found: false };
    try { rail = JSON.parse(railRes.result?.result?.value ?? "{}"); } catch { /* keep default */ }

    if (!rail.found) {
      railWhy = "  no rail on the page";
    } else if (!(rail.railTop !== null && rail.railTop < 60)) {
      railWhy = `  rail content starts at ${rail.railTop}px, expected < 60 (blob position: ${rail.blobPosition})`;
    } else if (!(rail.railHeight <= rail.viewport + 1)) {
      // The assertion that matters long-term: whatever the cause, a rail taller
      // than the viewport breaks the pinned-foot-note contract.
      railWhy = `  the rail is taller than the viewport (${rail.railHeight}px in ${rail.viewport}px)`;
    }
  }

  const ok = len > 0 && fatal.length === 0 && !blocked && !railWhy;
  if (!ok) failed++;
  const why = blocked ? `  BLOCKED: ${text.slice(0, 60)}`
    : fatal.length ? `  ${fatal[0].split("\n")[0].slice(0, 90)}` : railWhy;
  console.log(`${ok ? "PASS" : "FAIL"}  ${route.padEnd(22)} bodyText=${len}${why}`);
  lengths.push(len);
}

ws.close();
chrome.kill();
// Every route returning the same length means one page is being served for
// all of them, which is an interstitial even when its text is unrecognised.
if (!failed && lengths.length > 2 && new Set(lengths).size === 1) {
  console.log(`\nSUSPECT: all ${lengths.length} routes returned an identical body length (${lengths[0]}) — likely one page served for everything.`);
  failed = lengths.length;
}
console.log(failed ? `\n${failed} route(s) failed` : "\nall routes rendered");
process.exit(failed ? 1 : 0);
