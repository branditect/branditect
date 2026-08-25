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
const ROUTES = ["/login", "/signup", "/start", "/start/q/1", "/start/resume",
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
for (const route of ROUTES) {
  errors = [];
  await send("Page.navigate", { url: BASE + route });
  await sleep(5000);
  const res = await send("Runtime.evaluate", {
    expression: "JSON.stringify({ len: document.body.innerText.trim().length })",
    returnByValue: true,
  });
  let len = 0;
  try { len = JSON.parse(res.result?.result?.value ?? "{}").len ?? 0; } catch { /* keep 0 */ }

  // Hydration errors are the point of this test, so they fail the route even
  // when the server HTML happened to survive.
  const fatal = errors.filter((e) => !/favicon|net::ERR/i.test(e));
  const ok = len > 0 && fatal.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${route.padEnd(22)} bodyText=${len}${fatal.length ? `  ${fatal[0].split("\n")[0].slice(0, 90)}` : ""}`);
}

ws.close();
chrome.kill();
console.log(failed ? `\n${failed} route(s) failed` : "\nall routes rendered");
process.exit(failed ? 1 : 0);
