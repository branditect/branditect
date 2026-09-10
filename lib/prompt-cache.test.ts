/** Run with: npm test — inbox entry 2 of branditect-ui/spec/inbox.md */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { cachedSystem, perRequest, cacheStats, cacheLogLine, CACHE_TTL } from "./prompt-cache.ts";
import {
  andyStable, copyStable, copyPerRequest, imagePromptStable, productBlock,
  STRATEGY_STABLE, TONE_STABLE, CATALOG_PARSE_STABLE, VAULT_EXTRACT_STABLE,
  CODE_ARCHITECT_STABLE,
} from "./prompts.ts";

/**
 * WHAT THESE TESTS CANNOT DO, said up front.
 *
 * None of this proves caching works. The API's own counters are the only
 * proof, and they come from scripts/prompt-cache-probe.mjs — criterion 2 of
 * the inbox entry, which says in as many words that a test grepping for
 * `cache_control` proves only that a string is present. That was the mistake
 * the CSS assertion made by reading the stylesheet as text, and the mistake
 * the policy guard made by only looking at tables with a brand_id.
 *
 * What these tests do is criterion 4 and regression cover: the cached block is
 * built from the brand context and the static rules and from nothing else, and
 * no route quietly goes back to passing a plain string.
 */

// ─────────────────────────────────────────────────────── the helper itself ──

describe("cachedSystem builds the array the API needs", () => {
  it("puts cache_control on the stable block", () => {
    const b = cachedSystem("stable text");
    assert.equal(b.length, 1);
    assert.deepEqual(b[0], {
      type: "text", text: "stable text",
      cache_control: { type: "ephemeral", ttl: CACHE_TTL },
    });
  });

  it("puts the per-request text in a SECOND, uncached block", () => {
    const b = cachedSystem("stable text", perRequest("the brief"));
    assert.equal(b.length, 2);
    assert.equal(b[0].text, "stable text");
    assert.equal(b[1].text, "the brief");
    assert.equal(b[1].cache_control, undefined,
      "the per-request block must not carry cache_control — it would write a new entry every call");
  });

  it("never lets the per-request text reach the cached block", () => {
    const b = cachedSystem("stable text", perRequest("MARKER-THAT-CHANGES"));
    assert.ok(!b[0].text.includes("MARKER-THAT-CHANGES"),
      "a per-request string inside the cached prefix invalidates the entry on every call");
  });

  it("drops an empty per-request block rather than sending an empty one", () => {
    assert.equal(cachedSystem("stable", perRequest("")).length, 1);
    assert.equal(cachedSystem("stable", perRequest("   ")).length, 1);
    assert.equal(cachedSystem("stable", null).length, 1);
    assert.equal(cachedSystem("stable").length, 1);
  });

  it("hands the per-request half over as an object, not a string", () => {
    // A string could be concatenated onto the stable half by a caller in a
    // hurry and nothing would complain. tsc does not object to string + object
    // either — that was checked, not assumed — but the result is visibly
    // broken rather than silently expensive.
    const p = copyPerRequest({ deliverable: "a caption", wordTarget: "20 words", count: 1, product: null });
    assert.equal(typeof p, "object");
    assert.equal(p.kind, "per-request");
    assert.equal(typeof p.text, "string");
    assert.ok(String("prefix" + (p as unknown as string)).endsWith("[object Object]"),
      "gluing the brief onto the prefix has to be visible; the source guard below is what catches it");
  });

  it("refuses an empty stable block", () => {
    // Otherwise cache_control lands on nothing and the real prompt ends up in
    // the uncached position, which looks like it is working.
    assert.throws(() => cachedSystem(""), /stable block is empty/);
    assert.throws(() => cachedSystem("   "), /stable block is empty/);
  });
});

// ──────────────────────────────────── criterion 4: the cached block is pure ──

