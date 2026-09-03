/** Run with: npm test — criteria from branditect-ui/spec/document-upload-asks.md */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  DOC_TYPES, docType, docTypeLabel, categoryFor, studioMayUse,
  detectDocType, detectCategory, askedFields, OTHER,
} from "./document-types.ts";

/** CRITERION 5: category is derived from doc_type and never entered by hand. */
describe("every type maps to a category", () => {
  const EXPECTED: Record<string, string> = {
    safety_sheet: "product-info",
    spec: "product-info",
    manual: "product-info",
    certificate: "product-info",
    catalogue: "product-info",
    price_list: "pricing",
    contract: "company-info",
    presentation: "presentations",
    brand_guideline: "company-info",
    other: "other",
  };

  it("the table in the spec, exactly", () => {
    for (const [id, category] of Object.entries(EXPECTED)) {
      assert.equal(categoryFor(id), category, `${id} mapped to the wrong category`);
    }
  });

  it("covers every type, so none can be added without a category", () => {
    assert.deepEqual(DOC_TYPES.map((t) => t.id).sort(), Object.keys(EXPECTED).sort());
  });

  it("only ever produces the five categories the filter row already knows", () => {
    const five = new Set(["product-info", "company-info", "pricing", "presentations", "other"]);
    for (const t of DOC_TYPES) assert.ok(five.has(t.category), `${t.id} invented ${t.category}`);
  });

  it("an unknown or missing type falls back rather than throwing", () => {
    assert.equal(categoryFor("nonsense"), "other");
    assert.equal(categoryFor(null), "other");
    assert.equal(categoryFor(undefined), "other");
    assert.equal(docType("nonsense"), OTHER);
  });
});

/** CRITERION 6: a contract is stored but never quoted at a customer. */
describe("use_in_output", () => {
  it("is false for a contract or quotation, and only for that", () => {
    const off = DOC_TYPES.filter((t) => !t.useInOutput).map((t) => t.id);
    assert.deepEqual(off, ["contract"]);
  });

  it("a contract holds negotiated rates, so it defaults to off", () => {
    assert.equal(studioMayUse("contract"), false);
    assert.equal(studioMayUse("price_list"), true);
    assert.equal(studioMayUse("safety_sheet"), true);
  });

  it("an unknown type is usable, not silently excluded", () => {
    assert.equal(studioMayUse("nonsense"), true);
  });
});

/**
 * CRITERION 2: the guess is kept and shown. These are the filenames a brand
 * actually uploads, in both languages this user works in.
 */
describe("the type guessed from a filename", () => {
  const CASES: [string, string][] = [
    ["SORBIFY-OIL-safety-data-sheet.pdf", "safety_sheet"],
    ["kayttoturvallisuustiedote.pdf", "safety_sheet"],
    ["TUV-test-report-2026.pdf", "certificate"],
    ["ISO 9001 certificate.pdf", "certificate"],
    ["500ml-bottle-datasheet.pdf", "spec"],
    ["user-manual-en.pdf", "manual"],
    ["kayttoohje.pdf", "manual"],
    ["Hinnasto 2026.xlsx", "price_list"],
    ["reseller-price-list.xlsx", "price_list"],
    ["Reseller agreement signed.pdf", "contract"],
    ["tarjous-asiakkaalle.pdf", "contract"],
    ["Q1-pitch-deck.pptx", "presentation"],
    ["brand-guidelines-v3.pdf", "brand_guideline"],
    ["autumn-collection-catalogue.pdf", "catalogue"],
    ["scan0001.pdf", "other"],
    ["", "other"],
  ];

  for (const [name, expected] of CASES) {
    it(`${JSON.stringify(name)} → ${expected}`, () => {
      assert.equal(detectDocType(name), expected);
    });
  }

  it("never throws on a missing filename", () => {
    // @ts-expect-error deliberately wrong, because uploads have surprised us before
    assert.equal(detectDocType(undefined), "other");
  });
});

/**
 * The old detectCategory guessed a category directly and showed nobody. Its
 * answers must survive the move, or existing files change category silently.
 */
describe("the categories the old guesser produced still come out", () => {
  it("pricing, presentations and product-info all still land", () => {
    assert.equal(detectCategory("price-list.pdf"), "pricing");
    assert.equal(detectCategory("pitch-deck.pptx"), "presentations");
    assert.equal(detectCategory("product-catalogue.pdf"), "product-info");
    assert.equal(detectCategory("scan0001.pdf"), "other");
  });
});

/** CRITERION 9: both write paths build the same shape. */
describe("the fields a write path adds", () => {
  it("derives category and use_in_output from the type", () => {
    assert.deepEqual(askedFields({ docTypeId: "contract", description: "Reseller terms" }), {
      description: "Reseller terms",
      doc_type: "contract",
      category: "company-info",
      use_in_output: false,
    });
  });

  it("falls back to the filename guess when no type was chosen", () => {
    assert.equal(askedFields({ filename: "Hinnasto.xlsx" }).doc_type, "price_list");
    assert.equal(askedFields({ filename: "Hinnasto.xlsx" }).category, "pricing");
  });

  it("stores a blank description as null, so Not described yet can find it", () => {
    assert.equal(askedFields({ filename: "a.pdf", description: "   " }).description, null);
    assert.equal(askedFields({ filename: "a.pdf" }).description, null);
    assert.equal(askedFields({ filename: "a.pdf", description: " kept " }).description, "kept");
  });
});

/** The migration has to actually contain the three columns the code assumes. */
describe("the migration matches the code", () => {
  const sql = readFileSync("supabase/document-upload-asks.sql", "utf8");

  for (const col of ["description", "doc_type", "use_in_output"]) {
    it(`adds ${col}`, () => {
      assert.ok(new RegExp(`ADD COLUMN IF NOT EXISTS\\s+${col}\\b`).test(sql), `${col} is missing`);
    });
  }

  it("is safe to run twice", () => {
    const alters = sql.match(/^ALTER TABLE .*$/gm) ?? [];
    assert.ok(alters.length > 0);
    for (const a of alters) assert.ok(a.includes("IF NOT EXISTS"), a);
  });

  it("does not drop doc_role in the same breath — the column is populated", () => {
    const active = sql.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
    assert.ok(!/DROP COLUMN/.test(active),
      "the drop is live; it must stay commented until nothing reads doc_role");
  });
});

/** The spec drops doc_role. Nothing new may be built on it. */
describe("doc_role is on its way out", () => {
  it("the labels for it are not extended", () => {
    const src = readFileSync("lib/product-attachments.ts", "utf8");
    const roles = src.match(/DOC_ROLES\s*=\s*\[([^\]]*)\]/s);
    if (!roles) return;                       // already gone, which is the end state
    const count = (roles[1].match(/"/g) ?? []).length / 2;
    assert.ok(count <= 4, `DOC_ROLES grew to ${count} — the column is being dropped`);
  });

  it("the new type list is where a document's type lives", () => {
    assert.equal(docTypeLabel("safety_sheet"), "Product safety sheet");
  });
});
