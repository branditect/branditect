/**
 * Do templates actually render? The migration succeeding is not the proof.
 *
 * Needs a dev server on :3000, a temporary seeding route, and
 *   /tmp/zz-tpl-email   an account with two templates on its brand
 *
 * Run: node scripts/check-templates.mjs
 *
 * Against a throwaway brand with its own two templates, never a real one.
 * Reads the rendered page, and watches the console: the old failure was a
 * PostgREST error the pages discarded, so an empty section and a broken query
 * look identical from the outside.
 */
import { launch } from "./cdp.mjs";
import { readFileSync } from "node:fs";
const BASE = "http://localhost:3000";
const EMAIL = readFileSync("/tmp/zz-tpl-email", "utf8").trim();
let fails = 0;
const ok  = (m, d="") => console.log(`PASS  ${m}${d ? " — " + d : ""}`);
const bad = (m, d="") => { fails++; console.log(`FAIL  ${m}${d ? " — " + d : ""}`); };

const b = await launch({ port: 9800, profile: "/tmp/cdp-tpl-" + Date.now() });
try {
  await b.go(`${BASE}/login`, 6000);
  // Fail on a page React never attached to, rather than reporting it as a
  // login that would not sign in.
  await b.waitForHydration("form");
  await b.type('input[type=email]', EMAIL);
  await b.type('input[type=password]', "TestPassword!2026");

  /**
   * Submit until it takes.
   *
   * requestSubmit() on a page React has not hydrated yet does nothing: there
   * is no handler attached, so the button never goes pending and nothing is
   * called. That is what "login did not sign in" was — not a hung auth call.
   * The button going disabled is the signal that the handler actually ran.
   */
  let signedIn = false;
  for (let attempt = 1; attempt <= 6 && !signedIn; attempt++) {
    await b.eval(`document.querySelector('form')?.requestSubmit()`);
    for (let i = 0; i < 12; i++) {
      await b.sleep(1000);
      if (await b.eval(`location.pathname`) !== "/login") { signedIn = true; break; }
      const pending = await b.eval(`document.querySelector('button[type=submit]')?.disabled ?? false`);
      if (pending) continue;          // the handler is running; keep waiting
      if (i >= 3) break;              // never went pending — not hydrated, retry
    }
  }
  if (!signedIn) throw new Error("login did not sign in after 6 submits");

  for (const [route, label] of [["/brand/visual-identity", "Visual identity"],
                                ["/knowledge/links", "Knowledge ▸ Links"]]) {
    b.errors.length = 0;
    await b.go(`${BASE}${route}`, 10000);
    await b.sleep(2500);

    // innerText alone misses Links, which renders each template name in an
    // editable <input>. An input's value is not text content, so reading only
    // innerText reported an empty page for one that was rendering correctly.
    const main = await b.eval(`(() => {
      const m = document.querySelector('main');
      if (!m) return "";
      const fields = [...m.querySelectorAll('input, textarea')].map(el => el.value).join("\\n");
      return m.innerText + "\\n" + fields;
    })()`);
    if (main.trim().length < 40) { bad(`${label} rendered`, `main=${main.trim().length}`); continue; }

    const found = ["ZZ SQUARE POST", "ZZ STORY 9:16"].filter((n) => main.includes(n));
    found.length === 2
      ? ok(`${label} shows both templates`, found.join(", "))
      : bad(`${label} shows both templates`, `found ${found.length}: ${found.join(", ") || "none"}`);

    // The old symptom: a uuid syntax error the page threw away.
    const uuidErr = b.errors.filter((e) => /invalid input syntax for type uuid/i.test(e));
    uuidErr.length === 0
      ? ok(`${label} makes no uuid-typed query`)
      : bad(`${label} makes no uuid-typed query`, uuidErr[0].slice(0, 90));
  }
} catch (e) {
  bad("harness", e.message);
} finally { b.close(); }
console.log(fails ? `\n${fails} FAILING` : "\nall pass");
process.exit(fails ? 1 : 0);
