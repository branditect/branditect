/** Run with: npm test — criteria from branditect-ui/spec/product-attachments.md */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  decideDownloadAccess, suggestProduct, suggestionCopy, zipName,
  isVideo, durationBadge, fileSize, docRoleLabel, isDocRole, DOC_ROLES, UNTAG_NOTE,
} from "./product-attachments.ts";

/** CRITERION 10, MERGE BLOCKER. */
describe("a product from another brand cannot be downloaded", () => {
  it("refuses a product belonging to someone else", () => {
    const r = decideDownloadAccess("brand-a", "brand-b");
    assert.equal(r.ok, false);
    assert.equal(r.ok === false && r.status, 404);
  });

  it("allows the caller's own product", () => {
    assert.equal(decideDownloadAccess("brand-a", "brand-a").ok, true);
  });

  it("refuses when the caller has no brand", () => {
    assert.equal(decideDownloadAccess(null, "brand-a").ok, false);
    assert.equal(decideDownloadAccess("", "brand-a").ok, false);
  });

  /* A product that does not exist and one belonging to someone else must be
     indistinguishable, or the response confirms which ids are real. */
  it("refuses a product that does not exist, identically", () => {
    const missing = decideDownloadAccess("brand-a", null);
    const foreign = decideDownloadAccess("brand-a", "brand-b");
    assert.equal(missing.ok, false);
    assert.equal(missing.ok === false && missing.status, 404);
    assert.deepEqual(missing, foreign);
  });

  it("refuses an undefined brand the same way", () => {
    assert.equal(decideDownloadAccess("brand-a", undefined).ok, false);
  });
});

/**
 * Criterion 6. Silent auto-tagging on a filename guess is worse than no
 * tagging, because nobody audits it and the wrong link propagates.
 */
describe("filename suggestion", () => {
  const PRODUCTS = [
    { id: "1", name: "SORBIFY OIL", sku: "SRB-OIL-500" },
    { id: "2", name: "SORBIFY ALL", sku: "SRB-ALL-500" },
    { id: "3", name: "Spill kit", sku: null },
  ];

  it("proposes the product whose name is in the filename", () => {
    const s = suggestProduct(["sorbify-oil-500ml-front.jpg"], PRODUCTS);
    assert.equal(s?.name, "SORBIFY OIL");
  });

  it("does not confuse two products that share a word", () => {
    assert.equal(suggestProduct(["sorbify-all-500ml.jpg"], PRODUCTS)?.name, "SORBIFY ALL");
    assert.equal(suggestProduct(["sorbify-oil-pack.jpg"], PRODUCTS)?.name, "SORBIFY OIL");
  });

  it("prefers an SKU, which is unambiguous", () => {
    assert.equal(suggestProduct(["SRB-ALL-500_hero.png"], PRODUCTS)?.name, "SORBIFY ALL");
  });

  it("proposes nothing when nothing matches", () => {
    assert.equal(suggestProduct(["IMG_4821.jpg"], PRODUCTS), null);
    assert.equal(suggestProduct([], PRODUCTS), null);
    assert.equal(suggestProduct(["sorbify.jpg"], []), null);
  });

  it("needs every significant word, not just one", () => {
    // "Spill kit" must not match a file that only says "spill".
    assert.equal(suggestProduct(["spill-photo.jpg"], PRODUCTS), null);
    assert.equal(suggestProduct(["spill-kit-open.jpg"], PRODUCTS)?.name, "Spill kit");
  });

  it("phrases it as a question, never as something already done", () => {
    const copy = suggestionCopy({ name: "SORBIFY OIL" }, 6);
    assert.ok(copy.endsWith("?"), copy);
    assert.ok(copy.includes("these 6 files"), copy);
    assert.ok(!/tagged|applied|added/i.test(copy), copy);
    assert.equal(suggestionCopy({ name: "X" }, 1).includes("this file"), true);
  });
});

describe("untagging says what it does not do", () => {
  it("promises the file stays in Knowledge", () => {
    assert.ok(/stays in Knowledge/.test(UNTAG_NOTE), UNTAG_NOTE);
    assert.ok(!/delete/i.test(UNTAG_NOTE), UNTAG_NOTE);
  });
});

describe("zip names", () => {
  it("uses the product name, not its id", () => {
    assert.equal(zipName("SORBIFY OIL", "media"), "SORBIFY-OIL-media.zip");
    assert.equal(zipName("SORBIFY OIL", "documents"), "SORBIFY-OIL-documents.zip");
  });

  it("survives punctuation and spacing", () => {
    assert.equal(zipName("Mat, 40 x 50cm", "media"), "MAT-40-X-50CM-media.zip");
    assert.equal(zipName("  ", "media"), "PRODUCT-media.zip");
  });
});

describe("telling a video from a still", () => {
  it("reads the category", () => {
    assert.equal(isVideo({ category: "video" }), true);
    assert.equal(isVideo({ category: "product" }), false);
  });

  it("falls back to the extension", () => {
    assert.equal(isVideo({ category: "brand", file_name: "clip.mp4" }), true);
    assert.equal(isVideo({ category: "brand", file_name: "shot.jpg" }), false);
    assert.equal(isVideo({}), false);
  });

  it("formats a duration badge", () => {
    assert.equal(durationBadge(24), "0:24");
    assert.equal(durationBadge(95), "1:35");
    assert.equal(durationBadge(null), null);
    assert.equal(durationBadge(-3), null);
  });
});

