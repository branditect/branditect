import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a senior brand strategist with 20+ years of experience building brands for startups, scale-ups, and category-defining companies. You combine sharp strategic thinking with creative flair. You write with clarity, conviction, and a point of view — never generic filler.

When given questionnaire answers, synthesize them into a comprehensive, actionable brand strategy. Draw insights the founder may not have articulated. Be specific, not vague. Every recommendation should feel earned by the data provided.

CRITICAL: Return ONLY valid JSON. No markdown, no code fences, no explanation — just the raw JSON object.

Fill every field with specific, actionable content based on the questionnaire answers. Do not leave any field empty or use placeholder text.

Generate:
- 2-3 personas (at least one primary, one secondary)
- 3-5 competitors (the last entry should represent the user's brand with "isUs": true)
- 3 messaging pillars
- 2-3 message samples per channel (linkedin, email, ads, website, sales)
- 3 do/don't voice pairs
- 3 tagline options
- 3 risks and 3 opportunities
- 3-5 problems
- 3-4 differentiators

Return this exact JSON structure:

{
  "brandName": "string",
  "category": "string (e.g. Brand Intelligence SaaS)",
  "stage": "string (e.g. Launch / Category Creation)",
  "target": "string (e.g. B2B · 1–3 person marketing teams)",
  "archetype": "string (e.g. The Sage + The Magician)",

  "passport": {
    "signature": "7-word brand descriptor",
    "purpose": "Why this brand exists — one paragraph",
    "promise": "What the brand guarantees to every customer",
    "philosophy": "The belief system that drives every decision",
    "values": "Core values as a concise comma-separated list",
    "insight": "The key market insight that makes this brand inevitable",
    "targetGroup": "Precise description of the ideal customer",
    "onlyWeClaim": "The Only-We statement — what only this brand can claim"
  },

  "pyramid": {
    "essence": "The single word or short phrase at the core of the brand",
    "behavior": "Brand personality and the relationship it builds",
    "whyChooseUs": "Reasons to believe — rational and emotional benefits",
    "audience": "Target audience, key segments, and core insight",
    "market": "Primary and secondary market definitions",
    "context": "The larger competitive and cultural context"
  },

  "problems": [
    { "title": "Short problem title", "text": "Detailed problem description" }
  ],
  "solution": "One paragraph describing how the brand uniquely solves these problems",

  "firstTo": { "claim": "We are the first to...", "explanation": "Why this matters" },
  "onlyOnesWho": { "claim": "We are the only ones who...", "explanation": "Why this is defensible" },
  "differentiators": [
    { "label": "D1", "title": "Differentiator name", "text": "Explanation" }
  ],

  "personas": [
    {
      "name": "Full name",
      "role": "Job title / description",
      "type": "primary",
      "emoji": "Single emoji",
      "who": "Demographic and psychographic profile",
      "wants": "Goals and desires",
      "frustrations": "Pain points and frustrations",
      "channels": ["All channels they use"],
      "activeChannels": ["Channels where they are most active and engaged"],
      "brandGives": "What this brand specifically gives them"
    }
  ],
  "exclusions": "Describe who this brand is NOT for and why",

  "competitiveIntro": "Overview paragraph of the competitive landscape",
  "competitors": [
    {
      "name": "Competitor name",
      "type": "Direct / Indirect / Substitute",
      "doWell": "Their strengths",
      "fail": "Their weaknesses",
      "vsUs": "How we compare",
      "isUs": false
    }
  ],

  "messagingPillars": [
    { "title": "Pillar name", "text": "Pillar description and key messages" }
  ],
  "channelMessages": {
    "linkedin": [{ "format": "Post type", "pillar": "Related pillar", "body": "Full message text" }],
    "email": [{ "format": "Email type", "tone": "Tone description", "body": "Full message text" }],
    "ads": [{ "format": "Ad type", "pillar": "Related pillar", "body": "Full ad copy" }],
    "website": [{ "format": "Section name", "body": "Full copy" }],
    "sales": [{ "format": "Scenario", "persona": "Target persona", "body": "Full message text" }]
  },

  "voiceDescription": "A paragraph describing the brand voice — how it sounds, feels, and what makes it distinctive",
  "voiceDoDont": [
    { "do": "What the voice does", "dont": "What the voice avoids" }
  ],
  "alwaysUse": ["Words and phrases to always use"],
  "neverUse": ["Words and phrases to never use"],

  "risks": [{ "title": "Risk title", "text": "Risk description and mitigation" }],
  "opportunities": [{ "title": "Opportunity title", "text": "Opportunity description and how to seize it" }],

  "taglines": [
    { "text": "The tagline", "rationale": "Why this works" }
  ]
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

    // Build user message content blocks
    const contentBlocks: Anthropic.Messages.ContentBlockParam[] = [];

    // Add images if provided (max 3)
    if (images && images.length > 0) {
      const imagesToInclude = images.slice(0, 3);
      for (const img of imagesToInclude) {
        contentBlocks.push({
          type: "image",
          source: {
            type: "base64",
            media_type: img.type as
              | "image/jpeg"
              | "image/png"
              | "image/gif"
              | "image/webp",
            data: img.base64,
          },
        });
      }
    }

    // Build text from answers
    let userText = `Category: ${category}\n\n`;

    if (existingText) {
      userText += `EXISTING BRAND STRATEGY (refine and improve this):\n\n${existingText}\n\n---\n\nQUESTIONNAIRE ANSWERS:\n\n`;
    }

    for (const [question, answer] of Object.entries(answers)) {
      if (answer && answer.trim()) {
        // Extract section from the question key format "section|question"
        const parts = question.split("|");
        const section = parts.length > 1 ? parts[0] : "General";
        const questionText = parts.length > 1 ? parts[1] : question;
        userText += `[${section.toUpperCase()}]\n${questionText}\n→ ${answer}\n\n`;
      }
    }

    userText +=
      "\nNow synthesize all of the above into a complete brand strategy. Return ONLY the JSON object — no markdown, no code fences, no commentary.";

    contentBlocks.push({ type: "text", text: userText });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: contentBlocks }],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON from the response (handle potential code fences)
    let jsonString = rawText.trim();
    if (jsonString.startsWith("```")) {
      jsonString = jsonString.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    // Validate it's valid JSON
    JSON.parse(jsonString);

    // Return the JSON string — the page will parse it
    return NextResponse.json({ strategy: jsonString });
  } catch (error: unknown) {
    console.error("Brand strategy generation error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate strategy";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
