import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { COLOR_PROMPT, parseExtractedColors, type ColorMediaType, type ExtractedColor } from "./brand-colors.ts";
import type { Attempt } from "./metering.ts";
import { anthropicCostCents, estimateCents, pdfPageCount } from "./usage-cost.ts";

/**
 * Asking a model for a brand's colours.
 *
 * Split from brand-colors.ts because that half is unit-tested and this half
 * cannot be: `server-only` throws the moment the test runner imports it, and
 * the API key has no business in a client bundle.
 *
 * Metered by the caller. extractColors() is one provider attempt in the shape
 * meter() takes, so a route cannot call it without deciding which budget it
 * spends: `meter({ route, ..., estimateCents: colorEstimateCents(...) },
 * () => extractColors(...))`. maxRetries: 0 because meter() owns the retry.
 */

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0 });

const MODEL = "claude-sonnet-5";
const MAX_TOKENS = 2048;

/** Upper-bound cost of one extractColors() call on these bytes. */
export function colorEstimateCents(bytes: Buffer, mediaType: ColorMediaType): number {
  const isPdf = mediaType === "application/pdf";
  return estimateCents({
    model: MODEL,
    inputChars: COLOR_PROMPT.length,
    images: isPdf ? 0 : 1,
    pdfPages: isPdf ? pdfPageCount(bytes) : 0,
    maxOutputTokens: MAX_TOKENS,
  });
}

/** One provider call. Its value is [] rather than a throw when no colours
 *  are found: no colours found is an answer. */
export async function extractColors(
  bytes: Buffer,
  mediaType: ColorMediaType,
  already: string[] = [],
): Promise<Attempt<ExtractedColor[]>> {
  const data = bytes.toString("base64");
  const source =
    mediaType === "application/pdf"
      ? ({ type: "document", source: { type: "base64", media_type: "application/pdf", data } } as const)
      : ({ type: "image", source: { type: "base64", media_type: mediaType, data } } as const);

  const message = await anthropic.messages.create({
    model: MODEL,
    // Sonnet 5 runs adaptive thinking when `thinking` is omitted, and
    // max_tokens caps thinking and reply together: this would truncate.
    thinking: { type: "disabled" },
    max_tokens: MAX_TOKENS,
    messages: [{ role: "user", content: [source, { type: "text", text: COLOR_PROMPT }] }],
  });

  const block = message.content.find((b) => b.type === "text");
  return {
    value: parseExtractedColors(block && "text" in block ? block.text : "[]", already),
    model: MODEL,
    costCents: anthropicCostCents(MODEL, message.usage),
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
}
