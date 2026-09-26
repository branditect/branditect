import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { cachedSystem, logCacheUsage } from "@/lib/prompt-cache";
import { STRATEGY_STABLE, STRATEGY_FROM_DOCUMENT_STABLE } from "@/lib/prompts";
import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { reserveMeter, brandOfUser, BudgetRefused, ProviderError, refusalBody, requestLocale, type Lease } from "@/lib/metering";
import { estimateCents, anthropicCostCents, promptChars } from "@/lib/usage-cost";
import { answerLanguageDirective, strategyLanguage } from "@/lib/answer-language";

// Analysis plus a full strategy is a real amount of generation, and this is
// the worst place in the product to time out: the founder has answered
// twenty questions to get here. copy-architect already takes 120 for less.
export const maxDuration = 120;

// maxRetries: 0 — meter() owns the one retry (hq-accounts.md criterion 7).
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0 });

const MODEL = "claude-sonnet-5";
// The analysis block is new output, not free. 6000 truncated the JSON
// once the method was added, and a truncated object fails to parse and
// is thrown away whole.
const MAX_TOKENS = 12000;

export async function POST(req: NextRequest) {
  /*
    Signed in, or nothing happens.

    This route spends money on every call. Left open it is an uncapped model
    bill for anyone who finds the URL, and nothing about it would look wrong —
    no data leaves, the graph just climbs.
  */
  const auth = await requireUser(req)
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })
  // The budget belongs to a brand; no brand, nothing to charge it to.
  const brandId = await brandOfUser(auth.userId)

  try {
    const body = await req.json();
    const {
      answers,
      category,
      existingText,
      source,
    }: {
      answers: Record<string, string>;
      category: string;
      existingText?: string;
      /**
       * "paste" or "pdf" when these answers were read out of a strategy the founder
       * already had. It changes which rules the model gets, and that is the
       * whole difference between showing them their strategy and showing them
       * a strategy: see STRATEGY_FROM_DOCUMENT_STABLE.
       */
      source?: "questionnaire" | "paste" | "pdf";
    } = body;

    const fromDocument = source === "paste" || source === "pdf";

    const contentBlocks: Anthropic.Messages.ContentBlockParam[] = [];

    let userText = "";

    if (existingText && existingText.trim()) {
      userText += `Here is an existing brand strategy document. Analyze it and restructure it into the JSON format specified.\n\nBRAND STRATEGY:\n${existingText.slice(0, 6000)}\n\n`;
    }

    if (category) {
      userText += `Business category: ${category}\n\n`;
    }

    const answeredQuestions = Object.entries(answers || {}).filter(([, a]) => a && a.trim());
    if (answeredQuestions.length > 0) {
      userText += "QUESTIONNAIRE ANSWERS:\n\n";
      for (const [question, answer] of answeredQuestions) {
        const parts = question.split("|");
        const section = parts.length > 1 ? parts[0] : "General";
        const questionText = parts.length > 1 ? parts[1] : question;
        userText += `[${section.toUpperCase()}]\n${questionText}\n→ ${answer}\n\n`;
      }
    }

    if (!existingText?.trim() && answeredQuestions.length === 0) {
      return new Response(JSON.stringify({ error: "Please provide either a brand strategy or answer the questionnaire." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    userText += fromDocument
      // No "complete", and no "create". Asking for a complete strategy is
      // asking for the missing two thirds to be written, which is exactly what
      // this mode exists to prevent.
      ? "\nRestructure ONLY what is above into the JSON object. Leave every field the input does not support empty: \"\" for a string, [] for a list. Do not add an audience, a competitor, a pillar, a principle, a boundary or a tagline that is not in the input. Leave \"analysis\" empty as well: the working-out belongs to a strategy you wrote, not to one you are reading. Return ONLY the JSON object."
      : "\nCreate a complete brand strategy. Return ONLY the JSON object. Keep all text fields concise.";

    /*
      The language the strategy comes back in. This route had none, so a
      founder working in Finnish could get an English strategy from the
      Strategy page. Same rule as strategy-generate: the founder's own words
      (answers, or the strategy she pasted) decide when they are clear, and the
      interface language decides when they are not (lib/answer-language.ts).
    */
    const language = strategyLanguage(
      [...answeredQuestions.map(([, a]) => a), existingText ?? ""],
      requestLocale(req),
    );
    userText += answerLanguageDirective(language);

    contentBlocks.push({ type: "text", text: userText });

    const params: Anthropic.MessageCreateParamsNonStreaming = {
      model: MODEL,
      // Sonnet 5 runs adaptive thinking when `thinking` is omitted, and
      // max_tokens caps thinking + text together — these calls would
      // truncate. None of them need reasoning tokens.
      thinking: { type: "disabled" },
      max_tokens: MAX_TOKENS,
      system: cachedSystem(fromDocument ? STRATEGY_FROM_DOCUMENT_STABLE : STRATEGY_STABLE),
      messages: [{ role: "user", content: contentBlocks }],
    };

    /*
      Reserve before the response starts, so a refusal is a real 402 and not a
      message inside a 200 stream. The lease is spent inside the stream and
      settled when it ends, against the usage the final message reports.
    */
    let lease: Lease;
    try {
      lease = await reserveMeter({
        route: "brand-strategy",
        brandId,
        userId: auth.userId,
        estimateCents: estimateCents({ model: MODEL, inputChars: promptChars(params.system, params.messages), maxOutputTokens: MAX_TOKENS }),
        locale: requestLocale(req),
      });
    } catch (e) {
      if (e instanceof BudgetRefused) {
        return new Response(JSON.stringify(refusalBody(e)), {
          status: e.status,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw e;
    }

    // Use streaming to avoid Vercel timeout.
    // Create a readable stream that sends chunks to the client
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          const fullText = await lease.run(async () => {
            // Once a byte has reached the browser a retry cannot un-send it:
            // from then on a failure is final (400 is never retried).
            let sent = false;
            try {
              const stream = client.messages.stream(params);
              let text = "";
              for await (const event of stream) {
                // message_start is where a streamed call reports its cache numbers.
                if (event.type === "message_start") {
                  logCacheUsage(fromDocument ? "brand-strategy-document" : "brand-strategy", event.message.usage);
                }
                if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                  text += event.delta.text;
                  // Send each chunk as a SSE-style message
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: event.delta.text })}\n\n`));
                  sent = true;
                }
              }
              const final = await stream.finalMessage();
              return {
                value: text,
                model: MODEL,
                costCents: anthropicCostCents(MODEL, final.usage),
                inputTokens: final.usage.input_tokens,
                outputTokens: final.usage.output_tokens,
              };
            } catch (err) {
              if (sent) throw new ProviderError(err instanceof Error ? err.message : "Stream error", 400);
              throw err;
            }
          });

          // Send the final complete message
          // Extract JSON from full text
          let jsonString = fullText.trim();
          jsonString = jsonString.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
          const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
          if (jsonMatch) jsonString = jsonMatch[0];

          try {
            JSON.parse(jsonString); // validate
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, strategy: jsonString })}\n\n`));
          } catch {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, error: "AI returned incomplete response. Please try again." })}\n\n`));
          }

          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Stream error";
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, error: msg })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    console.error("Brand strategy error:", error);
    const msg = error instanceof Error ? error.message : "Failed to generate strategy";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
