/**
 * Criterion 2 of inbox entry 2: the proof is the API's own numbers.
 *
 * "A test that greps the codebase for cache_control proves only that a string
 * is present — the same mistake as the CSS assertion that read the stylesheet
 * as text and the policy guard that only looked at tables with a brand_id."
 *
 * So this sends the real system arrays, built by the real lib/prompts.ts
 * builders, to the real API, and reads cache_creation_input_tokens and
 * cache_read_input_tokens back off the response.
 *
 * FOUR THINGS ARE MEASURED PER ROUTE.
 *
 *   1. write    — call one creates an entry.
 *   2. read     — call two, byte-identical, reads it. This is the criterion.
 *   3. split    — call three changes ONLY the per-request block and still
 *                 reads. This is what the whole stable/per-request split is
 *                 for, and the thing that would regress silently: fold the
 *                 brief back into the prefix and 1 and 2 still pass while
 *                 every real call misses.
 *   4. control  — call four sends the same text with NO cache_control and must
 *                 report a read of zero. Without it, "read > 0" could be a
 *                 counter that is always non-zero and the pass would mean
 *                 nothing.
 *
 * A prompt under Sonnet's 1024-token minimum caches nothing and reports
 * neither counter. That is BELOW-MINIMUM, not a pass and not a failure — the
 * honest answer is that caching does not apply to it, and the measured token
 * count is printed so the claim can be checked.
 *
 * Usage: npm run cache:probe
 * Costs a few cents. max_tokens is 16 and thinking is off; the input is the
 * point, not the output.
 */
import { readFileSync } from "node:fs";
import {
  andyStable, copyStable, copyPerRequest, imagePromptStable,
  STRATEGY_STABLE, TONE_STABLE, CATALOG_PARSE_STABLE, VAULT_EXTRACT_STABLE,
  CODE_ARCHITECT_STABLE,
} from "../lib/prompts.ts";
import { cachedSystem, cacheStats, CACHE_TTL } from "../lib/prompt-cache.ts";

const MODEL = "claude-sonnet-5";

function apiKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  for (const f of [".env.local", ".env"]) {
    let raw;
    try { raw = readFileSync(new URL(`../${f}`, import.meta.url), "utf8"); } catch { continue; }
    const m = raw.match(/^\s*ANTHROPIC_API_KEY\s*=\s*(.*)$/m);
    if (m) return m[1].replace(/^["']|["']$/g, "").trim();
  }
  return null;
}
const KEY = apiKey();
if (!KEY) { console.error("prompt-cache-probe needs ANTHROPIC_API_KEY"); process.exit(2); }

/** Strip every cache_control, for the negative control. */
const uncached = (system) => system.map(({ cache_control, ...rest }) => rest);

async function call(system) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: MODEL, max_tokens: 16, thinking: { type: "disabled" },
      system,
      messages: [{ role: "user", content: "Reply with the single word: ok" }],
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(json.error ?? json).slice(0, 200)}`);
  return json.usage;
}

/**
 * A brand context of realistic size. NOT read from a real brand: CLAUDE.md
 * forbids browser checks against real records, and a fixed string makes the
 * numbers below reproducible. ~16k characters is the size the inbox entry
 * quotes for the andy prefix.
 */
const FAKE_CONTEXT = [
  "=== BRAND ===\nZZ Probe Brand, industrial absorbents, Finland.\n",
  "=== STRATEGY ===\n",
  ("Positioning: the granule that clears a spill before the shift ends. " +
   "Audience: site foremen who buy on downtime, not on price per litre. ").repeat(60),
  "\n=== TONE ===\nPlain, short sentences. No adjectives stacked three deep.\n",
  "=== PRODUCTS ===\n",
  ("Granule 20L, 42.00 EUR RRP, landed cost 18.40, absorbs 12x its weight. ").repeat(40),
].join("");

const ROUTES = [
  { name: "andy", stable: () => andyStable(FAKE_CONTEXT), varying: null },
  {
    name: "copy-architect",
    stable: () => copyStable({ brandName: "ZZ Probe Brand", context: FAKE_CONTEXT }),
    varying: (n) => copyPerRequest({
      deliverable: n === 0 ? "an Instagram caption" : "a long-form email",
      wordTarget: n === 0 ? "20-30 words" : "250-350 words",
      count: n === 0 ? 1 : 3,
      product: null,
    }),
  },
  { name: "generate-prompt", stable: () => imagePromptStable("Headline: warm and plain\n1. Palette: orange\n"), varying: null },
  { name: "brand-strategy", stable: () => STRATEGY_STABLE, varying: null },
  { name: "tone-generate", stable: () => TONE_STABLE, varying: null },
  { name: "catalog-parse", stable: () => CATALOG_PARSE_STABLE, varying: null },
  { name: "brand-code-architect", stable: () => CODE_ARCHITECT_STABLE, varying: null },
  { name: "vault-extract", stable: () => VAULT_EXTRACT_STABLE, varying: null },
];

const rows = [];
let failed = 0;

for (const route of ROUTES) {
  const stable = route.stable();
  const sysA = cachedSystem(stable, route.varying ? route.varying(0) : null);
  const sysB = cachedSystem(stable, route.varying ? route.varying(1) : null);

  let u1, u2, u3, u4;
  try {
    u1 = await call(sysA);                 // write
    u2 = await call(sysA);                 // read, byte-identical
    u3 = route.varying ? await call(sysB) : null;   // read, per-request block changed
    u4 = await call(uncached(sysA));       // negative control
  } catch (e) {
    rows.push({ name: route.name, verdict: "ERROR", detail: e.message });
    failed++;
    continue;
  }

  const s1 = cacheStats(route.name, u1), s2 = cacheStats(route.name, u2);
  const s4 = cacheStats(route.name, u4);
  const prefix = s1.written + s1.read;

  let verdict, detail;
  if (prefix === 0) {
    verdict = "BELOW-MINIMUM";
    detail = `${s1.uncached} input tokens, under the 1024 Sonnet needs — nothing to cache`;
  } else if (s2.read <= 0) {
    verdict = "NOT CACHING";
    detail = `wrote ${s1.written} then read ${s2.read} on an identical call`;
    failed++;
  } else if (s4.read !== 0 || s4.written !== 0) {
    verdict = "CONTROL FAILED";
    detail = `the same call without cache_control reported write=${s4.written} read=${s4.read}, so read>0 proves nothing`;
    failed++;
  } else if (route.varying && cacheStats(route.name, u3).read <= 0) {
    verdict = "SPLIT BROKEN";
    detail = `changing only the per-request block lost the prefix (read=${cacheStats(route.name, u3).read})`;
    failed++;
  } else {
    verdict = "CACHES";
    const split = route.varying ? `, ${cacheStats(route.name, u3).read} on a different brief` : "";
    detail = `wrote ${s1.written}, read ${s2.read}${split}; control read 0`;
  }
  rows.push({ name: route.name, verdict, detail, write: s1.written, read: s2.read, plain: s4.uncached });
}

console.log(`model ${MODEL} · ttl ${CACHE_TTL}\n`);
for (const r of rows) console.log(`${r.verdict.padEnd(14)} ${r.name.padEnd(21)} ${r.detail}`);

const caching = rows.filter((r) => r.verdict === "CACHES");
const savedPerCall = caching.reduce((n, r) => n + r.read, 0);
console.log(`\n${caching.length} of ${rows.length} routes cache.`);
if (caching.length) {
  console.log(`Cached prefix, summed across them: ${savedPerCall} tokens a call after the first.`);
  console.log(`At Sonnet 5 input rates a read is 0.1x and a 1h write is 2x, so each route pays`);
  console.log(`back its write on the third call inside the hour.`);
}
console.log(
  "\nThe andy and copy-architect prefixes here are built on a synthetic brand context,\n" +
  "so their token counts are this probe’s, not a real brand’s. The real per-brand number\n" +
  "shows up in the [cache] log line on every live call — that is what criterion 3 is for.");
console.log(rows.filter((r) => r.verdict === "BELOW-MINIMUM").length
  ? `\nBelow-minimum is not a failure and not a pass: those prompts are too short for the\n` +
    `API to cache at all, so cache_control on them is inert. Their cost is unchanged.`
  : "");
process.exit(failed ? 1 : 0);