describe("nothing per-request enters the cached block", () => {
  const CONTEXT = "Brand: Sorbify\nProducts: one absorbent granule, 12 EUR.";
  const PRODUCT = { name: "SORBIFY OIL", price_rrp: "12.00" };

  it("copy: the same brand gives a byte-identical prefix across different briefs", () => {
    const stable = copyStable({ brandName: "Sorbify", context: CONTEXT });
    const a = cachedSystem(stable, copyPerRequest({
      deliverable: "an Instagram caption", wordTarget: "20-30 words", count: 1, product: null,
    }));
    const b = cachedSystem(stable, copyPerRequest({
      deliverable: "a long-form email", wordTarget: "250-350 words", count: 3, product: PRODUCT,
    }));
    assert.equal(a[0].text, b[0].text);
    assert.notEqual(a[1].text, b[1].text, "the briefs are the same — this test would pass vacuously");
  });

  it("copy: the brief, the length, the count and the product are all in block 1", () => {
    const stable = copyStable({ brandName: "Sorbify", context: CONTEXT });
    const per = copyPerRequest({
      deliverable: "a long-form email", wordTarget: "250-350 words", count: 3, product: PRODUCT,
    });
    for (const varying of ["a long-form email", "250-350 words", "3 separate drafts", "SORBIFY OIL"]) {
      assert.ok(per.text.includes(varying), `${varying} is missing from the per-request block`);
      assert.ok(!stable.includes(varying), `${varying} is inside the cached prefix`);
    }
  });

  it("copy: the product moved out of the prefix, so switching product still reads the cache", () => {
    const stable = copyStable({ brandName: "Sorbify", context: CONTEXT });
    assert.ok(!stable.includes("THE PRODUCT THIS IS ABOUT"));
    assert.ok(productBlock(PRODUCT).includes("THE PRODUCT THIS IS ABOUT"));
    assert.equal(productBlock(null), "");
  });

  it("andy: identical context in, identical prefix out — and different context differs", () => {
    assert.equal(andyStable(CONTEXT), andyStable(CONTEXT));
    assert.notEqual(andyStable(CONTEXT), andyStable("Brand: Vetra"),
      "the builder ignores its argument — every brand would share one cache entry");
  });

  it("image prompts: same DNA in, same prefix out", () => {
    assert.equal(imagePromptStable("Headline: warm\n"), imagePromptStable("Headline: warm\n"));
    assert.notEqual(imagePromptStable("Headline: warm\n"), imagePromptStable("Headline: cold\n"));
  });

  /**
   * The failure this guards against is a "today is 10 September 2026" line, a
   * request id, or a random pick landing at the front of a 16k prefix. It
   * would cost the write premium on every call and never read once, and
   * nothing would look wrong. Comments are stripped first: this file's own
   * header names a date, and a check that flags its own explanation is a check
   * that gets weakened.
   */
  it("lib/prompts.ts contains no clock and no randomness", () => {
    const src = readFileSync("lib/prompts.ts", "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1");
    for (const banned of ["Date", "Math.random", "performance.now", "hrtime", "randomUUID"]) {
      assert.ok(!src.includes(banned),
        `lib/prompts.ts uses ${banned} — a value that changes per call inside the cached prefix ` +
        `means a cache write on every request and a read on none`);
    }
  });

  it("every stable prompt ends in the house style, which is the same bytes for every brand", () => {
    const houseTail = "No sentence that would survive with the brand\nname swapped for a competitor's.\n";
    for (const [n, p] of [
      ["andy", andyStable("x")], ["copy", copyStable({ brandName: "x", context: "y" })],
      ["image", imagePromptStable("x")], ["strategy", STRATEGY_STABLE], ["tone", TONE_STABLE],
      ["catalog", CATALOG_PARSE_STABLE], ["code-architect", CODE_ARCHITECT_STABLE],
    ] as [string, string][]) {
      assert.ok(p.endsWith(houseTail), `${n} does not end with HOUSE_STYLE`);
    }
    // vault/extract is the one exception and always was: it reads a PDF back
    // as raw text, so output formatting rules do not apply to it.
    assert.ok(!VAULT_EXTRACT_STABLE.includes("OUTPUT FORMAT"));
  });
});

// ─────────────────────────────────────────── criterion 3: the counters show ──

