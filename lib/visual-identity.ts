/**
 * The rules behind adding a logo, a colour or a typeface on Visual identity.
 *
 * Separate from components/visual-identity/uploads.tsx so they can be tested:
 * the test runner strips types but does not parse JSX.
 */

/** The four slots the page renders plates for. Upload targets one of them. */
export const UPLOAD_SLOTS = [
  { slot: "primary", label: "Primary", hint: "On light backgrounds" },
  { slot: "dark", label: "Reversed", hint: "On dark backgrounds" },
  { slot: "icon", label: "Symbol only", hint: "The mark without the wordmark" },
  { slot: "white", label: "White", hint: "On colour" },
] as const;

export const FONT_ROLES = [
  { id: "heading", label: "Headings" },
  { id: "body", label: "Body" },
  { id: "accent", label: "Accent" },
] as const;

/** A Google Fonts stylesheet URL for a family name. */
export function googleFontUrl(name: string): string {
  return `https://fonts.googleapis.com/css2?family=${name.trim().replace(/\s+/g, "+")}:wght@300;400;500;600;700&display=swap`;
}

/**
 * Normalise what someone types into a hex field.
 *
 * People paste "#AABBCC", "aabbcc", "AABBCC" and "#abc". Only the first is a
 * CSS colour; storing any of the others paints nothing, and the swatch renders
 * as an empty box with the right label under it — which reads as a rendering
 * bug rather than as bad input. Returns null when it is not a hex colour at
 * all, so the caller can say so instead of saving something unusable.
 */
export function normaliseHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(raw)) return null;
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  return "#" + full.toLowerCase();
}

/** The upload type the endpoint expects for a logo slot. */
export function logoUploadType(slot: string): string {
  return `logo_${slot}`;
}
