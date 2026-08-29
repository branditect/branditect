/**
 * What each logo slot is for, and how to check it works.
 *
 * Usage copy is product copy, not a database column: it should change with a
 * deploy rather than needing every brand to write it.
 *
 * The slot values here are the ones the database actually holds — `primary`,
 * `dark`, `white`, `icon`. The spec was written against `primary_light`,
 * `primary_dark`, `symbol`, `mono`, `wordmark`, which no row uses; those names
 * are kept below as aliases so data written later still lands in the right
 * card instead of falling through to All files.
 */

export type PlateKind = "light" | "dark" | "check";

export interface SlotDef {
  slot: string;
  label: string;
  /** One line of usage guidance under the name. */
  usage: string;
  /**
   * Fixed per slot, and not a style choice — it is how you check a reversed
   * logo actually works. A white logo on a white plate is invisible, which is
   * the point.
   */
  plate: PlateKind;
  /** The corner tag on the plate. */
  tag: string;
}

export const SLOTS: SlotDef[] = [
  {
    slot: "primary",
    label: "Primary logo",
    usage: "The default. Use this unless there's a reason not to.",
    plate: "light",
    tag: "On light",
  },
  {
    slot: "dark",
    label: "Primary, reversed",
    usage: "For dark backgrounds and photography.",
    plate: "dark",
    tag: "On dark",
  },
  {
    slot: "white",
    label: "White / mono",
    usage: "One colour. For print, embroidery and anything single-ink.",
    plate: "dark",
    tag: "On dark",
  },
  {
    slot: "icon",
    label: "Symbol only",
    usage: "Favicons, app icons, avatars. Under 24px the wordmark stops being readable.",
    plate: "check",
    tag: "Transparent",
  },
];

/** Names the spec used that the data does not, mapped onto the ones it does. */
const ALIASES: Record<string, string> = {
  primary_light: "primary",
  "primary-light": "primary",
  primary_dark: "dark",
  "primary-dark": "dark",
  reversed: "dark",
  symbol: "icon",
  "icon-mark": "icon",
  mark: "icon",
  mono: "white",
  wordmark: "primary",
  "primary-logo": "primary",
};

export function canonicalSlot(slot: string | null | undefined): string | null {
  if (!slot) return null;
  const s = slot.trim().toLowerCase();
  const mapped = ALIASES[s] ?? s;
  return SLOTS.some((d) => d.slot === mapped) ? mapped : null;
}

export function slotDef(slot: string | null | undefined): SlotDef | null {
  const s = canonicalSlot(slot);
  return s ? (SLOTS.find((d) => d.slot === s) ?? null) : null;
}

/**
 * Section 1. A situation, and the file that answers it.
 *
 * The fourth card in the reference — "someone outside the company needs it" —
 * copies the kit link, which does not exist yet. It is deliberately absent
 * rather than rendered dead.
 */
export interface UseCase {
  id: string;
  question: string;
  slot: string;
  answer: string;
  note: string;
  /** Home gradient, in reference order. */
  tone: "a" | "b" | "c";
}

export const USE_CASES: UseCase[] = [
  {
    id: "light",
    question: "I'm putting it on a white page",
    slot: "primary",
    answer: "Primary, on light",
    note: "SVG for screen, PNG for everything else",
    tone: "a",
  },
  {
    id: "dark",
    question: "It's going on a photo or a dark background",
    slot: "dark",
    answer: "Primary, reversed",
    note: "Reversed, never the light one recoloured",
    tone: "b",
  },
  {
    id: "small",
    question: "It needs to be tiny — favicon, app icon, avatar",
    slot: "icon",
    answer: "Symbol only",
    note: "Under 24px the wordmark stops being readable",
    tone: "c",
  },
];

/** "Deklan_logo_white.svg" → "SVG". Null when the name carries no extension. */
export function formatOf(fileName: string | null | undefined, stored?: string | null): string | null {
  if (stored && stored.trim()) return stored.trim().toUpperCase();
  if (!fileName) return null;
  const parts = fileName.split(".");
  if (parts.length < 2) return null;
  const ext = parts[parts.length - 1].trim().toLowerCase();
  return /^[a-z0-9]{2,4}$/.test(ext) ? ext.toUpperCase() : null;
}
