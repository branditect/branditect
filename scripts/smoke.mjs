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
                "/home", "/brand/strategy", "/brand/visual-identity", "/knowledge/products", "/numbers"];

// A non-empty body was the whole bar, and it was too low. Signed out, the app
// routes still serve the shell: the sidebar alone is ~750 characters, so
// /brand/visual-identity "passed" with bodyText=759 while rendering none of the
// page. Five of the eleven routes were being checked for their nav.
//
// Each app route now has to show something only its own <main> can produce.
// Signed out these routes do not redirect: they render their own empty state,
// so the marker is a real assertion without a session, and a shell-only render
// fails instead of passing.
// Matched against <main>, never the whole document. "Products" is a nav item,
// so a body-wide match passed on the sidebar — the first version of this check
// went green on all eleven routes while proving nothing.
const MARKERS = {
  "/home":                   /checks left|Brand Rea|What\u2019s next|Whats next/i,
  "/brand/strategy":         /No strategy yet|Positioning|Audience/i,
  "/brand/visual-identity":  /logos, colours and typefaces|Logo|Typeface|Palette/i,
  "/knowledge/products":     /Everything Branditect can write about|No products yet|Add product/i,
  "/numbers":                /Your product cards hold the real figures|What Numbers does|Break-even/i,
};

// Set SMOKE_EMAIL and SMOKE_PASSWORD to check the five app routes for real.
const EMAIL = process.env.SMOKE_EMAIL ?? null;
const PASSWORD = process.env.SMOKE_PASSWORD ?? null;
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

if (EMAIL && PASSWORD) {
  await send("Page.navigate", { url: BASE + "/login" });
  await sleep(4000);
  await send("Runtime.evaluate", {
    expression: `document.querySelector('input[type=email]').focus()`,
  });
  await send("Input.insertText", { text: EMAIL });
  await send("Runtime.evaluate", {
    expression: `document.querySelector('input[type=password]').focus()`,
  });
  await send("Input.insertText", { text: PASSWORD });
  await send("Runtime.evaluate", { expression: `document.querySelector('button[type=submit]').click()` });
  await sleep(7000);
  const who = await send("Runtime.evaluate", {
    expression: `location.pathname`, returnByValue: true,
  });
  const landed = who.result?.result?.value ?? "";
  if (landed === "/login") {
    console.log("could not sign in — the app routes will be reported SKIP");
  } else {
    console.log(`signed in, landed on ${landed}`);
  }
}
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

  // A fixed-height box that is inline renders as a zero-width sliver and paints
  // its background onto nothing. Silent in every unit test, obvious to a user:
  // the colour page shipped with no colour on it for a day.
  //
  // Two checks, because this run has no session. The measurement only works on
  // a rendered swatch, which needs a signed-in brand; the rule scan works
  // whenever the stylesheet is loaded, which is always. Without the scan the
  // guard would pass vacuously on every signed-out run — which is exactly what
  // it did on the first attempt.
  let chipWhy = "";
  if (route === "/brand/visual-identity") {
    const chipRes = await send("Runtime.evaluate", {
      expression: `JSON.stringify((() => {
        const el = document.querySelector("[class*=_chip__]");
        const measured = el
          ? (() => { const r = el.getBoundingClientRect();
                     return { found: true, w: Math.round(r.width), h: Math.round(r.height),
                              display: getComputedStyle(el).display }; })()
          : { found: false };

        // Any rule that sets a height but no display. An inline box ignores
        // both height and width, whatever element the class lands on.
        const offenders = [];
        for (const sheet of document.styleSheets) {
          let rules; try { rules = sheet.cssRules; } catch { continue; }   // cross-origin
          for (const rule of rules ?? []) {
            const st = rule.style;
            if (!st || !rule.selectorText) continue;
            const h = st.getPropertyValue("height");
            if (!h || !/^\\d+(\\.\\d+)?px$/.test(h.trim()) || parseFloat(h) < 40) continue;
            if (st.getPropertyValue("display")) continue;
            const pos = st.getPropertyValue("position");
            if (pos === "absolute" || pos === "fixed") continue;           // out of flow already
            // CSS-module classes only. A Tailwind h-[100px] utility is meant to
            // be combined with a display utility and is not the defect here.
            if (!/_[A-Za-z]+__[A-Za-z0-9]/.test(rule.selectorText)) continue;
            offenders.push(rule.selectorText + " { height: " + h + " }");
          }
        }
        return { measured, offenders };
      })())`,
      returnByValue: true,
    });
    let chip = { measured: { found: false }, offenders: [] };
    try { chip = JSON.parse(chipRes.result?.result?.value ?? "{}"); } catch { /* keep default */ }

    const m = chip.measured ?? { found: false };
    if (m.found && !(m.w > 40 && m.h > 50)) {
      chipWhy = `  colour chip is ${m.w}x${m.h} (display: ${m.display})`;
    } else if ((chip.offenders ?? []).length) {
      chipWhy = `  fixed height with no display: ${chip.offenders.join("; ").slice(0, 110)}`;
    }
  }

  // The marker is read from the whole body, not the 120-character preview,
  // because the sidebar occupies the first ~750 characters of every app route.
  const marker = MARKERS[route];
  let mainText = "", mainLen = 0;
  if (marker) {
    const full = await send("Runtime.evaluate", {
      expression: `JSON.stringify((() => { const m = document.querySelector('main');
        return { t: m ? m.innerText : "", n: m ? m.innerText.trim().length : 0 }; })())`,
      returnByValue: true,
    });
    try {
      const parsed = JSON.parse(full.result?.result?.value ?? "{}");
      mainText = parsed.t ?? ""; mainLen = parsed.n ?? 0;
    } catch { /* keep defaults */ }
  }
  const reachedPage = marker ? marker.test(mainText) : true;

  const hardFail = len === 0 || fatal.length > 0 || blocked || railWhy || chipWhy;
  const ok = !hardFail && reachedPage;
  const why = blocked ? `  BLOCKED: ${text.slice(0, 60)}`
    : fatal.length ? `  ${fatal[0].split("\n")[0].slice(0, 90)}` : railWhy || chipWhy;

  if (hardFail) {
    failed++;
    console.log(`FAIL  ${route.padEnd(22)} bodyText=${len}${why}`);
  } else if (!reachedPage) {
    // The shell rendered but the page did not. This is the case the old
    // bodyText > 0 bar could not see.
    failed++;
    console.log(`FAIL  ${route.padEnd(22)} bodyText=${len}  main=${mainLen} — the shell rendered but the page did not`);
  } else {
    const scope = marker ? `  main=${mainLen}` : "";
    console.log(`PASS  ${route.padEnd(22)} bodyText=${len}${scope}${why}`);
  }
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
