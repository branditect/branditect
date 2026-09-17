import { normaliseHex } from "./visual-identity.ts";

/**
 * Reading a brand's colours out of the document that defines them.
 *
 * A brand guideline prints its palette on a page with the hex codes beside it.
 * That is the whole reason to ask for the PDF: everything a founder would
 * otherwise type into the colour form is already in there, correctly.
 *
 * The pure half: the prompt, and what to do with the answer. The call itself
 * is in brand-colors-server.ts, which carries the API key and so carries
 * `server-only` with it — this half is imported by tests, which cannot load a
 * server-only module.
 */

export type ExtractedColor = { hex: string; name: string; usage: string };

export const COLOR_PROMPT = `Analyze this document/image and extract ALL brand colors you can find. For each color return:
- hex: the hex color code (e.g. "#E8562A")
- name: a descriptive color name (e.g. "Brand Orange")
- usage: how this color is used in the brand (e.g. "Primary accent, CTAs, headings")

Return ONLY a JSON array, no other text. Example:
[{"hex":"#E8562A","name":"Brand Orange","usage":"Primary accent color"},{"hex":"#1A1A1A","name":"Ink Black","usage":"Body text"}]

If you cannot find any colors, return an empty array: []`;

export type ColorMediaType =
  | "application/pdf" | "image/png" | "image/jpeg" | "image/gif" | "image/webp";

/** The media type for a file name, or null when it is not one we can read. */
export function colorMediaType(fileName: string, mime?: string | null): ColorMediaType | null {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf" || mime === "application/pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (mime?.startsWith("image/")) return "image/png";
  return null;
}

/**
 * What a model found, cleaned up.
 *
 * Kept separate from the call so the parsing is testable: a model that answers
 * with prose around the JSON, a hex without its hash, or a duplicate of a
 * colour already in the palette are all things that happen.
 */
export function parseExtractedColors(text: string, already: string[] = []): ExtractedColor[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  let raw: unknown;
  try {
    raw = JSON.parse(match[0]);
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];

  const seen = new Set(already.map((h) => normaliseHex(h)).filter(Boolean) as string[]);
  const out: ExtractedColor[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const hex = typeof row.hex === "string" ? normaliseHex(row.hex) : null;
    if (!hex || seen.has(hex)) continue;
    seen.add(hex);
    out.push({
      hex,
      name: typeof row.name === "string" && row.name.trim() ? row.name.trim() : hex.toUpperCase(),
      usage: typeof row.usage === "string" ? row.usage.trim() : "",
    });
  }
  return out;
}

/**
 * The object's path inside the bucket, read back out of its public URL.
 *
 * `brand_visual` has no column for it on the live database — the schema file
 * declares `guideline_storage_path` and the table does not have it — and a
 * public URL already contains the path after the bucket name. Query strings
 * are dropped: a signed or cache-busted URL still names the same object.
 */
export function storagePathFromUrl(url: string | null, bucket = "brand-assets"): string | null {
  if (!url) return null;
  const marker = `/${bucket}/`;
  const at = url.indexOf(marker);
  if (at < 0) return null;
  const path = url.slice(at + marker.length).split("?")[0].trim();
  return path || null;
}
