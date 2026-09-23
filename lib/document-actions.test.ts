/** Run with: npm test — Knowledge ▸ Documents: preview, download, delete. */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { previewKindOf, canPreview, canDownload, hasFile, extensionOf, deleteCopy } from "./document-actions.ts";
import { en } from "./i18n/en.ts";
import { fi } from "./i18n/fi.ts";

const read = (f: string) => readFileSync(f, "utf8");
const code = (f: string) => read(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
const file = (over: Partial<Parameters<typeof previewKindOf>[0]> = {}) =>
  ({ file_name: "deck.pdf", storage_path: "brand/1_deck.pdf", ...over });

describe("what a document can do", () => {
  it("a PDF previews, an image previews, a docx does not", () => {
    assert.equal(previewKindOf(file()), "pdf");
    assert.equal(previewKindOf(file({ file_name: "logo.PNG" })), "image");
    assert.equal(previewKindOf(file({ file_name: "brief.docx" })), "none");
  });

  it("but a docx the brain has read shows what it read", () => {
    // A browser cannot render it; the extracted text is the thing worth
    // checking anyway.
    assert.equal(previewKindOf(file({ file_name: "brief.docx", extracted_text: "Sorbify sells…" })), "text");
    assert.ok(canPreview(file({ file_name: "brief.docx", extracted_text: "x y" })));
    assert.ok(!canPreview(file({ file_name: "brief.docx" })));
  });

  it("a pasted entry is its own text, and has nothing to download", () => {
    const pasted = { file_name: "Pasted notes", storage_path: "", extracted_text: "the notes" };
    assert.equal(previewKindOf(pasted), "text");
    assert.ok(!hasFile(pasted));
    assert.ok(!canDownload(pasted));
    assert.ok(canDownload(file()));
  });

  it("an entry with a stored URL but no path is still downloadable", () => {
    // Rows written before the storage_path column, which still exist.
    assert.ok(canDownload({ file_name: "old.pdf", storage_path: "", file_url: "https://x/y/old.pdf" }));
  });

  it("knows an extension when it sees one", () => {
    assert.equal(extensionOf("a/b/deck.final.PDF"), "pdf");
    assert.equal(extensionOf("no-extension"), "");
  });
});

describe("deleting says what it costs, in both languages", () => {
  it("names the file and the consequence", () => {
    const copy = deleteCopy("deck.pdf", (k, v) => (v ? `${en[k]}|${JSON.stringify(v)}` : en[k]));
    assert.match(copy.title, /deck\.pdf/);
    assert.match(copy.body, /cite/i, "the dialog does not say the brain loses it");
  });

  it("every key has Finnish that differs", () => {
    for (const k of ["docs.deleteTitle", "docs.deleteBody", "docs.deleteConfirm", "docs.deleteBlocked",
                     "docs.preview", "docs.previewUnavailable", "docs.downloadFailed"] as const) {
      assert.ok(en[k]?.trim() && fi[k]?.trim(), `${k} is missing a side`);
      assert.notEqual(en[k], fi[k], `${k} is the same in both`);
    }
  });
});

describe("the page does the three things, and checks the dangerous one", () => {
  const page = code("app/(app)/knowledge/documents/page.tsx");

  it("offers preview, download and delete on a row", () => {
    assert.match(page, /onPreview/);
    assert.match(page, /onDownload/);
    assert.match(page, /t\("docs\.preview"\)/);
    assert.match(page, /t\("common\.download"\)/);
  });

  it("asks before deleting, rather than deleting on one click", () => {
    assert.match(page, /DeleteDocumentDialog/);
    assert.match(page, /setDeleteTarget\(d\)/);
  });

  it("reads the row back, because a filtered DELETE reports no error", () => {
    // An RLS-filtered delete resolves { error: null } and removes nothing, so
    // the list would drop a row the database still has.
    assert.match(page, /\.delete\(\)\.eq\("id", doc\.id\)\.select\("id"\)/);
    assert.match(page, /removed\.length === 0/);
    assert.match(page, /t\("docs\.deleteBlocked"\)/);
  });

  it("removes the row before the file, never the other way round", () => {
    const rowAt = page.indexOf('.delete().eq("id", doc.id)');
    const fileAt = page.indexOf('storage.from("brand-documents").remove');
    assert.ok(rowAt > 0 && fileAt > rowAt, "the object is removed before the row is known to be gone");
  });

  it("signs the private bucket rather than guessing a public URL", () => {
    assert.match(page, /signedUrl\(supabase, "brand-documents"/);
    assert.ok(!/\/storage\/v1\/object\/public\/brand-documents/.test(page));
  });
});

describe("picking images is not saving them, and a failed upload says so", () => {
  const lib = readFileSync("components/image-library.tsx", "utf8");
  const body = code("components/image-library.tsx");

  it("a failed upload is reported, not skipped in silence", () => {
    // It was `if (storageError) continue;` with an unchecked insert after it,
    // so a rejected file left the pending list looking exactly like a saved
    // one. Reported for months as "images are not saving at all".
    assert.ok(!/if \(storageError\) continue;/.test(body), "the bare continue is back");
    // The push is multi-line now that the detail is explained; what matters
    // is that a storage failure is still recorded rather than skipped.
    assert.match(body, /failures\.push\(\{[\s\S]{0,120}kind: "storage"/);
    assert.match(body, /const \{ error: insertError \} = await supabase\.from\("brand_images"\)\.insert/);
    assert.match(body, /failures\.push\(\{ fileName: item\.file\.name, kind: "row"/);
    assert.match(body, /summariseUpload\(failures, attempted, t\)/);
  });

  it("what failed stays on the list to try again", () => {
    assert.match(body, /prev\.filter\(\(p\) => !landed\.includes\(p\.file\.name\)\)/);
  });

  it("the pending panel says nothing is saved yet", () => {
    assert.ok(lib.includes('t("kImages.nothingSavedYet")'), "the warning is not on screen");
    assert.match(en["kImages.nothingSavedYet"], /Nothing is saved/i);
    assert.ok(fi["kImages.nothingSavedYet"]?.trim());
    assert.notEqual(en["kImages.nothingSavedYet"], fi["kImages.nothingSavedYet"]);
  });

  it("and leaving with images still pending is not silent", () => {
    assert.match(body, /addEventListener\("beforeunload"/);
    assert.match(body, /pendingUploads\.length === 0\) return;/);
  });
});

describe("a catalogue save that fails says so", () => {
  const body = code("app/(app)/knowledge/products/import/page.tsx");

  it("checks the response, because fetch does not reject on 400", () => {
    assert.match(body, /if \(!res\.ok\)/);
    assert.match(body, /t\("import\.saveFailed"/);
  });

  it("and says why nothing happened when the workspace has not loaded", () => {
    // `if (brandId === "default") return;` was a silent no-op: the product
    // stayed on screen and was never written.
    assert.match(body, /brandId === "default"\) \{ setSaveError\(t\("import\.noBrandYet"\)\); return; \}/);
  });

  it("with Finnish for both", () => {
    for (const k of ["import.saveFailed", "import.noBrandYet"] as const) {
      assert.ok(en[k]?.trim() && fi[k]?.trim(), `${k} is missing a side`);
      assert.notEqual(en[k], fi[k]);
    }
  });
});
