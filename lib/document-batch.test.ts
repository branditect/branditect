/** Run with: npm test — criteria from branditect-ui/spec/document-upload-asks.md */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  makeBatch, attachDocument, setBatchType, overrideType, overrideDescription,
  resolved, saveUpdates, stillUploading, isUndescribed, undescribedFirst,
} from "./document-batch.ts";

const files = (...names: string[]) => names.map((n, i) => ({ tempId: `t${i}`, name: n }));

/** CRITERION 2: the panel opens pre-filled with the guess, and shows it. */
describe("the batch opens pre-filled", () => {
  it("takes its type from the first file", () => {
    assert.equal(makeBatch(files("Hinnasto 2026.xlsx")).docTypeId, "price_list");
  });

  it("gives every file its own guess as well", () => {
    const b = makeBatch(files("safety-data-sheet.pdf", "reseller-agreement.pdf"));
    assert.deepEqual(b.files.map((f) => f.docTypeId), ["safety_sheet", "contract"]);
  });

  it("starts with no description, because inventing one is worse than blank", () => {
    assert.equal(makeBatch(files("a.pdf")).description, "");
    assert.deepEqual(makeBatch(files("a.pdf")).files.map((f) => f.description), [null]);
  });

  it("survives an empty selection", () => {
    assert.equal(makeBatch([]).docTypeId, "other");
  });
});

/** CRITERION 3: answer once, applied to all; an override touches one file. */
describe("one answer for the batch", () => {
  it("applies to every file", () => {
    let b = makeBatch(files("a.pdf", "b.pdf", "c.pdf"));
    b = setBatchType(b, "certificate", new Set());
    assert.deepEqual(b.files.map((f) => f.docTypeId), ["certificate", "certificate", "certificate"]);
  });

  it("does not overwrite a file the person already corrected", () => {
    let b = makeBatch(files("a.pdf", "b.pdf"));
    b = overrideType(b, "t1", "contract");
    b = setBatchType(b, "certificate", new Set(["t1"]));
    assert.deepEqual(b.files.map((f) => f.docTypeId), ["certificate", "contract"]);
  });

  it("a per-file type change touches exactly one file", () => {
    let b = makeBatch(files("a.pdf", "b.pdf", "c.pdf"));
    b = overrideType(b, "t1", "manual");
    assert.deepEqual(b.files.map((f) => f.docTypeId), ["other", "manual", "other"]);
  });

  it("a per-file description change touches exactly one file", () => {
    let b = makeBatch(files("a.pdf", "b.pdf"));
    b = overrideDescription(b, "t0", "Only this one");
    b.description = "batch text";
    assert.equal(resolved(b, b.files[0]).description, "Only this one");
    assert.equal(resolved(b, b.files[1]).description, "batch text");
  });
});

/** CRITERION 5: category is derived from the type, never entered. */
describe("what a file resolves to", () => {
  it("derives category and use_in_output from the resolved type", () => {
    let b = makeBatch(files("scan.pdf"));
    b = overrideType(b, "t0", "contract");
    assert.deepEqual(resolved(b, b.files[0]), {
      description: null, doc_type: "contract", category: "company-info", use_in_output: false,
    });
  });

  it("a price list stays usable in output", () => {
    const b = makeBatch(files("Hinnasto.xlsx"));
    assert.equal(resolved(b, b.files[0]).category, "pricing");
    assert.equal(resolved(b, b.files[0]).use_in_output, true);
  });
});

/** The panel patches rows that already exist; it never blocks the upload. */
describe("saving against rows that already exist", () => {
  it("skips files whose insert has not returned yet", () => {
    let b = makeBatch(files("a.pdf", "b.pdf"));
    b = attachDocument(b, "t0", "doc-1");
    const updates = saveUpdates(b);
    assert.equal(updates.length, 1);
    assert.equal(updates[0].documentId, "doc-1");
    assert.ok(stillUploading(b), "b.pdf is still in flight");
  });

  it("includes every file once they have all landed", () => {
    let b = makeBatch(files("a.pdf", "b.pdf"));
    b = attachDocument(b, "t0", "doc-1");
    b = attachDocument(b, "t1", "doc-2");
    assert.deepEqual(saveUpdates(b).map((u) => u.documentId), ["doc-1", "doc-2"]);
    assert.equal(stillUploading(b), false);
  });

  it("attaching a row leaves the others alone", () => {
    let b = makeBatch(files("a.pdf", "b.pdf"));
    b = attachDocument(b, "t1", "doc-2");
    assert.deepEqual(b.files.map((f) => f.documentId), [null, "doc-2"]);
  });
});

/** CRITERION 4: Skip keeps the guess and leaves the file in the queue. */
describe("Not described yet", () => {
  it("catches null, undefined and whitespace", () => {
    assert.ok(isUndescribed({ description: null }));
    assert.ok(isUndescribed({}));
    assert.ok(isUndescribed({ description: "   " }));
    assert.ok(!isUndescribed({ description: "A safety sheet" }));
  });

  it("puts undescribed files at the top without reordering the rest", () => {
    const docs = [
      { id: 1, description: "described" },
      { id: 2, description: null },
      { id: 3, description: "also described" },
      { id: 4, description: "  " },
    ];
    assert.deepEqual(undescribedFirst(docs).map((d) => d.id), [2, 4, 1, 3]);
  });

  it("a skipped file is still typed, so Skip loses only the description", () => {
    const b = makeBatch(files("kayttoturvallisuustiedote.pdf"));
    assert.equal(b.files[0].docTypeId, "safety_sheet");
    assert.equal(resolved(b, b.files[0]).description, null);
  });
});

/**
 * CRITERION 9: the two write paths build the same shape. The file path used to
 * guess a category and show nobody while the paste path asked properly.
 */
describe("both write paths write the same fields", () => {
  const src = readFileSync("app/(app)/knowledge/documents/page.tsx", "utf8");

  it("both inserts go through askedFields", () => {
    const inserts = src.split('.from("brand_documents")').slice(1);
    assert.ok(inserts.length >= 2, `expected two writes, found ${inserts.length}`);
    for (const [i, chunk] of inserts.entries()) {
      const body = chunk.slice(0, chunk.indexOf(".select("));
      if (!body.includes(".insert(")) continue;
      assert.ok(body.includes("askedFields") || body.includes("...asked"),
        `insert ${i} does not use the shared field builder`);
    }
  });

  it("neither path sets category by hand any more", () => {
    assert.ok(!/category: detectCategory\(/.test(src),
      "the file path still guesses a category directly");
    assert.ok(!/category: textCategory/.test(src),
      "the paste path still sets category by hand");
  });
});

/** CRITERION 1: the upload starts with the panel, not after it. */
describe("the panel does not hold the bytes", () => {
  const src = readFileSync("app/(app)/knowledge/documents/page.tsx", "utf8");

  it("uploadFiles is started without being awaited when files are chosen", () => {
    assert.ok(/void uploadFiles\(|uploadFiles\([^)]*\);\s*\n/.test(src),
      "uploadFiles looks awaited before the panel opens");
  });

  it("the panel opens in the same handler that starts the upload", () => {
    const handler = src.slice(src.indexOf("function onFilesChosen"), src.indexOf("function onFilesChosen") + 900);
    assert.ok(handler.includes("makeBatch"), "the panel is not opened here");
    assert.ok(handler.includes("uploadFiles"), "the upload is not started here");
  });
});
