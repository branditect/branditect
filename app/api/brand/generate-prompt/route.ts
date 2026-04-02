import { NextRequest, NextResponse } from "next/server";

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

    const systemPrompt = `You are an expert brand image prompt engineer. You write precise, detailed prompts that AI image generators respond to exceptionally well. You always stay true to the brand visual DNA when provided.

BRAND VISUAL DNA:
${dnaContext}

Return ONLY valid JSON with exactly these keys:
- prompt: Complete image generation prompt, 100-140 words. Include subject, action, environment, lighting (direction and quality), colour treatment, lens/camera feel, composition, mood adjectives, photographer style reference if relevant, and --ar flag.
- negativePrompt: 30-40 words of exclusions including brand-specific ones from DNA.
- tip: One sentence about which tool and setting gets best results for this image type.`;

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
        model: "claude-sonnet-4-20250514",
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic error:", err);
      return NextResponse.json({ error: "Prompt generation failed" }, { status: 500 });
    }

    const data = await response.json();
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
