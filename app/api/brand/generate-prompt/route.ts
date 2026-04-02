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

    const systemPrompt = `PERMANENT RULES — ALWAYS APPLY THESE, NO EXCEPTIONS:

Rule 1 — No named references:
Never mention photographer names, artist names, director names, clothing brand names, or any other named intellectual property in the prompt. Do not write things like "in the style of [photographer]" or "wearing [brand] clothing" or "shot like [director]". Instead describe the STYLE in plain visual language.
Examples of what to do instead:
- Instead of "Tyler Mitchell style" → write "warm golden-hour editorial light, saturated skin tones, joyful candid energy"
- Instead of "wearing Nike" → write "wearing a bold orange athletic jacket with clean white sole sneakers"
- Instead of "shot like a Vogue editorial" → write "high-fashion editorial composition, sharp subject against clean background, magazine-quality lighting"
Describe what it looks like, not who made it.

Rule 3 — Colour and saturation restraint:
Brand DNA often uses words like vibrant, bold, saturated, and colourful. These words mean something very different in AI image generation than in brand strategy. Always translate brand language into calibrated technical photography language. Specific rules:

- Never use the words "vibrant", "saturated", "bold colours", or "vivid" in the prompt — these push generators to over-saturate everything globally.

- Instead, always specify a film stock reference for colour rendering. Choose based on the scene:
  People and lifestyle → "Kodak Portra 400 colour rendering"
  Outdoor and landscape → "Fujifilm Pro 400H film profile"
  Product and studio → "Kodak Ektar 100 colour rendering"
  Dark/moody studio → "clean digital colour science, accurate skin tones"

- For the "one colour pops" principle: describe it technically. Write: "subject wearing [colour] against a neutral, slightly desaturated background — single colour accent, environment tones kept clean and restrained". Never write: "bold pop of colour against vibrant background".

- Skin tones: always include "natural skin tone rendering, no orange push, no skin saturation boost"

- For outdoor images: always include "colour temperature 4000K" or "colour temperature 3500K golden hour" rather than "warm tones" alone

- End every prompt with: "Colour grade: natural and restrained, slight lift in shadows, no crushed blacks, no blown highlights, no artificial saturation boost. Film-like tonal range."

Rule 4 — Realism over style:
The goal is always a photograph that looks like it was taken by a real photographer on a real shoot — not an AI image. Always include: "photorealistic, camera photograph, not illustrated, not CGI, not AI-generated aesthetic, authentic documentary feel". This must appear in every prompt.

Rule 2 — Always enforce professional photo quality:
Every prompt MUST end with this exact technical quality block, always, no exceptions:
"Shot on a full-frame mirrorless camera, 85mm lens, f/1.8 aperture, ISO 200. Sharp focus on subject, tack-sharp details, zero motion blur. Professional studio-grade lighting or controlled natural light — no dark shadows, no underexposure, no harsh midday flat light. Skin tones natural and well-exposed. Commercial photography quality."

---

You are an expert brand image prompt engineer. You write precise, detailed prompts that AI image generators respond to exceptionally well. You always stay true to the brand visual DNA when provided.

BRAND VISUAL DNA:
${dnaContext}

LIGHTING RULE: The lighting description must ALWAYS specify bright, controlled, professional-grade light. If the brand DNA says golden hour, describe it as "warm golden hour light with clear directional sun, well-exposed subject, no harsh shadows". Never allow the prompt to produce underlit, dark, or poorly exposed results. Every image must look like it was shot by a top commercial photographer with full lighting control.

Return ONLY valid JSON with exactly these keys:
- prompt: Complete image generation prompt, 120-160 words. Include subject, action, environment, lighting (direction and quality — always bright and professional), film stock colour rendering (Rule 3), lens/camera feel, composition, mood adjectives, realism statement (Rule 4), colour grade statement (Rule 3), technical quality block (Rule 2), and --ar flag. Do NOT include any named people, photographers, brands, or IP (Rule 1). Do NOT use "vibrant", "saturated", "bold colours", or "vivid" (Rule 3).
- negativePrompt: 30-40 words of exclusions including brand-specific ones from DNA. Always include: "dark, underexposed, harsh shadows, flat lighting, blurry, out of focus, low quality, grainy, amateur, poorly lit, oversaturated, artificial colours, CGI, illustrated, AI-generated look".
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
