/**
 * Studio ▸ Create images — the brief, and the prompt built from it.
 *
 * Pure. The route calls this, the tests call this, and nothing here reaches a
 * network or a database — which is what lets the merge-blocking criteria be
 * asserted rather than eyeballed.
 *
 * The rule that matters most: a product's identity goes into the prompt, and
 * its commercials never do. Price, cost, margin, floor price and discount are
 * not image direction, and a model that sees them will happily write them onto
 * a label.
 */

import { decideAccess } from "./ownership.ts";
import { translate, type StringKey, type Vars } from "./i18n/index.ts";

export type Where = "studio" | "indoors" | "outdoors";
export type Format = "1:1" | "4:5" | "9:16" | "16:9";

export const WHERES: Where[] = ["studio", "indoors", "outdoors"];
export const FORMATS: Format[] = ["1:1", "4:5", "9:16", "16:9"];

export interface Brief {
  subject: string;
  where: Where;
  format: Format;
  productId: string | null;
  extra?: string;
}

/**
 * The only product fields an image prompt is allowed to see. Written as a
 * literal list rather than an omission of the unsafe ones: a new
 * `catalog_products` column must not become visible because nobody remembered
 * to exclude it.
 */
export const PRODUCT_FIELDS = ["name", "description", "category", "tags"] as const;

export interface ProductIdentity {
  name: string;
  description: string | null;
  category: string | null;
  /** Material or colour, when the row carries any. */
  tags: string | null;
}

/** Narrows a catalog_products row to the four fields above. Nothing else escapes. */
export function productIdentity(row: Record<string, unknown> | null | undefined): ProductIdentity | null {
  if (!row || typeof row !== "object") return null;
  const name = typeof row.name === "string" ? row.name.trim() : "";
  if (!name) return null;
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  return {
    name,
    description: str(row.description),
    category: str(row.category),
    tags: str(row.tags),
  };
}

/** 403 when the product is not this brand's. Never 404 — see decideAccess. */
export function decideProductAccess(callerBrandId: string | null, productBrandId: string | null | undefined) {
  return decideAccess(callerBrandId, productBrandId);
}

export const SCENE: Record<Where, string> = {
  studio: "a studio setup: controlled lighting, a clean seamless backdrop, nothing incidental in frame",
  indoors: "a real interior: a room someone uses, with the light that room actually has",
  outdoors: "outdoors, in daylight, in a real place rather than a set",
};

export interface PromptInput {
  brief: Brief;
  product: ProductIdentity | null;
  /** How many reference pictures are attached. */
  referenceCount: number;
}

export function isValidWhere(v: unknown): v is Where {
  return typeof v === "string" && (WHERES as string[]).includes(v);
}

export function isValidFormat(v: unknown): v is Format {
  return typeof v === "string" && (FORMATS as string[]).includes(v);
}

/**
 * Assembly order: style instruction, product identity, scene, subject, extra.
 *
 * `where` is scene CONTEXT, never an override. Someone who taps Outdoors and
 * writes "on a silver background" gets the silver background — the description
 * is what they actually asked for.
 *
 * There is no wardrobe line. The old route appended "They are wearing ${colour}"
 * to every request, which described a bottle as wearing yellow fabric. If
 * someone wants a yellow dress they write it in the subject.
 */
export function buildImagePrompt({ brief, product, referenceCount }: PromptInput): string {
  const parts: string[] = [];
  const many = referenceCount > 1;

  parts.push(
    `Generate a new photograph that matches the visual style of the attached reference ${many ? `images (${referenceCount})` : "image"}.`,
  );

  if (product) {
    const bits = [`The product is "${product.name}".`];
    if (product.category) bits.push(`Category: ${product.category}.`);
    if (product.description) bits.push(`What it is: ${product.description}`);
    if (product.tags) bits.push(`Material or colour: ${product.tags}.`);
    bits.push(
      `Keep this exact product: its label, its shape and its colour must match the reference photographs of it. Do not invent a different package.`,
      `Where the description below says "this product", "it" or names the item, it means "${product.name}".`,
    );
    parts.push(bits.join(" "));
  }

  parts.push(`Scene: ${SCENE[brief.where]}.`);
  parts.push(`Show: ${brief.subject.trim()}`);

  const extra = brief.extra?.trim();
  if (extra) parts.push(extra.endsWith(".") ? extra : `${extra}.`);

  // The description is the brief. Stated after the scene so it reads last.
  parts.push(
    `Where the scene and the description disagree, follow the description.`,
    `Match the reference${many ? "s" : ""} for light direction, light temperature, shadow softness, colour saturation, colour grading and contrast, so it looks like the same shoot.`,
    `Professional photography, sharp focus, natural tones.`,
    `Aspect ratio ${brief.format}.`,
  );

  return parts.join(" ");
}

export interface InlinePart { inline_data: { mime_type: string; data: string } }
export type PromptPart = { text: string } | InlinePart;

/**
 * Every reference is sent. The old route pushed `images[0]` and dropped the
 * rest while the UI offered three, which is a control that lies.
 */
export function buildParts(prompt: string, images: string[], mimeTypes?: (string | undefined)[]): PromptPart[] {
  const parts: PromptPart[] = [{ text: prompt }];
  images.forEach((data, i) => {
    if (!data) return;
    parts.push({ inline_data: { mime_type: mimeTypes?.[i] || "image/jpeg", data } });
  });
  return parts;
}

/**
 * What the button says when it cannot be pressed. Never a silent dead button.
 *
 * As a key, so the page can say it in the interface language. The English
 * functions below are the same decision read through the English dictionary,
 * which is what the tests and any server-side caller see.
 */
export function briefBlockerKey(referenceCount: number, subject: string): StringKey | null {
  if (referenceCount < 1) return "createImages.addReference";
  if (!subject.trim()) return "createImages.sayWhat";
  return null;
}

export function briefReadyKey(referenceCount: number): { key: StringKey; vars: Vars } {
  return referenceCount === 1
    ? { key: "createImages.readyOne", vars: {} }
    : { key: "createImages.readyMany", vars: { count: referenceCount } };
}

export function briefBlocker(referenceCount: number, subject: string): string | null {
  const key = briefBlockerKey(referenceCount, subject);
  return key ? translate("en", key) : null;
}

export function briefReady(referenceCount: number): string {
  const { key, vars } = briefReadyKey(referenceCount);
  return translate("en", key, vars);
}


export type Kind = "product" | "other";

export interface ReferenceLike { id: string; source: "knowledge" | "product" | "upload" }

/**
 * Criterion 1b. Switching to "Something else" removes the product's photos —
 * leaving them behind is how you generate a bottle nobody asked for. Anything
 * the user added themselves stays.
 */
export function refsAfterKindChange<T extends ReferenceLike>(refs: T[], kind: Kind): T[] {
  return kind === "other" ? refs.filter((r) => r.source !== "product") : refs;
}

/** What goes on the wire. "Something else" always sends null. */
export function productIdFor(kind: Kind, productId: string | null | undefined): string | null {
  return kind === "product" && productId ? productId : null;
}

/** A brand with a catalogue is usually photographing it. */
export function defaultKind(productCount: number): Kind {
  return productCount > 0 ? "product" : "other";
}

/** Studio when a product is selected, outdoors otherwise. */
export function defaultWhere(kind: Kind): Where {
  return kind === "product" ? "studio" : "outdoors";
}
