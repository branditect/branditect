import { NextRequest, NextResponse } from "next/server";
import { cachedSystem, logCacheUsage } from "@/lib/prompt-cache";
import { imagePromptStable } from "@/lib/prompts";
import { requireUser } from '@/lib/api-auth'
import { meter, brandOfUser, BudgetRefused, ProviderError, refusalBody, requestLocale } from "@/lib/metering";
import { estimateCents, anthropicCostCents, promptChars } from "@/lib/usage-cost";

export const maxDuration = 30;

const MODEL = "claude-sonnet-5";
const MAX_TOKENS = 1200;

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
    console.error("generate-prompt: ANTHROPIC_API_KEY is not set");
    return NextResponse.json({ error: "Prompt generation failed" }, { status: 500 });
  }

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

    const request = {
      model: MODEL,
      // Sonnet 5 runs adaptive thinking when `thinking` is omitted, and
      // max_tokens caps thinking + text together — these calls would
      // truncate. None of them need reasoning tokens.
      thinking: { type: "disabled" },
      max_tokens: MAX_TOKENS,
      system: cachedSystem(imagePromptStable(dnaContext)),
      messages: [{ role: "user", content: userMessage }],
    };

    const data = await meter(
      {
        route: "brand/generate-prompt",
        brandId,
        userId: auth.userId,
        estimateCents: estimateCents({ model: MODEL, inputChars: promptChars(request.system, request.messages), maxOutputTokens: MAX_TOKENS }),
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
          throw new ProviderError("Prompt generation failed", response.status);
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
    if (error instanceof BudgetRefused) return NextResponse.json(refusalBody(error), { status: error.status });
    console.error("generate-prompt error:", error);
    return NextResponse.json({ error: "Prompt generation failed" }, { status: 500 });
  }
}
