/**
 * WCAG contrast, computed at render and never stored.
 *
 * A stored ratio goes stale the moment the hex changes, and a contrast badge
 * that lies is worse than no badge — it is the difference between a colour you
 * can set text in and one you can only fill a shape with.
 *
 * Everything here is measured against white, which is what the page renders
 * swatches on and what most brand copy sits on.
 */

export type ContrastLevel = "AAA" | "AA" | "large" | "surface";

export interface Contrast {
  /** Rounded to one decimal, the way the badge shows it. */
  ratio: number;
  level: ContrastLevel;
  /** The badge text. */
  label: string;
}

export const WHITE = "#ffffff";

/** "#f0562a" | "f0562a" | "#f52" → [240, 86, 42], or null if it is not a hex colour. */
export function parseHex(hex: string): [number, number, number] | null {
  if (typeof hex !== "string") return null;
  let h = hex.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** WCAG 2.x relative luminance. The 0.03928 branch is the sRGB gamma cutoff. */
export function relativeLuminance(hex: string): number | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number | null {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  if (la === null || lb === null) return null;
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return (light + 0.05) / (dark + 0.05);
}

export function levelFor(ratio: number): ContrastLevel {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "large";
  return "surface";
}

const LABELS: Record<ContrastLevel, string> = {
  AAA: "AAA on white",
  AA: "AA on white",
  // Slightly unwelcome, and useful. Hiding it is how brands ship unreadable
  // buttons.
  large: "Large text only",
  surface: "Surface only",
};

/** Null when the value is not a plain hex — a gradient has no single ratio. */
export function contrastOnWhite(hex: string): Contrast | null {
  const raw = contrastRatio(hex, WHITE);
  if (raw === null) return null;
  const ratio = Math.round(raw * 10) / 10;
  const level = levelFor(ratio);
  return { ratio, level, label: LABELS[level] };
}

/** Whether text on this colour should be white or ink. Used for the swatch chip. */
export function readableInkOn(hex: string): "#ffffff" | "#15151b" {
  const l = relativeLuminance(hex);
  if (l === null) return "#15151b";
  return l > 0.42 ? "#15151b" : "#ffffff";
}
