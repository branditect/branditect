/**
 * Turn the questionnaire into a strategy, and save it.
 *
 * THE MISSING HALF OF THE QUESTIONNAIRE. /start wrote every answer to the
 * `onboarding` row and stopped there: the last question routed to /home and
 * nothing ever produced a strategy, so Brand ▸ Strategy went on offering to
 * start a questionnaire that had already been answered. Reported as "I just
 * answered all strategy questions but I got no strategy" — with twenty answers
 * stored and zero rows in brand_strategies.
 *
 * It reads the answers server-side rather than taking them from the body: they
 * are already stored, and a client that could post its own answers could write
 * a strategy for a brand from text it made up.
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { serviceClient as supabase } from "@/lib/supabase-admin";
import { resolveBrand } from "@/lib/api-auth";
import { cachedSystem, logCacheUsage } from "@/lib/prompt-cache";
import { STRATEGY_STABLE } from "@/lib/prompts";
import { archiveAndInsert, supabaseStrategyStore } from "@/lib/strategy-versions";
import { forLocale } from "@/lib/onboarding-locale";
import { answerLanguageDirective, strategyLanguage } from "@/lib/answer-language";
import type { Track } from "@/lib/onboarding-questions";
import { meter, BudgetRefused, refusalBody, requestLocale } from "@/lib/metering";
import { estimateCents, anthropicCostCents, promptChars } from "@/lib/usage-cost";

/*
  300, not 60.

  A 60s ceiling produced "your answers are saved, but the strategy could not
  be built: 504" — the platform cutting the function off mid-generation, which
  reaches the person as a bare status code. Measured with
  scripts/strategy-timing-probe.mjs on 20 real answers: 33s to a complete
  reply, 3.4k output tokens. That fits inside 60s on a good run and does not
  on a slow one, which is exactly the shape of a failure that comes back
  intermittently. The heavy extraction routes already sit at 300.
*/
export const maxDuration = 300;
export const dynamic = "force-dynamic";

// maxRetries: 0 — meter() owns the one retry (hq-accounts.md criterion 7).
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0 });

const MODEL = "claude-sonnet-5";
const MAX_TOKENS = 6000;

/** The JSON the model returns, fished out of whatever it wrapped it in. */
function parseStrategyJson(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/^```(?:json)?/gm, "").replace(/```$/gm, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const auth = await resolveBrand(req);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const brandId = auth.brandId;
  if (!brandId) return NextResponse.json({ error: "No brand" }, { status: 400 });

  const { data: onboarding, error: readErr } = await supabase
    .from("onboarding").select("answers, voice, profile").eq("brand_id", brandId).maybeSingle();
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });

  const answers = (onboarding?.answers ?? {}) as Record<string, string>;
  const answered = Object.entries(answers).filter(([, a]) => typeof a === "string" && a.trim());
  // Nothing to build from is a 400 with a reason, not an empty strategy.
  if (answered.length === 0) {
    return NextResponse.json({ error: "No answers yet", errorKey: "strategy.nothingToBuild" }, { status: 400 });
  }

  const track = ((onboarding?.profile as { track?: Track } | null)?.track ?? "physical") as Track;
  const voice = (onboarding?.voice as { primary?: string; secondary?: string } | null) ?? null;

  /*
    The strategy comes back in the language the founder wrote in.

    Reported: every answer given in Finnish, strategy produced in English.
    `output_language` is not the column for this — that one decides what her
    customers read (lib/output-language.ts) and defaults to 'en', so most
    brands never chose it. A strategy is built out of the founder's own
    sentences, so those sentences decide.
  */
  // Clear answers decide; thin ones follow the interface (lib/answer-language.ts).
  const language = strategyLanguage(answered.map(([, a]) => a), requestLocale(req));

  // The model reads the question with its answer: "→ 12 words" is not an
  // answer to anything on its own. The question comes in the same language as
  // the answer, so a Finnish answer is not filed under an English question.
  let userText = "QUESTIONNAIRE ANSWERS:\n\n";
  for (const [key, answer] of answered) {
    const n = Number(key);
    const q = Number.isFinite(n) ? forLocale(n, track, language) : null;
    userText += `[Q${key}] ${q?.q ?? key}\n→ ${answer}\n\n`;
  }
  if (voice?.primary) {
    userText += `VOICE ARCHETYPE: ${voice.primary}${voice.secondary ? ` with ${voice.secondary}` : ""}\n\n`;
  }
  userText += "\nCreate a complete brand strategy. Return ONLY the JSON object. Keep all text fields concise.";
  userText += answerLanguageDirective(language);

  let text = "";
  const params: Anthropic.MessageCreateParamsNonStreaming = {
    model: MODEL,
    // Sonnet 5 runs adaptive thinking when `thinking` is omitted, and
    // max_tokens caps thinking and reply together: this would truncate.
    thinking: { type: "disabled" },
    max_tokens: MAX_TOKENS,
    system: cachedSystem(STRATEGY_STABLE),
    messages: [{ role: "user", content: [{ type: "text", text: userText }] }],
  };
  try {
    const message = await meter(
      {
        route: "strategy-generate",
        brandId,
        userId: auth.userId,
        estimateCents: estimateCents({ model: MODEL, inputChars: promptChars(params.system, params.messages), maxOutputTokens: MAX_TOKENS }),
        locale: requestLocale(req),
      },
      async () => {
        const m = await client.messages.create(params);
        return {
          value: m,
          model: MODEL,
          costCents: anthropicCostCents(MODEL, m.usage),
          inputTokens: m.usage.input_tokens,
          outputTokens: m.usage.output_tokens,
        };
      },
    );
    logCacheUsage("strategy-generate", message.usage);
    text = message.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
  } catch (e) {
    if (e instanceof BudgetRefused) return NextResponse.json(refusalBody(e), { status: e.status });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Generation failed", errorKey: "strategy.buildFailed" },
      { status: 502 },
    );
  }

  const parsed = parseStrategyJson(text);
  if (!parsed) {
    return NextResponse.json({ error: "Unreadable reply", errorKey: "strategy.buildFailed" }, { status: 502 });
  }

  // Numeric keys, like every other writer of this column.
  const numbered: Record<number, string> = {};
  for (const [key, answer] of answered) {
    const n = Number(key);
    if (Number.isFinite(n)) numbered[n] = answer;
  }

  const saved = await archiveAndInsert(supabaseStrategyStore(supabase), {
    brandId,
    userId: auth.userId,
    answers: numbered,
    // Nothing was extracted from a document, so nothing has a source sentence.
    provenance: {},
    source: "questionnaire",
    generatedStrategy: JSON.stringify(parsed),
  });
  if (!saved.ok) {
    return NextResponse.json(
      { error: saved.message, ...(saved.migration ? { errorKey: "intake.migrationMissing" } : {}) },
      { status: saved.status },
    );
  }

  return NextResponse.json({ ok: true, id: saved.id, version: saved.version, answers: answered.length });
}
