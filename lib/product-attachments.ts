/**
 * Tagging media and documents to a product.
 *
 * Pure. The routes, the UI and the tests all read these definitions, so the
 * merge-blocking ownership rule is asserted rather than eyeballed.
 *
 * The database is `catalog_products`, not `products`, and `brand_id` is TEXT.
 * See supabase/product-attachments.sql for the three places the spec's DDL had
 * to be corrected against the live schema.
 */

import { decideAccess } from "./ownership.ts";

/** Set when tagging. Optional, and blank is fine. */
export type DocRole = "safety_sheet" | "spec" | "manual" | "certificate";

export const DOC_ROLES: { id: DocRole; label: string }[] = [
  { id: "safety_sheet", label: "Safety sheet" },
  { id: "spec", label: "Spec" },
  { id: "manual", label: "Manual" },
  { id: "certificate", label: "Certificate" },
];

export function docRoleLabel(role: string | null | undefined): string | null {
  return DOC_ROLES.find((r) => r.id === role)?.label ?? null;
}

export function isDocRole(v: unknown): v is DocRole {
  return typeof v === "string" && DOC_ROLES.some((r) => r.id === v);
}

/**
 * `brand_images` holds images and videos, told apart by `category`. A video
 * needs a play glyph and a duration badge rather than being shown as a still.
 */
export function isVideo(row: { category?: string | null; file_name?: string | null }): boolean {
  if (row.category === "video") return true;
  return /\.(mp4|mov|webm|m4v|avi)$/i.test(row.file_name ?? "");
}

/** "0:24". Null when nothing recorded the length. */
export function durationBadge(seconds: number | null | undefined): string | null {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** "2.1 MB". Documents are read by name and size, so the size has to be real. */
export function fileSize(bytes: number | null | undefined): string | null {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * CRITERION 10, MERGE BLOCKER. A product id belonging to another brand is
 * refused before a single byte is read.
 *
 * The spec asks for 404 here, which differs from decideAccess's 403 elsewhere,
 * and deliberately: the download route is reached by URL rather than from the
 * app, so 404 is the honest answer for "there is nothing here for you" and
 * leaks nothing about which product ids exist. Both refuse identically whether
 * the product belongs to someone else or does not exist at all.
 */
export function decideDownloadAccess(
  callerBrandId: string | null,
  productBrandId: string | null | undefined,
): { ok: true } | { ok: false; status: 404 } {
  const decision = decideAccess(callerBrandId, productBrandId ?? null);
  // A missing product reaches here as a null brand and must refuse too.
  if (!decision.ok || !productBrandId) return { ok: false, status: 404 };
  return { ok: true };
}

/** `SORBIFY-OIL-media.zip`. Never a raw product id in a filename someone sees. */
export function zipName(productName: string, kind: "media" | "documents"): string {
  const slug = (productName || "product")
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase()
    .slice(0, 60);
  return `${slug || "PRODUCT"}-${kind}.zip`;
}

/**
 * Criterion 6. A filename may propose a product; it never applies one.
 *
 * Silent auto-tagging on a filename guess is worse than no tagging, because
 * nobody audits it and the wrong link propagates into every product card and
 * every generated description that reads it.
 */
export interface SuggestableProduct { id: string; name: string; sku?: string | null }

export function suggestProduct(
  fileNames: string[],
  products: SuggestableProduct[],
): SuggestableProduct | null {
  const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const haystack = norm(fileNames.join(" "));
  if (!haystack) return null;

  let best: { product: SuggestableProduct; score: number } | null = null;
  for (const p of products) {
    const sku = p.sku ? norm(p.sku) : "";
    // An SKU match is worth more than a name match: it is unambiguous.
    if (sku && sku.length >= 3 && haystack.includes(sku)) {
      return p;
    }
    const words = norm(p.name).split(" ").filter((w) => w.length >= 3);
    if (!words.length) continue;
    const hits = words.filter((w) => haystack.includes(w)).length;
    // Every significant word of the name has to appear. A product called
    // "SORBIFY OIL" must not match "sorbify-all-500ml.jpg".
    if (hits !== words.length) continue;
    const score = words.join("").length;
    if (!best || score > best.score) best = { product: p, score };
  }
  return best?.product ?? null;
}

/** The line offering it. It is a question, never a statement of what was done. */
export function suggestionCopy(product: { name: string }, fileCount: number): string {
  const files = fileCount === 1 ? "this file" : `these ${fileCount} files`;
  return `Looks like ${product.name}. Tag ${files} to it?`;
}

/** Untag says what it does not do, because that is the worrying part. */
export const UNTAG_NOTE = "Removes it from this product. The file stays in Knowledge.";

/* ------------------------------------------------------------------ */
/*  Searching the image library                                        */
/* ------------------------------------------------------------------ */

/** The three fields the library's search box has always read. */
export interface SearchableImage {
  file_name?: string | null;
  tags?: string[] | null;
  campaign_name?: string | null;
}

/**
 * One match, used by both search boxes.
 *
 * The library searched tags, file names and campaign names; the product
 * picker searched file names and category. Two controls that look the same
 * behaved differently, and the picker could not find an image by the tag
 * somebody had typed on it. Extracting the rule is what stops them drifting
 * apart again.
 */
export function imageMatches(image: SearchableImage, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const tags = Array.isArray(image.tags) ? image.tags : [];
  return (
    tags.some((t) => String(t).toLowerCase().includes(q)) ||
    (image.file_name ?? "").toLowerCase().includes(q) ||
    (image.campaign_name ?? "").toLowerCase().includes(q)
  );
}

/** The columns both search boxes need. Selecting fewer is how this broke. */
export const IMAGE_SEARCH_COLUMNS = "id, file_url, file_name, category, tags, campaign_name";
