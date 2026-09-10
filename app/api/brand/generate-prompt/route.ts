import { NextRequest, NextResponse } from "next/server";
import { cachedSystem, logCacheUsage } from "@/lib/prompt-cache";
import { imagePromptStable } from "@/lib/prompts";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { inputs, dna } = await req.json();

    // Build DNA context string
    let dnaContext = "";
    if (dna?.headline) dnaContext += `Headline: ${dna.headline}\n`;
    if (dna?.datapoints) {
      for (const dp of dna.datapoints) {
        dnaContext += `${dp.n}. ${dp.label}: ${dp.value}\n`;
      }
    }

    const userMessage = `Generate an on-brand image prompt with these inputs:

Content format: ${inputs.format || "not specified"}
Subject: ${inputs.subject || "not specified"}
Age range: ${inputs.age || "not specified"}
Gender: ${inputs.gender || "not specified"}
Action: ${inputs.action || "not specified"}
Wardrobe and colours: ${inputs.wardrobe || "not specified"}
Mood and energy: ${inputs.mood || "not specified"}
Location and setting: ${inputs.location || "not specified"}
Other requests: ${inputs.other || "none"}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        // Sonnet 5 runs adaptive thinking when `thinking` is omitted, and
        // max_tokens caps thinking + text together — these calls would
        // truncate. None of them need reasoning tokens.
        thinking: { type: "disabled" },
        max_tokens: 1200,
        system: cachedSystem(imagePromptStable(dnaContext)),
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic error:", err);
      return NextResponse.json({ error: "Prompt generation failed" }, { status: 500 });
    }

    const data = await response.json();
    logCacheUsage("generate-prompt", data.usage);
    const textBlock = data.content?.find((b: { type: string }) => b.type === "text");
    const raw = textBlock?.text || "{}";

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not parse prompt" }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error) {
    console.error("generate-prompt error:", error);
    return NextResponse.json({ error: "Prompt generation failed" }, { status: 500 });
  }
}
