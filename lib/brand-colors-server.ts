import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { COLOR_PROMPT, parseExtractedColors, type ColorMediaType, type ExtractedColor } from "./brand-colors.ts";

/**
 * Asking a model for a brand's colours.
 *
 * Split from brand-colors.ts because that half is unit-tested and this half
 * cannot be: `server-only` throws the moment the test runner imports it, and
 * the API key has no business in a client bundle.
 */

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/** Returns [] rather than throwing: no colours found is an answer. */
export async function extractColors(
  bytes: Buffer,
  mediaType: ColorMediaType,
  already: string[] = [],
): Promise<ExtractedColor[]> {
  const data = bytes.toString("base64");
  const source =
    mediaType === "application/pdf"
      ? ({ type: "document", source: { type: "base64", media_type: "application/pdf", data } } as const)
      : ({ type: "image", source: { type: "base64", media_type: mediaType, data } } as const);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-5",
    // Sonnet 5 runs adaptive thinking when `thinking` is omitted, and
    // max_tokens caps thinking and reply together: this would truncate.
    thinking: { type: "disabled" },
    max_tokens: 2048,
    messages: [{ role: "user", content: [source, { type: "text", text: COLOR_PROMPT }] }],
  });

  const block = message.content.find((b) => b.type === "text");
  return parseExtractedColors(block && "text" in block ? block.text : "[]", already);
}
