/**
 * Studio ▸ Write — the model behind the brief panel.
 *
 * Ported from branditect-ui/spec/studio-write.md. Pure data and pure
 * functions only, so the route, the page and the test suite all read the same
 * definitions and none of them import a Supabase client to do it.
 *
 * This replaces lib/copy-architect-config.ts, whose NAV_ITEMS shape was
 * categories containing dropdowns containing field maps. Two required answers
 * cannot be expressed in that model.
 */

import { sanitiseOutput } from "./sanitise-output.ts";

export type FormatId = "ad" | "email" | "instagram" | "linkedin" | "product" | "customer" | "other";
export type Length = "short" | "medium" | "long";

export interface FormatDef {
  id: FormatId;
  label: string;
  /** What the model is asked to produce. */
  deliverable: string;
  /** CSS module class carrying the Home gradient. */
  tone: string;
  /** components/icon.tsx name. */
  icon: string;
  /** Word targets per length. A LinkedIn post and an ad are not the same "medium". */
  words: Record<Length, string>;
  /** Three tappable briefs. Criterion 3: switching format changes these. */
  examples: string[];
}

export const FORMATS: FormatDef[] = [
  {
    id: "ad",
    label: "Ad copy",
    deliverable: "an advertisement: a hook, the body, and one call to action",
    tone: "ad",
    icon: "megaphone",
    words: { short: "15 to 25 words", medium: "30 to 45 words", long: "60 to 90 words" },
    examples: [
      "The new SORBIFY OIL launch",
      "A price change, going out to distributors",
      "Why we cost less than the category leader",
    ],
  },
  {
    id: "email",
    label: "Email",
    deliverable: "an email: a subject line, then the body, then a sign-off",
    tone: "email",
    icon: "mail",
    words: { short: "60 to 90 words", medium: "120 to 180 words", long: "250 to 350 words" },
    examples: [
      "Warehouse closed for maintenance next week",
      "A restock notice for people who asked",
      "Introducing a new size to existing customers",
    ],
  },
  {
    id: "instagram",
    label: "Instagram caption",
    deliverable: "an Instagram caption: a first line that survives the truncation, then the rest",
    tone: "instagram",
    icon: "instagram",
    words: { short: "15 to 25 words", medium: "35 to 60 words", long: "80 to 120 words" },
    examples: [
      "Behind the absorbency test",
      "A before and after from a customer site",
      "The new SORBIFY OIL launch",
    ],
  },
  {
    id: "linkedin",
    label: "LinkedIn post",
    deliverable: "a LinkedIn post: an opening line that earns the click, then the point",
    tone: "linkedin",
    icon: "linkedin",
    words: { short: "50 to 80 words", medium: "110 to 170 words", long: "220 to 320 words" },
    examples: [
      "What we learned testing to 800 km",
      "Why we publish the products we can't help",
      "A hire, or a milestone",
    ],
  },
  {
    id: "product",
    label: "Product description",
    deliverable: "a product description: what it is, what it does, and who it is for",
    tone: "product",
    icon: "bag",
    words: { short: "30 to 50 words", medium: "70 to 110 words", long: "150 to 220 words" },
    examples: [
      "A full description for SORBIFY OIL",
      "A short version for a distributor's catalogue",
      "A listing for a new size in the range",
    ],
  },
  {
    id: "customer",
    label: "Customer message",
    deliverable:
      "a direct message to a customer: what happened, what it means for them, and what happens next",
    tone: "customer",
    icon: "help",
    words: { short: "30 to 50 words", medium: "70 to 110 words", long: "140 to 200 words" },
    examples: [
      "Warehouse closed for maintenance next week",
      "A reply to a delivery complaint",
      "An order delay, with the new date",
    ],
  },
  {
    id: "other",
    label: "Something else — tell us what",
    deliverable: "the format the user named",
    tone: "other",
    icon: "plus",
    words: { short: "short, around 40 words", medium: "around 120 words", long: "around 280 words" },
    examples: [
      "A press note about the new range",
      "A short script for a product video",
      "A reply to a distributor asking for terms",
    ],
  },
];

export const FORMAT_IDS = FORMATS.map((f) => f.id);

export function findFormat(id: string | null | undefined): FormatDef | undefined {
  return FORMATS.find((f) => f.id === id);
}

/**
 * Customer message is not marketing copy.
 *
 * A maintenance notice or a complaint reply obeys tone of voice and the facts
 * and must not reach for positioning. Everything else gets the full set.
 * Criterion 9 asserts the exclusions.
 */
export type ContextLayer =
  | "profile"
  | "tone"
  | "boundaries"
  | "positioning"
  | "key_messages"
  | "pillars"
  | "product"
  | "pricing";

const FULL_CONTEXT: ContextLayer[] = [
  "profile",
  "tone",
  "boundaries",
  "positioning",
  "key_messages",
  "pillars",
  "product",
  "pricing",
];

const REDUCED_CONTEXT: ContextLayer[] = ["profile", "tone", "boundaries", "product"];

export function contextLayersFor(format: string): ContextLayer[] {
  return format === "customer" ? [...REDUCED_CONTEXT] : [...FULL_CONTEXT];
}

/** A brief this short still generates — it just earns a chip saying so. */
export const THIN_BRIEF_WORDS = 3;

export function isThinBrief(brief: string): boolean {
  return brief.trim().split(/\s+/).filter(Boolean).length < THIN_BRIEF_WORDS;
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export interface ProvenanceItem {
  claim: string;
  source: string;
}

export interface Draft {
  body: string;
  provenance: ProvenanceItem[];
}

/**
 * Criterion 8. Every draft body passes through here before it reaches the UI
 * or the database — the prompt asks for plain text, this is what guarantees it.
 * Provenance claims are prose too and get the same treatment; sources are field
 * names and are left alone.
 */
export function normaliseDraft(raw: unknown): Draft | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const body = typeof r.body === "string" ? sanitiseOutput(r.body) : "";
  if (!body) return null;

  const provenance = Array.isArray(r.provenance)
    ? r.provenance
        .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
        .map((p) => ({
          claim: sanitiseOutput(String(p.claim ?? "")),
          source: String(p.source ?? "").trim(),
        }))
        .filter((p) => p.claim && p.source)
    : [];

  return { body, provenance };
}