describe("file sizes", () => {
  it("reads the way the spec writes them", () => {
    assert.equal(fileSize(2_202_009), "2.1 MB");
    assert.equal(fileSize(860_160), "840 KB");
    assert.equal(fileSize(512), "512 B");
  });

  it("says nothing rather than 0 B when it does not know", () => {
    assert.equal(fileSize(null), null);
    assert.equal(fileSize(undefined), null);
  });
});

describe("document roles", () => {
  it("carries the four the spec names", () => {
    assert.deepEqual(DOC_ROLES.map((r) => r.id), ["safety_sheet", "spec", "manual", "certificate"]);
  });

  it("labels them for the list", () => {
    assert.equal(docRoleLabel("safety_sheet"), "Safety sheet");
    assert.equal(docRoleLabel(null), null);
    assert.equal(docRoleLabel("nonsense"), null);
  });

  it("rejects a role it does not know", () => {
    assert.equal(isDocRole("spec"), true);
    assert.equal(isDocRole("invoice"), false);
    assert.equal(isDocRole(null), false);
  });
});

/**
 * The migration is the whole of step 1, and it is the one artefact I cannot
 * run. These assert it says what it must before anyone pastes it.
 */
describe("the migration", () => {
  const sql = readFileSync(new URL("../supabase/product-attachments.sql", import.meta.url), "utf8");

  it("references catalog_products, because there is no products table", () => {
    assert.ok(/REFERENCES catalog_products\(id\)/.test(sql), "an FK does not point at catalog_products");
    assert.ok(!/REFERENCES products\(id\)/.test(sql), "an FK still points at a table that does not exist");
  });

  it("cascades both links, so a deleted file leaves no orphan", () => {
    // Comments explain the cascades too, so count the ones in real statements.
    const statements = sql.replace(/^--.*$/gm, "");
    const cascades = statements.match(/ON DELETE CASCADE/g) ?? [];
    assert.equal(cascades.length, 4, `expected four cascades, found ${cascades.length}`);
    // Criteria 2 and 3: both directions, both tables.
    assert.ok(/REFERENCES catalog_products\(id\) ON DELETE CASCADE/.test(statements));
    assert.ok(/REFERENCES brand_images\(id\)\s+ON DELETE CASCADE/.test(statements));
    assert.ok(/REFERENCES brand_documents\(id\)\s+ON DELETE CASCADE/.test(statements));
  });

  /** Criterion 8, enforced by the database rather than by application code. */
  it("enforces one primary per product with a partial unique index", () => {
    assert.ok(/CREATE UNIQUE INDEX[\s\S]{0,120}product_images \(product_id\) WHERE is_primary/.test(sql),
      "no partial unique index on is_primary");
  });

  it("turns RLS on for both tables and scopes it to the caller's brands", () => {
    for (const t of ["product_images", "product_documents"]) {
      assert.ok(new RegExp(`ALTER TABLE ${t}\\s+ENABLE ROW LEVEL SECURITY`).test(sql), `${t} has no RLS`);
    }
    // Count inside the CREATE POLICY statements only. The counts view carries
    // the same predicate and would otherwise inflate this.
    const policyBlock = sql.slice(sql.indexOf("CREATE POLICY"), sql.indexOf("-- \u2500\u2500 the counts"));
    const policies = policyBlock.match(/brand_id IN \(SELECT brand_id FROM brands WHERE user_id = auth\.uid\(\)\)/g) ?? [];
    assert.equal(policies.length, 4, `each policy needs both USING and WITH CHECK, found ${policies.length}`);
  });

  it("derives the counts rather than storing them", () => {
    assert.ok(/CREATE OR REPLACE VIEW product_attachment_counts/.test(sql), "no counts view");
    assert.ok(/security_invoker = on/.test(sql), "the view would bypass RLS as its owner");
  });

  /* security_invoker alone was not enough. The view reads catalog_products,
     which has no RLS of its own, so running as the caller still returned every
     brand's rows. Verified against the live database: a new account saw all 10
     products across all 4 brands. The view has to filter itself. */
  it("filters itself rather than trusting the base table's RLS", () => {
    assert.ok(/FROM catalog_products p\s+WHERE auth\.role\(\) = 'service_role'/.test(sql),
      "the counts view does not filter by the caller's brands");
    assert.ok(/OR p\.brand_id IN \(SELECT brand_id FROM brands WHERE user_id = auth\.uid\(\)\)/.test(sql),
      "the view has no brand predicate");
  });

  it("keeps a service_role branch, or server reads would silently return nothing", () => {
    assert.ok(/auth\.role\(\) = 'service_role'/.test(sql), "no service_role branch");
  });

  it("is safe to run twice", () => {
    const creates = sql.match(/CREATE (TABLE|INDEX|UNIQUE INDEX)/g) ?? [];
    const guarded = sql.match(/CREATE (TABLE|INDEX|UNIQUE INDEX) IF NOT EXISTS/g) ?? [];
    assert.equal(creates.length, guarded.length, "a CREATE is missing IF NOT EXISTS");
  });

  /* The hazard is a bare verification SELECT at the end, not the SELECT that
     defines the view. The editor mangled a trailing ORDER BY once and rolled
     the whole transaction back with it. */
  it("ends on a statement rather than a verification query", () => {
    const statements = sql.replace(/^--.*$/gm, "").trim();
    const last = statements.split(";").map((x) => x.trim()).filter(Boolean).pop() ?? "";
    assert.ok(!/^SELECT/i.test(last), `the paste ends on: ${last.slice(0, 60)}`);
    assert.ok(!/ORDER BY/i.test(statements), "a trailing ORDER BY is what got mangled before");
  });
});
