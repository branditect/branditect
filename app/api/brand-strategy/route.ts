import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a senior brand strategist with 20+ years of experience building brands for startups, scale-ups, and category-defining companies. You combine sharp strategic thinking with creative flair. You write with clarity, conviction, and a point of view — never generic filler.

When given questionnaire answers, synthesize them into a comprehensive, actionable brand strategy document. Draw insights the founder may not have articulated. Be specific, not vague. Every recommendation should feel earned by the data provided.

USE THIS EXACT STRUCTURE:

# [BRAND NAME] — Brand Strategy

## Executive Summary
## 1. Brand Positioning (Positioning Statement, Only-We Claim, Category Frame, Why This Wins)
## 2. Target Audience (Primary Persona with name, Secondary if needed, Who We Exclude)
## 3. Competitive Landscape (Market Position, Key Differentiators, Competitive Moat)
## 4. Brand Identity System (Visual Identity Direction, Brand Personality, Brand Archetype)
## 5. Messaging Architecture (Master Brand Narrative, Brand Pillars x3, Tagline Options x3)
## 6. Brand Voice & Tone (Voice Characteristics, Tone Spectrum, Channel Guidance, Language Rules)
## 7. Brand Architecture
## 8. Strategic Risks & Opportunities
## 9. Brand Governance (Brand Health Metrics, Review Cadence)

Write in Markdown. Use headers, bold, bullets, and numbered lists for clarity. Be thorough but never padded — every sentence should earn its place.`;

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
      "\nNow synthesize all of the above into a complete brand strategy using the exact structure specified.";

    contentBlocks.push({ type: "text", text: userText });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: contentBlocks }],
    });

    const strategy =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ strategy });
  } catch (error: unknown) {
    console.error("Brand strategy generation error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate strategy";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