describe("the hit rate is visible", () => {
  it("reports a read as a hit", () => {
    const s = cacheStats("andy", {
      input_tokens: 14, cache_creation_input_tokens: 0, cache_read_input_tokens: 2404,
    });
    assert.equal(s.read, 2404);
    assert.equal(s.hitRate, 1);
    assert.equal(cacheLogLine("andy", {
      input_tokens: 14, cache_creation_input_tokens: 0, cache_read_input_tokens: 2404,
    }), "[cache] andy write=0 read=2404 uncached=14 hit=100%");
  });

  it("reports a write as a miss, not as a hit", () => {
    const s = cacheStats("andy", {
      input_tokens: 14, cache_creation_input_tokens: 2404, cache_read_input_tokens: 0,
    });
    assert.equal(s.hitRate, 0);
  });

  it("says n/a rather than 0% when nothing was cacheable", () => {
    // A prompt below the 1024-token minimum reports neither number. Calling
    // that a 0% hit rate would read as a broken cache rather than a prompt
    // too short to have one.
    assert.equal(cacheStats("vault-extract", { input_tokens: 900 }).hitRate, null);
    assert.ok(cacheLogLine("vault-extract", { input_tokens: 900 }).endsWith("hit=n/a"));
  });

  it("survives a response that reports no usage at all", () => {
    assert.equal(cacheStats("x", undefined).hitRate, null);
    assert.equal(cacheStats("x", null).written, 0);
  });
});

// ───────────────────────────────── criterion 1, as a regression guard only ──

/**
 * This one IS source-reading, and it proves nothing about whether the API
 * caches. It exists so that route number nine does not go back to
 * `system: SYSTEM_PROMPT + HOUSE_STYLE` — a plain string, which caches
 * nothing and reports no error.
 */
function routeFiles(dir = "app/api"): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...routeFiles(p));
    else if (entry === "route.ts") out.push(p);
  }
  return out;
}
const name = (p: string) => p.replace("app/api/", "").replace("/route.ts", "");
/** Gitignored scratch endpoints, skipped for the reason given in api-ownership.test.ts. */
const SCRATCH = /^(zz-|.*-seed$|.*-check$)/;

describe("no route sends a system prompt as a plain string", () => {
  const senders = routeFiles()
    .filter((f) => !SCRATCH.test(name(f)))
    .filter((f) => /\bsystem:/.test(readFileSync(f, "utf8")));

  it("finds the routes at all, so this cannot pass vacuously", () => {
    assert.equal(senders.length, 8,
      `expected 8 routes sending a system prompt, found ${senders.length}: ${senders.map(name).join(", ")}`);
  });

  for (const file of senders) {
    it(`${name(file)} builds it with cachedSystem`, () => {
      const src = readFileSync(file, "utf8");
      assert.match(src, /system:\s*cachedSystem\(/,
        `${file} passes system: something that is not cachedSystem(...)`);
      assert.ok(!/system:\s*`/.test(src), `${file} still passes a template literal as system`);
      assert.ok(!/system:.*HOUSE_STYLE/.test(src), `${file} still concatenates HOUSE_STYLE inline`);
    });

    it(`${name(file)} concatenates nothing into the cached argument`, () => {
      // This is the check that catches copyStable(x) + copyPerRequest(y) and
      // andyStable(ctx) + "request id " + n alike. Neither is a compile error
      // — TypeScript allows "+" between a string and anything — so the type of
      // the per-request block is a tell, not a guarantee.
      const src = readFileSync(file, "utf8");
      const at = src.indexOf("cachedSystem(");
      let depth = 0, end = at;
      for (let i = at + "cachedSystem".length; i < src.length; i++) {
        if (src[i] === "(") depth++;
        else if (src[i] === ")" && --depth === 0) { end = i; break; }
      }
      const call = src.slice(at, end + 1);
      assert.ok(!/[^+]\+[^+]/.test(call),
        `${file} concatenates inside the cachedSystem call: ${call.replace(/\s+/g, " ")}`);
    });

    it(`${name(file)} logs its cache counters`, () => {
      assert.match(readFileSync(file, "utf8"), /logCacheUsage\(/,
        `${file} sends a system prompt but never reports whether it hit the cache`);
    });
  }
});
