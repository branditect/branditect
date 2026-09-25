/** Run with: npm test */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { ROUTE_PLAN } from "./metering-plan.ts";

/**
 * No route calls a paid model without a signed-in caller.
 *
 * lib/api-ownership.test.ts asks a different question: routes that hold the
 * service key must resolve a brand. Ten routes held no service key, touched no
 * brand data, and were therefore correct by that test and by
 * branditect-ui/spec/security-hardening.md, which listed them as "no brand
 * data at all, no change needed".
 *
 * That reasoning is about leaking, and it is right about leaking. It misses
 * that an open route which calls Anthropic is an uncapped bill for anyone who
 * finds the URL. Nothing about the failure looks like a breach: no data moves,
 * the invoice just grows.
 *
 * So: two rules. Anything that spends money authenticates. Nothing fetches a
 * URL the caller chose.
 */

const API = "app/api";

function routeFiles(dir = API): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return routeFiles(full);
    return entry === "route.ts" ? [full] : [];
  });
}

/** Comments stripped, so a route name inside prose cannot satisfy a check.
 *  A `//` straight after a colon is a URL, not a comment: stripping it hid
 *  `fetch("https://api.anthropic.com/...")` from every check in this file. */
const code = (p: string) =>
  readFileSync(p, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

/*
  Every way this codebase reaches a paid model. It used to be
  `anthropic.messages.create`, which missed a client named `client`, the two
  routes that fetch api.anthropic.com by hand, and the extractColors() helper
  in lib/brand-colors-server.ts — six spending routes this file never saw.
*/
const SPENDS = /\.messages\.create\(|\.messages\.stream\(|api\.anthropic\.com|generativelanguage|openai|\bextractColors\(/;

/** Route key as ROUTE_PLAN spells it: the path under app/api, minus route.ts. */
const routeKey = (f: string) => f.slice(API.length + 1).replace(/\/route\.ts$/, "");

/** The argument text of every `new Anthropic(...)` in a source. */
function anthropicClients(src: string): string[] {
  const out: string[] = [];
  const re = /new Anthropic\(/g;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    let depth = 0;
    for (let i = m.index + "new Anthropic".length; i < src.length; i++) {
      if (src[i] === "(") depth++;
      else if (src[i] === ")" && --depth === 0) { out.push(src.slice(m.index, i + 1)); break; }
    }
  }
  return out;
}

describe("every route that spends money checks the caller first", () => {
  const files = routeFiles();

  it("finds the routes at all, so this cannot pass vacuously", () => {
    assert.ok(files.length > 20, `only ${files.length} route files found`);
  });

  for (const f of files) {
    const src = code(f);
    if (!SPENDS.test(src)) continue;

    it(`${f.slice(API.length + 1)} requires a signed-in caller`, () => {
      assert.match(
        src,
        /requireUser\(req\)|resolveBrand\(req/,
        `${f} calls a paid model with no check on who is calling. ` +
          `Use requireUser(req) when the route touches no brand data, ` +
          `resolveBrand(req) when it does.`,
      );
    });

    it(`${f.slice(API.length + 1)} refuses before it spends`, () => {
      /*
        Position in the file is not order of execution.

        brand-guideline/upload-asset defines detectLogoType() above its handler
        and calls it after resolving the brand, so a naive "guard index <
        spend index" check failed a route that is correct. Compare inside each
        handler body instead; a spend in a helper is only reached through a
        handler, and the test above already proves every handler is guarded.
      */
      const handlers = [...src.matchAll(/export async function (GET|POST|PATCH|PUT|DELETE)\b/g)];
      for (let i = 0; i < handlers.length; i++) {
        const start = handlers[i].index!;
        const end = i + 1 < handlers.length ? handlers[i + 1].index! : src.length;
        const body = src.slice(start, end);
        const spend = body.search(SPENDS);
        if (spend === -1) continue;
        const guard = body.search(/requireUser\(req\)|resolveBrand\(req/);
        assert.ok(guard !== -1 && guard < spend,
          `${handlers[i][1]} in ${f} calls the model before checking the caller`);
      }
    });

    /*
      The spend ceiling (branditect-ui/spec/hq-accounts.md Part 1). A route
      that calls a provider without a reservation is a hole in the guarantee
      "usage never exceeds the cap", and nothing about it would look wrong.
    */
    it(`${f.slice(API.length + 1)} spends through the meter`, () => {
      assert.match(src, /\b(meter|reserveMeter)\(/,
        `${f} calls a paid model without meter() / reserveMeter() from lib/metering.ts`);
    });

    it(`${f.slice(API.length + 1)} has a row in ROUTE_PLAN`, () => {
      const key = routeKey(f);
      assert.ok(Object.hasOwn(ROUTE_PLAN, key),
        `"${key}" is not in lib/metering-plan.ts ROUTE_PLAN, so it has no kind and no credit price`);
      assert.match(src, new RegExp(`route:\\s*["']${key.replace(/[/-]/g, "\\$&")}["']`),
        `${f} does not meter under its own key "${key}"`);
    });

    it(`${f.slice(API.length + 1)} leaves retrying to the meter`, () => {
      // The SDK retries twice by default; with meter()'s one retry that is up
      // to six attempts inside one reservation (criterion 7).
      for (const call of anthropicClients(src)) {
        assert.match(call, /maxRetries:\s*0\b/, `${f}: ${call.replace(/\s+/g, " ")} does not pass maxRetries: 0`);
      }
    });
  }
});

describe("the spend ceiling covers every provider call", () => {
  const files = routeFiles();
  const spenders = files.filter((f) => SPENDS.test(code(f))).map(routeKey);

  it("finds the spending routes, so this cannot pass vacuously", () => {
    // 18 since 2026-09-25: extract-colors, brand/analyse-images and
    // brand/generate-prompt were deleted — no screen had ever called them.
    assert.ok(spenders.length >= 18, `only ${spenders.length} spending routes found: ${spenders.join(", ")}`);
  });

  it("ROUTE_PLAN names no route that does not spend", () => {
    // A stale row is harmless on its own, but it is also how a renamed route
    // quietly loses its price: the new path has no row and the old one still does.
    const stale = Object.keys(ROUTE_PLAN).filter((k) => !spenders.includes(k));
    assert.deepEqual(stale, [], `ROUTE_PLAN rows with no spending route: ${stale.join(", ")}`);
  });

  /*
    A provider call can hide in lib/ too. The only one allowed is a helper
    that returns a meter() attempt, so a route cannot call it without a
    reservation — and that helper, like every route, leaves retries to meter().
  */
  const METERED_HELPERS = ["lib/brand-colors-server.ts"];

  function libFiles(dir = "lib"): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) return libFiles(full);
      return /\.tsx?$/.test(entry) && !/\.test\.ts$/.test(entry) ? [full] : [];
    });
  }

  it("no lib module calls a provider except the metered helpers", () => {
    const direct = /\.messages\.create\(|\.messages\.stream\(|api\.anthropic\.com|generativelanguage/;
    const found = libFiles().filter((f) => direct.test(code(f)));
    assert.deepEqual(found.sort(), [...METERED_HELPERS].sort(),
      `unexpected provider calls in lib: ${found.filter((f) => !METERED_HELPERS.includes(f)).join(", ")}`);
  });

  for (const h of METERED_HELPERS) {
    it(`${h} returns an attempt for meter() and leaves retrying to it`, () => {
      const src = code(h);
      assert.match(src, /Promise<Attempt</, `${h} does not return a meter() Attempt`);
      for (const call of anthropicClients(src)) {
        assert.match(call, /maxRetries:\s*0\b/, `${h}: ${call.replace(/\s+/g, " ")} does not pass maxRetries: 0`);
      }
    });
  }
});

/**
 * Server-side fetch of a caller-chosen URL.
 *
 * brand-book/chat passed `pageUrls` from the body to Anthropic as image URLs,
 * which is someone else's infrastructure making a request the caller picked,
 * billed to us. Brand book pages live in this project's storage; that is the
 * whole allowlist.
 */
describe("no route hands a caller-supplied URL to the model", () => {
  it("brand-book/chat only accepts URLs in our own storage", () => {
    const src = code("app/api/brand-book/chat/route.ts");
    assert.match(src, /NEXT_PUBLIC_SUPABASE_URL/,
      "the allowlist does not mention our storage host");
    assert.ok(
      !/source:\s*\{\s*type:\s*'url',\s*url\s*\}/.test(src.replace(/\s+/g, " ").replace(/(for \(const url of pages\)|pages\.forEach\(\(url)[\s\S]*/, "")),
      "an unfiltered URL still reaches the model",
    );
    assert.match(src, /pageUrls\.filter\(allowed\)|filter\(allowed\)/,
      "pageUrls is not filtered against the allowlist");
  });
});

/**
 * The client half. A guard on the server with no token from the browser is not
 * security, it is an outage — and it shows up as a feature that silently stops
 * working, which is how /api/brand-book/color had been failing.
 */
describe("the browser sends its token to every /api route", () => {
  function clientFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) return full.includes("node_modules") ? [] : clientFiles(full);
      return /\.tsx$/.test(entry) ? [full] : [];
    });
  }

  const files = [...clientFiles("app"), ...clientFiles("components")].filter((f) => !f.startsWith("app/api"));

  it("finds the client files", () => {
    assert.ok(files.length > 20, `only ${files.length} client files`);
  });

  for (const f of files) {
    const src = readFileSync(f, "utf8");
    const bare = [...src.matchAll(/(?<!authed)fetch\(\s*["'`]\/api\//g)];
    if (bare.length === 0) continue;

    it(`${f} uses authedFetch for /api calls`, () => {
      assert.fail(
        `${bare.length} plain fetch("/api/…") call(s) in ${f}. ` +
          `Every /api route now identifies its caller, so a call without the ` +
          `Authorization header is a 401 and the feature stops working silently. ` +
          `Use authedFetch from lib/authed-fetch.`,
      );
    });
  }
});
