/**
 * "I already have a strategy": read the document, answer only what it answers.
 *
 * branditect-ui/spec/strategy-in-and-again.md part 1. This route does NOT save
 * anything. It reads, and hands back what it found with the sentence each
 * answer came from, so the founder can check every one before any of it
 * becomes their positioning. Saving is /api/strategy-intake, after the review.
 *
 * THE MODEL IS NOT TRUSTED TO OBEY THE PROMPT. It is told to quote, and then
 * every quote is checked against the source text here: anything it cannot
 * produce a real quote for is dropped before the founder ever sees it. A
 * prompt rule is a request; lib/strategy-intake.ts is the enforcement.
 *
 * Text extraction for uploads is /api/vault/extract and is not repeated here:
 * a documentId arrives already read, and this route uses the text it stored.
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { serviceClient as supabase } from "@/lib/supabase-admin";
import { resolveBrand } from "@/lib/api-auth";
import { cachedSystem, logCacheUsage, perRequest } from "@/lib/prompt-cache";
import { STRATEGY_EXTRACT_STABLE } from "@/lib/prompts";
import { QUESTIONS, forTrack, type Track } from "@/lib/onboarding-questions";
import { keepOnlySourced, dropUnquoted, intakeCounts } from "@/lib/strategy-intake";
import { meter, BudgetRefused, refusalBody, requestLocale } from "@/lib/metering";
import { estimateCents, anthropicCostCents, promptChars } from "@/lib/usage-cost";

// A strategy deck runs long and this is one pass over all of it.
export const maxDuration = 300;

// maxRetries: 0 — meter() owns the one retry (hq-accounts.md criterion 7).
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0 });

const MODEL = "claude-sonnet-5";
const MAX_TOKENS = 4000;

/** The voice questions are tiles, not prose, and Q19 is generated. */
const ASKABLE = QUESTIONS.filter((q) => q.kind === "text");

/** Enough of the document to hold a strategy, without paying for a whole book. */
const MAX_CHARS = 60_000;

export async function POST(req: NextRequest) {
  const auth = await resolveBrand(req);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  let body: { text?: string; documentId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }

  let text = (body.text ?? "").trim();
  let sourceDocumentId: string | null = null;

  if (body.documentId) {
    // Ownership first: a documentId from the body is a request to read a file,
    // and this route holds the service key.
    const { data: doc } = await supabase
      .from("brand_documents")
      .select("id, extracted_text, status, file_name")
      .eq("id", body.documentId)
      .eq("brand_id", auth.brandId)
      .maybeSingle();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // A row still being read has NULL text. Saying "we found nothing in your
    // strategy" over a file that has not been read yet is the lie this check
    // exists to prevent.
    if (!doc.extracted_text?.trim()) {
      return NextResponse.json(
        { error: "That document has not been read yet.", errorKey: "intake.documentNotReadYet", status: doc.status },
        { status: 409 },
      );
    }
    text = doc.extracted_text.trim();
    sourceDocumentId = doc.id;
  }

  if (text.length < 40) {
    return NextResponse.json(
      { error: "There is not enough text here to read.", errorKey: "intake.tooShort" },
      { status: 400 },
    );
  }
  const source = text.slice(0, MAX_CHARS);

  // The track decides the wording of a question, so the model is asked the
  // same question the founder would have been asked.
  const { data: onboarding } = await supabase
    .from("onboarding").select("profile").eq("brand_id", auth.brandId).maybeSingle();
  const track = ((onboarding?.profile as { track?: Track } | null)?.track ?? "physical") as Track;

  const questionList = ASKABLE
    .map((q) => `${q.n}. ${forTrack(q.q, track)}`)
    .join("\n");

  // The rules are the cached half and never vary. The questions and the
  // document are per request: the questions because their wording follows
  // the track, the document because it is the document.
  const params: Anthropic.MessageCreateParamsNonStreaming = {
    model: MODEL,
    // Sonnet 5 runs adaptive thinking when `thinking` is omitted, and
    // max_tokens caps thinking + text together — this call would truncate.
    thinking: { type: "disabled" },
    max_tokens: MAX_TOKENS,
    system: cachedSystem(
      STRATEGY_EXTRACT_STABLE,
      perRequest(`THE QUESTIONS\n\n${questionList}`),
    ),
    messages: [{
      role: "user",
      content: `THE DOCUMENT\n\n${source}\n\nReturn the JSON described in your instructions. Only questions this document answers. Every answer quoted.`,
    }],
  };

  try {
    const response = await meter(
      {
        route: "strategy-extract",
        brandId: auth.brandId,
        userId: auth.userId,
        estimateCents: estimateCents({ model: MODEL, inputChars: promptChars(params.system, params.messages), maxOutputTokens: MAX_TOKENS }),
        locale: requestLocale(req),
        refusalKind: "document",
      },
      async () => {
        const m = await anthropic.messages.create(params);
        return {
          value: m,
          model: MODEL,
          costCents: anthropicCostCents(MODEL, m.usage),
          inputTokens: m.usage.input_tokens,
          outputTokens: m.usage.output_tokens,
        };
      },
    );
    logCacheUsage("strategy-extract", response.usage);

    const raw = response.content.filter((b) => b.type === "text")
      .map((b) => (b as Anthropic.TextBlock).text).join("").trim();
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);

    let parsed: unknown;
    try {
      parsed = JSON.parse(match ? match[0] : cleaned);
    } catch {
      console.error("[strategy-extract] could not parse:", cleaned.slice(0, 400));
      return NextResponse.json(
        { error: "The reader returned something unreadable. Try again.", errorKey: "intake.unreadable" },
        { status: 502 },
      );
    }

    // Two filters, in this order: shape first, then evidence. The second is
    // the one that matters — it is what stops a paraphrase being presented as
    // a quotation from the founder's own document.
    const shaped = keepOnlySourced(parsed, ASKABLE);
    const { extraction, dropped } = dropUnquoted(shaped, source, ASKABLE);
    if (dropped.length) {
      console.warn(`[strategy-extract] dropped ${dropped.length} unquotable answer(s):`,
        dropped.map((d) => d.n).join(", "));
    }

    return NextResponse.json({
      found: extraction.found,
      missing: extraction.missing,
      dropped: dropped.length,
      counts: intakeCounts(extraction, ASKABLE),
      sourceDocumentId,
    });
  } catch (err) {
    if (err instanceof BudgetRefused) return NextResponse.json(refusalBody(err), { status: err.status });
    const message = err instanceof Error ? err.message : "Could not read the document";
    console.error("[strategy-extract]", message);
    return NextResponse.json({ error: message, errorKey: "intake.readFailed" }, { status: 500 });
  }
}
