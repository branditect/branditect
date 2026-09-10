import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { cachedSystem, logCacheUsage } from "@/lib/prompt-cache";
import { STRATEGY_STABLE } from "@/lib/prompts";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      answers,
      category,
      existingText,
    }: {
      answers: Record<string, string>;
      category: string;
      existingText?: string;
    } = body;

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

    userText += "\nCreate a complete brand strategy. Return ONLY the JSON object. Keep all text fields concise.";

    contentBlocks.push({ type: "text", text: userText });

    // Use streaming to avoid Vercel timeout
    const stream = await client.messages.stream({
      model: "claude-sonnet-5",
      // Sonnet 5 runs adaptive thinking when `thinking` is omitted, and
      // max_tokens caps thinking + text together — these calls would
      // truncate. None of them need reasoning tokens.
      thinking: { type: "disabled" },
      max_tokens: 6000,
      system: cachedSystem(STRATEGY_STABLE),
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
            if (event.type === "message_start") logCacheUsage("brand-strategy", event.message.usage);
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
