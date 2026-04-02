import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const PROMPT = `Analyse these brand images as a world-class creative director and photo editor. Extract exactly 30 visual datapoints. Return ONLY valid JSON, no markdown, no explanation.

JSON structure:
{"headline":"one punchy sentence capturing the visual identity","datapoints":[{"n":"01","label":"Lighting style","value":"concise value"}, ...30 items]}

The 30 datapoints in order:
01 Lighting style, 02 Light direction, 03 Colour temperature, 04 Main palette, 05 Accent colour, 06 Saturation level, 07 Colour grading, 08 Contrast, 09 Gradient usage, 10 Film grain / texture, 11 Lens feel, 12 Focal length, 13 Depth of field, 14 Camera angle, 15 Composition rule, 16 Subject placement, 17 Negative space usage, 18 Shadow style, 19 Atmosphere, 20 Mood, 21 Energy / vibe, 22 Scene type, 23 Environment, 24 Expression style, 25 Wardrobe aesthetic, 26 Cultural references, 27 Reference photographers, 28 Reference brands, 29 What to never do, 30 Hidden visual rule.

Keep each value 5-10 words. Be like a Vogue editor describing the work.`;

export async function POST(req: NextRequest) {
  try {
    const { images } = await req.json();

    if (!images || !Array.isArray(images) || images.length < 4 || images.length > 10) {
      return NextResponse.json({ error: "Send 4-10 base64 JPEG images" }, { status: 400 });
    }

    const content: Record<string, unknown>[] = [];

    for (const base64String of images.slice(0, 8)) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: base64String,
        },
      });
    }

    content.push({ type: "text", text: PROMPT });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic error:", err);
      return NextResponse.json({ error: `Analysis failed: ${err.slice(0, 200)}` }, { status: 500 });
    }

    const data = await response.json();
    const textBlock = data.content?.find((b: { type: string }) => b.type === "text");
    const raw = textBlock?.text || "{}";

    // Extract JSON
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not parse analysis" }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error) {
    console.error("analyse-images error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
