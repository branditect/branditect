import { NextRequest, NextResponse } from "next/server";
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
      images,
    }: {
      answers: Record<string, string>;
      category: string;
      existingText?: string;
      images?: { base64: string; type: string }[];
    } = body;

    const contentBlocks: Anthropic.Messages.ContentBlockParam[] = [];

    // Add images if provided (max 3)
    if (images && images.length > 0) {
      for (const img of images.slice(0, 3)) {
        contentBlocks.push({
          type: "image",
          source: {
            type: "base64",
            media_type: img.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: img.base64,
          },
        });
      }
    }

    // Build user text
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
      return NextResponse.json({ error: "Please provide either a brand strategy or answer the questionnaire." }, { status: 400 });
    }

    userText += "\nCreate a complete brand strategy. Return ONLY the JSON object. Keep all text fields concise to ensure the full JSON is returned.";

    contentBlocks.push({ type: "text", text: userText });

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: contentBlocks }],
    });

    const rawText = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as Anthropic.TextBlock).text)
      .join("");

    // Extract JSON robustly
    let jsonString = rawText.trim();
    jsonString = jsonString.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    // Validate JSON
    try {
      JSON.parse(jsonString);
    } catch {
      console.error("Strategy JSON parse failed. First 500 chars:", jsonString.slice(0, 500));
      console.error("Last 200 chars:", jsonString.slice(-200));
      return NextResponse.json({ error: "AI returned incomplete response. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ strategy: jsonString });
  } catch (error: unknown) {
    console.error("Brand strategy error:", error);
    const msg = error instanceof Error ? error.message : "Failed to generate strategy";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
