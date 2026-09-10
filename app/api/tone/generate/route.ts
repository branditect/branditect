import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { cachedSystem, logCacheUsage } from "@/lib/prompt-cache";
import { TONE_STABLE } from "@/lib/prompts";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { pastedText } = await req.json();

    if (!pastedText?.trim()) {
      return NextResponse.json({ error: "Please provide writing samples or brand text." }, { status: 400 });
    }

    const stream = await client.messages.stream({
      model: "claude-sonnet-5",
      // Sonnet 5 runs adaptive thinking when `thinking` is omitted, and
      // max_tokens caps thinking + text together — these calls would
      // truncate. None of them need reasoning tokens.
      thinking: { type: "disabled" },
      max_tokens: 4000,
      system: cachedSystem(TONE_STABLE),
      messages: [{
        role: "user",
        content: `Analyse these writing samples and extract the brand tone of voice:\n\n${pastedText.slice(0, 5000)}`
      }],
    });

    // Stream to avoid timeout
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          let fullText = "";
          for await (const event of stream) {
            // message_start is where a streamed call reports its cache numbers.
            if (event.type === "message_start") logCacheUsage("tone-generate", event.message.usage);
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              fullText += event.delta.text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: true })}\n\n`));
            }
          }

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
