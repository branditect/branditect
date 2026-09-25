import { NextRequest, NextResponse } from "next/server";
import { requireUser } from '@/lib/api-auth'
import { meter, brandOfUser, BudgetRefused, ProviderError, refusalBody, requestLocale } from "@/lib/metering";
import { estimateCents, anthropicCostCents, promptChars } from "@/lib/usage-cost";

export const maxDuration = 60;

const MODEL = "claude-sonnet-5";
const MAX_TOKENS = 2000;

const PROMPT = `Analyse these brand images as a world-class creative director and photo editor. Extract exactly 30 visual datapoints. Return ONLY valid JSON, no markdown, no explanation.

JSON structure:
{"headline":"one punchy sentence capturing the visual identity","datapoints":[{"n":"01","label":"Lighting style","value":"concise value"}, ...30 items]}

The 30 datapoints in order:
01 Lighting style, 02 Light direction, 03 Colour temperature, 04 Main palette, 05 Accent colour, 06 Saturation level, 07 Colour grading, 08 Contrast, 09 Gradient usage, 10 Film grain / texture, 11 Lens feel, 12 Focal length, 13 Depth of field, 14 Camera angle, 15 Composition rule, 16 Subject placement, 17 Negative space usage, 18 Shadow style, 19 Atmosphere, 20 Mood, 21 Energy / vibe, 22 Scene type, 23 Environment, 24 Expression style, 25 Wardrobe aesthetic, 26 Cultural references, 27 Reference photographers, 28 Reference brands, 29 What to never do, 30 Hidden visual rule.

Keep each value 5-10 words. Be like a Vogue editor describing the work.`;

export async function POST(req: NextRequest) {
  /*
    Signed in, or nothing happens.

    This route spends money on every call. Left open it is an uncapped model
    bill for anyone who finds the URL, and nothing about it would look wrong —
    no data leaves, the graph just climbs.
  */
  const auth = await requireUser(req)
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })
  // The budget belongs to a brand; no brand, nothing to charge it to.
  const brandId = await brandOfUser(auth.userId)

  // No key is a pre-flight failure: checked before anything is reserved.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("analyse-images: ANTHROPIC_API_KEY is not set");
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }

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

    const request = {
      model: MODEL,
      // Sonnet 5 runs adaptive thinking when `thinking` is omitted, and
      // max_tokens caps thinking + text together — these calls would
      // truncate. None of them need reasoning tokens.
      thinking: { type: "disabled" },
      max_tokens: MAX_TOKENS,
      messages: [{ role: "user", content }],
    };

    let data;
    try {
      data = await meter(
        {
          route: "brand/analyse-images",
          brandId,
          userId: auth.userId,
          estimateCents: estimateCents({
            model: MODEL,
            inputChars: promptChars(request.messages),
            images: content.length - 1,
            maxOutputTokens: MAX_TOKENS,
          }),
          locale: requestLocale(req),
        },
        async () => {
          const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify(request),
          });
          if (!response.ok) {
            const err = await response.text();
            console.error("Anthropic error:", err);
            throw new ProviderError(`Analysis failed: ${err.slice(0, 200)}`, response.status);
          }
          const body = await response.json();
          return {
            value: body,
            model: MODEL,
            costCents: anthropicCostCents(MODEL, body.usage),
            inputTokens: body.usage?.input_tokens,
            outputTokens: body.usage?.output_tokens,
          };
        },
      );
    } catch (e) {
      if (e instanceof BudgetRefused) return NextResponse.json(refusalBody(e), { status: e.status });
      if (e instanceof ProviderError) return NextResponse.json({ error: e.message }, { status: 500 });
      throw e;
    }
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
