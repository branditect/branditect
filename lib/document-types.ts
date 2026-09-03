/**
 * What a document is, and everything derived from it.
 *
 * Step 1 of branditect-ui/spec/document-upload-asks.md. Both write paths on
 * Knowledge ▸ Documents import from here — the file upload and the paste-text
 * form — so they cannot drift apart. Today they already have: the file path
 * guesses `category` from the filename and shows nobody, while the paste path
 * asks properly.
 *
 * There were three overlapping lists, which is two too many:
 *
 *   brand_documents.category   product-info · company-info · pricing ·
 *                              presentations · other
 *   product_documents.doc_role safety_sheet · spec · manual · certificate
 *   what a person would say    product safety · contract · price list ·
 *                              catalogue · presentation
 *
 * Pick the type, derive the rest. `category` keeps its five values so the
 * existing filter row on the page keeps working untouched — it just stops
 * being something anyone types.
 *
 * `doc_role` on product_documents is dropped rather than mapped. A safety sheet
 * is a safety sheet whichever product it is tagged to; putting the type on the
 * link stores it again per product and lets the copies disagree.
 */

export type Category =
  | "product-info" | "company-info" | "pricing" | "presentations" | "other";

export interface DocType {
  id: string;
  label: string;
  category: Category;
  /**
   * Whether Studio may draw on this document when writing something a customer
   * sees. See CONTRACT_NOTE below for why one type says no.
   */
  useInOutput: boolean;
  /** Matched against the filename to pre-fill the field. Order matters. */
  hints: RegExp;
}

/**
 * Ten types. Not extensible by the user on purpose: a custom taxonomy is how
 * two people end up with "Safety" and "safety sheet" and neither finds the
 * other's file.
 *
 * Ordered most specific first, because detectDocType returns the first match
 * and "catalogue" would otherwise swallow "product catalogue price list".
 */
export const DOC_TYPES: DocType[] = [
  { id: "safety_sheet", label: "Product safety sheet", category: "product-info", useInOutput: true,
    hints: /safety|sds|msds|hazard|coshh|k[aä]ytt[oö]turva/i },
  { id: "certificate", label: "Certificate or test report", category: "product-info", useInOutput: true,
    hints: /certificat|test report|t[uü]v|iso[\s-]?\d|conformit|sertifi|testira/i },
  { id: "spec", label: "Specification", category: "product-info", useInOutput: true,
    hints: /spec|datasheet|data sheet|technical|dimensions|tekniset/i },
  { id: "manual", label: "Manual or instructions", category: "product-info", useInOutput: true,
    // `guide` must not swallow `guideline` — "brand-guidelines-v3.pdf" is a
    // brand guideline, not a manual, and it matched here first.
    hints: /manual|instruction|guide(?!line)|how[\s-]?to|handbook|k[aä]ytt[oö]ohje/i },
  { id: "price_list", label: "Price list", category: "pricing", useInOutput: true,
    hints: /pric|rate|fee|invoice|cost|tariff|hinnasto|hinta/i },
  { id: "contract", label: "Contract or quotation", category: "company-info", useInOutput: false,
    hints: /contract|agreement|quotation|quote|nda|terms|sopimus|tarjous/i },
  { id: "presentation", label: "Presentation", category: "presentations", useInOutput: true,
    hints: /present|deck|slide|pitch|pptx|esitys/i },
  { id: "brand_guideline", label: "Brand guideline", category: "company-info", useInOutput: true,
    hints: /brand|guideline|identity|style guide|logo|brandi/i },
  { id: "catalogue", label: "Catalogue", category: "product-info", useInOutput: true,
    hints: /catalog|catalogue|range|collection|luettelo|esite/i },
  { id: "other", label: "Other", category: "other", useInOutput: true,
    hints: /(?!)/ },   // never matches; the fallback is explicit below
];

export const OTHER: DocType = DOC_TYPES[DOC_TYPES.length - 1];

export function docType(id: string | null | undefined): DocType {
  return DOC_TYPES.find((t) => t.id === id) ?? OTHER;
}

export function docTypeLabel(id: string | null | undefined): string {
  return docType(id).label;
}

/** Criterion 5: category is derived, never entered. */
export function categoryFor(typeId: string | null | undefined): Category {
  return docType(typeId).category;
}

/**
 * Criterion 6: a contract is stored but never quoted back at a customer.
 *
 * Named studioMayUse rather than useInOutputFor because eslint's rules-of-hooks
 * treats any call starting with `use` as a React hook and fails the build when
 * it appears outside a component.
 */
export function studioMayUse(typeId: string | null | undefined): boolean {
  return docType(typeId).useInOutput;
}

/**
 * The guess, kept and made visible.
 *
 * The old detectCategory guessed a category from the filename and showed
 * nobody, which is a silent wrong answer. Same rule as the image matcher:
 * suggest, never auto-apply. This pre-fills the field; a person confirms it.
 */
export function detectDocType(filename: string): string {
  const name = String(filename ?? "");
  for (const t of DOC_TYPES) {
    if (t.id === "other") continue;
    if (t.hints.test(name)) return t.id;
  }
  return "other";
}

/**
 * Kept so the old behaviour has one definition while both paths migrate. The
 * page's filter row still reads brand_documents.category.
 */
export function detectCategory(filename: string): Category {
  return categoryFor(detectDocType(filename));
}

/** Shown beside the type when Studio will not draw on the file. */
export const CONTRACT_NOTE =
  "Not used in generated content. Stored, searchable by you, never quoted by Studio.";

/** The heading files without a description are gathered under. */
export const UNDESCRIBED_HEADING = "Not described yet";

/**
 * The row both write paths build, so criterion 9 can compare them field for
 * field. Callers add their own storage_path, status, pages_count and any text.
 */
export interface DocumentAsks {
  description: string | null;
  doc_type: string;
}

export function askedFields(asks: {
  description?: string | null;
  docTypeId?: string | null;
  filename?: string;
}): { description: string | null; doc_type: string; category: Category; use_in_output: boolean } {
  const id = asks.docTypeId ?? detectDocType(asks.filename ?? "");
  const description = (asks.description ?? "").trim();
  return {
    description: description === "" ? null : description,
    doc_type: id,
    category: categoryFor(id),
    use_in_output: studioMayUse(id),
  };
}
