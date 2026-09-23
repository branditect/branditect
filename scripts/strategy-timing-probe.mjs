/**
 * How long does building a strategy actually take?
 *
 * The questionnaire ended in "your answers are saved, but the strategy could
 * not be built: 504". A 504 is the platform cutting the function off, not the
 * model refusing — app/api/strategy-generate/route.ts declares
 * `maxDuration = 60`, and nothing in the code says whether the call needs 30
 * seconds or 120. Guessing a new number and shipping it is how this comes back
 * in a week, so measure it first.
 *
 * Reads real answers for a brand (read-only) and makes the same call the route
 * makes, timing it and reporting output tokens. Writes nothing.
 *
 * Käyttö: node scripts/strategy-timing-probe.mjs <brand_id> [maxTokens]
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const brandId = process.argv[2] ?? "omistajatieto-f66b";
const maxTokens = Number(process.argv[3] ?? 6000);

const env = {};
for (const l of readFileSync(".env.local", "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

// The route's system prompt, read from source so the two cannot drift.
const src = readFileSync("lib/prompts.ts", "utf8");
const start = src.indexOf("export const STRATEGY_STABLE = `");
const system = src.slice(start + "export const STRATEGY_STABLE = `".length, src.indexOf("`;", start));

const { data: onboarding } = await svc
  .from("onboarding").select("answers, voice").eq("brand_id", brandId).maybeSingle();
const answers = onboarding?.answers ?? {};
const answered = Object.entries(answers).filter(([, a]) => typeof a === "string" && a.trim());
if (answered.length === 0) { console.log("No answers for", brandId); process.exit(1); }

let userText = "QUESTIONNAIRE ANSWERS:\n\n";
for (const [key, answer] of answered) userText += `[Q${key}] ${key}\n→ ${answer}\n\n`;
userText += "\nCreate a complete brand strategy. Return ONLY the JSON object. Keep all text fields concise.";

console.log(`brand ${brandId}: ${answered.length} answers, ${userText.length} chars in, max_tokens ${maxTokens}`);

const t0 = Date.now();
let first = null;
let out = "";
const stream = await client.messages.stream({
  model: "claude-sonnet-5",
  thinking: { type: "disabled" },
  max_tokens: maxTokens,
  system,
  messages: [{ role: "user", content: [{ type: "text", text: userText }] }],
});
stream.on("text", (t) => { if (first === null) first = Date.now() - t0; out += t; });
const final = await stream.finalMessage();
const total = Date.now() - t0;

console.log(`first token   ${(first / 1000).toFixed(1)}s`);
console.log(`complete      ${(total / 1000).toFixed(1)}s`);
console.log(`output tokens ${final.usage.output_tokens} (stop: ${final.stop_reason})`);
console.log(`chars out     ${out.length}`);
console.log(total > 60000
  ? `\nOVER the route's 60s limit by ${((total - 60000) / 1000).toFixed(1)}s — a 504 is expected, not a fluke.`
  : `\nInside 60s with ${((60000 - total) / 1000).toFixed(1)}s to spare.`);
