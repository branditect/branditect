import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { pastedText } = await req.json();

    if (!pastedText?.trim()) {
      return NextResponse.json({ error: "Please provide writing samples or brand text." }, { status: 400 });
    }

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: `You are a brand strategist. Analyse the writing samples provided and extract a complete tone of voice guideline. Return ONLY valid JSON, no markdown, no code fences.

JSON structure:
{
  "expression_label": "3-4 word tone label (e.g. Bold & Direct, Warm & Expert)",
  "expression_text": "2-3 sentence description of how this brand sounds",
  "pillars": [
    {"icon": "emoji", "name": "Pillar name", "desc": "One sentence description", "bullets": ["Specific guideline 1", "Specific guideline 2", "Specific guideline 3"]}
  ],
  "dos": ["Do this", "Do that", "Do this too"],
  "donts": ["Don't do this", "Don't do that"],
  "vocab_yes": ["word1", "word2", "word3", "word4", "word5"],
  "vocab_no": ["avoid1", "avoid2", "avoid3", "avoid4", "avoid5"],
  "touchpoints": [
    {"icon": "emoji", "name": "Channel name", "badge": "Short badge", "bad": "Example of wrong tone", "good": "Example of right tone"}
  ]
}

Generate exactly 4 pillars and 4 touchpoints (Website, Email, Social Media, Customer Service). Generate 5-8 dos, 5-8 donts, 6-10 vocab_yes, 6-10 vocab_no. Keep everything concise.`,
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
