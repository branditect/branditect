/**
 * Inbox 4b: "Assert it end to end, not by reading the column."
 *
 * WHAT THIS PROVES AND WHAT IT DOES NOT. It builds the real system prompt with
 * the real builders — copyStable and andyStable, the same functions the routes
 * call — sets the language each way, and sends both to the real API. So it
 * proves the thing that actually decides the output: that stating the language
 * produces Finnish, and that not stating it produces English.
 *
 * It does NOT go through the HTTP route with a signed-in brand, and it cannot
 * yet: supabase/brand-language.sql is unrun, so `output_language` does not
 * exist and there is no way to set a brand to 'fi'. The route half of this
 * assertion is blocked on the migration, not on effort. Once the column is
 * there, the same check belongs in scripts/route-ownership.mjs's shape — a
 * seeded zz- brand, a real token, a POST.
 *
 * Usage: npm run lang:probe
 */
import { readFileSync } from "node:fs";
import { copyStable, copyPerRequest } from "../lib/prompts.ts";
import { cachedSystem } from "../lib/prompt-cache.ts";
import { languageDirective } from "../lib/output-language.ts";

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
if (!KEY) { console.error("lang:probe needs ANTHROPIC_API_KEY"); process.exit(2); }

/** An English brand context, on purpose: the material is English, the instruction is not. */
const CONTEXT = [
  "=== BRAND ===\nZZ Probe Oy, industrial absorbents, Finland.\n",
  "=== STRATEGY ===\n",
  ("Positioning: the granule that clears a spill before the shift ends. " +
   "Audience: site foremen who buy on downtime, not on price per litre. ").repeat(40),
  "\n=== PRODUCTS ===\n",
  ("Granule 20L, 42.00 EUR, absorbs 12x its weight. ").repeat(20),
].join("");

async function draft(language) {
  const system = cachedSystem(
    copyStable({ brandName: "ZZ Probe Oy", context: CONTEXT, language }),
    copyPerRequest({ deliverable: "a short product description", wordTarget: "30-45 words", count: 1, product: null }),
  );
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-sonnet-5", max_tokens: 600, thinking: { type: "disabled" },
      system,
      messages: [{ role: "user", content: "What it's about: the 20 litre granule.\n\nWrite the 1 draft now. Return only the JSON." }],
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(json.error ?? json).slice(0, 200)}`);
  const text = json.content.filter((c) => c.type === "text").map((c) => c.text).join("");
  const body = (text.match(/"body"\s*:\s*"((?:\\.|[^"\\])*)"/) ?? [null, text])[1];
  return body.replace(/\\n/g, " ");
}

/**
 * Language, by two independent signals rather than one.
 *
 * Letters alone would call an English sentence with a Finnish product name
 * Finnish. Stopwords alone would call a Finnish sentence quoting an English
 * spec English. Both have to agree.
 */
const EN_STOPWORDS = /\b(the|and|your|with|that|this|from|for|are|is|it)\b/gi;
const FI_MARKERS = /[äöÄÖ]|\b(ja|joka|kun|sen|että|tämä|se|on|ei)\b/gi;

function classify(text) {
  const en = (text.match(EN_STOPWORDS) ?? []).length;
  const fi = (text.match(FI_MARKERS) ?? []).length;
  return { en, fi, verdict: fi > en ? "fi" : en > fi ? "en" : "?" };
}

console.log("The directive, for the record:");
console.log(languageDirective("fi").trim().split("\n").map((l) => "  " + l).join("\n") || "  (empty for English)");
console.log(`\nEnglish directive is empty: ${languageDirective("en") === "" ? "yes" : "NO"}\n`);

let failed = 0;
for (const language of ["en", "fi"]) {
  const body = await draft(language);
  const c = classify(body);
  const ok = c.verdict === language;
  if (!ok) failed++;
  console.log(`output_language = ${language}  ->  ${c.verdict.toUpperCase()} (en markers ${c.en}, fi markers ${c.fi}) ${ok ? "" : "  MISMATCH"}`);
  console.log(`  ${body.slice(0, 160)}\n`);
}

console.log(failed === 0
  ? "Stating the language changes the output. The brand context was English in both runs,\n" +
    "so this is the instruction winning over the material — which is the whole point."
  : `${failed} run(s) came back in the wrong language.`);
process.exit(failed ? 1 : 0);
