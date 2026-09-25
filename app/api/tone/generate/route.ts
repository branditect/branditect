import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { cachedSystem, logCacheUsage } from "@/lib/prompt-cache";
import { TONE_STABLE } from "@/lib/prompts";
import { requireUser } from '@/lib/api-auth'
import { reserveMeter, brandOfUser, BudgetRefused, ProviderError, refusalBody, requestLocale, type Lease } from "@/lib/metering";
import { estimateCents, anthropicCostCents, promptChars } from "@/lib/usage-cost";

export const maxDuration = 60;

// maxRetries: 0 — meter() owns the one retry (hq-accounts.md criterion 7).
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0 });

const MODEL = "claude-sonnet-5";
const MAX_TOKENS = 4000;

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
    const { pastedText } = await req.json();

    if (!pastedText?.trim()) {
      return NextResponse.json({ error: "Please provide writing samples or brand text." }, { status: 400 });
    }

    const params: Anthropic.MessageCreateParamsNonStreaming = {
      model: MODEL,
      // Sonnet 5 runs adaptive thinking when `thinking` is omitted, and
      // max_tokens caps thinking + text together — these calls would
      // truncate. None of them need reasoning tokens.
      thinking: { type: "disabled" },
      max_tokens: MAX_TOKENS,
      system: cachedSystem(TONE_STABLE),
      messages: [{
        role: "user",
        content: `Analyse these writing samples and extract the brand tone of voice:\n\n${pastedText.slice(0, 5000)}`
      }],
    };

    /*
      Reserve before the response starts, so a refusal is a real 402 and not a
      message inside a 200 stream. The lease is spent inside the stream and
      settled when it ends, against the usage the final message reports.
    */
    let lease: Lease;
    try {
      lease = await reserveMeter({
        route: "tone/generate",
        brandId,
        userId: auth.userId,
        estimateCents: estimateCents({ model: MODEL, inputChars: promptChars(params.system, params.messages), maxOutputTokens: MAX_TOKENS }),
        locale: requestLocale(req),
      });
    } catch (e) {
      if (e instanceof BudgetRefused) return NextResponse.json(refusalBody(e), { status: e.status });
      throw e;
    }

    // Stream to avoid timeout
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
                if (event.type === "message_start") logCacheUsage("tone-generate", event.message.usage);
                if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                  text += event.delta.text;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: true })}\n\n`));
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
              if (sent) throw new ProviderError(err instanceof Error ? err.message : "Generation failed", 400);
              throw err;
            }
          });

          let jsonString = fullText.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
          const match = jsonString.match(/\{[\s\S]*\}/);
          if (match) jsonString = match[0];

          try {
            const parsed = JSON.parse(jsonString);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, tone: parsed })}\n\n`));
          } catch {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, error: "AI returned invalid format." })}\n\n`));
          }
          controller.close();
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, error: err instanceof Error ? err.message : "Generation failed" })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to generate";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
