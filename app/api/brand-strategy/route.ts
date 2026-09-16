import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { cachedSystem, logCacheUsage } from "@/lib/prompt-cache";
import { STRATEGY_STABLE, STRATEGY_FROM_DOCUMENT_STABLE } from "@/lib/prompts";

// Analysis plus a full strategy is a real amount of generation, and this is
// the worst place in the product to time out: the founder has answered
// twenty questions to get here. copy-architect already takes 120 for less.
export const maxDuration = 120;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
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
      ? "\nRestructure ONLY what is above into the JSON object. Leave every field the input does not support empty: \"\" for a string, [] for a list. Do not add personas, competitors, pillars or taglines that are not in the input. Return ONLY the JSON object."
      : "\nCreate a complete brand strategy. Return ONLY the JSON object. Keep all text fields concise.";

    contentBlocks.push({ type: "text", text: userText });

    // Use streaming to avoid Vercel timeout
    const stream = await client.messages.stream({
      model: "claude-sonnet-5",
      // Sonnet 5 runs adaptive thinking when `thinking` is omitted, and
      // max_tokens caps thinking + text together — these calls would
      // truncate. None of them need reasoning tokens.
      thinking: { type: "disabled" },
      // The analysis block is new output, not free. 6000 truncated the JSON
      // once the method was added, and a truncated object fails to parse and
      // is thrown away whole.
      max_tokens: 12000,
      system: cachedSystem(fromDocument ? STRATEGY_FROM_DOCUMENT_STABLE : STRATEGY_STABLE),
      messages: [{ role: "user", content: contentBlocks }],
    });

    // Create a readable stream that sends chunks to the client
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          let fullText = "";

          for await (const event of stream) {
            // message_start is where a streamed call reports its cache numbers.
            if (event.type === "message_start") {
              logCacheUsage(fromDocument ? "brand-strategy-document" : "brand-strategy", event.message.usage);
            }
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              fullText += event.delta.text;
              // Send each chunk as a SSE-style message
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: event.delta.text })}\n\n`));
            }
          }

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
