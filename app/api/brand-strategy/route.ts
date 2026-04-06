import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a senior brand strategist with 20+ years experience. You create sharp, specific, actionable brand strategies. No generic filler. Every recommendation must feel earned by the input provided.

Whether you receive questionnaire answers OR a pasted brand strategy document, your job is the same: synthesize it into a complete structured brand strategy.

CRITICAL RULES:
1. Return ONLY valid JSON — no markdown, no code fences, no extra text
2. Fill every field with specific content — no empty strings or placeholders
3. Keep descriptions concise (1-3 sentences each) to stay within token limits
4. Generate exactly: 2 personas, 3 competitors, 3 messaging pillars, 3 voice do/dont pairs, 3 taglines, 3 risks, 3 opportunities, 3 problems, 3 differentiators

Return this JSON structure:

{
  "brandName": "string",
  "category": "string",
  "stage": "string",
  "target": "string",
  "archetype": "string",
  "passport": {
    "signature": "7 words max",
    "purpose": "1-2 sentences",
    "promise": "1 sentence",
    "philosophy": "1 sentence",
    "values": "comma-separated values",
    "insight": "1 sentence",
    "targetGroup": "1-2 sentences",
    "onlyWeClaim": "1 sentence starting with Only..."
  },
  "pyramid": {
    "essence": "3-5 words",
    "behavior": "2 sentences on personality and relationship",
    "whyChooseUs": "2-3 sentences with rational and emotional reasons",
    "audience": "2 sentences on target, segment, insight",
    "market": "1-2 sentences",
    "context": "2 sentences"
  },
  "problems": [{"title":"short","text":"1-2 sentences"}],
  "solution": "2-3 sentences",
  "firstTo": {"claim":"We are the first to...","explanation":"1 sentence"},
  "onlyOnesWho": {"claim":"We are the only ones who...","explanation":"1 sentence"},
  "differentiators": [{"label":"D1","title":"short","text":"1 sentence"}],
  "personas": [{"name":"Name","role":"Title","type":"primary","emoji":"emoji","who":"2 sentences","wants":"1-2 sentences","frustrations":"1-2 sentences","channels":["channel1","channel2"],"activeChannels":["top1","top2"],"brandGives":"1 sentence"}],
  "exclusions": "1-2 sentences",
  "competitiveIntro": "2 sentences",
  "competitors": [{"name":"string","type":"string","doWell":"1 sentence","fail":"1 sentence","vsUs":"1 sentence","isUs":false}],
  "messagingPillars": [{"title":"string","text":"1-2 sentences"}],
  "voiceDescription": "2-3 sentences",
  "voiceDoDont": [{"do":"example phrase","dont":"example phrase"}],
  "alwaysUse": ["word1","word2","word3"],
  "neverUse": ["word1","word2","word3"],
  "risks": [{"title":"short","text":"1-2 sentences with mitigation"}],
  "opportunities": [{"title":"short","text":"1-2 sentences"}],
  "taglines": [{"text":"The tagline","rationale":"1 sentence"}]
}`;

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
      model: "claude-sonnet-4-20250514",
      max_tokens: 6000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: contentBlocks }],
    });

    // Create a readable stream that sends chunks to the client
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          let fullText = "";

          for await (const event of stream) {
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
