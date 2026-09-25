/** Run with: npm test */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseExtractedColors, colorMediaType, storagePathFromUrl, hexCodesInText, colorTextPrompt, COLOR_TEXT_MAX_CHARS, MIN_HEX_FOR_TEXT_PATH } from "./brand-colors.ts";

describe("reading a palette out of what a model answered", () => {
  it("takes the array out of prose around it", () => {
    const text = 'Here are the colours I found:\n```json\n[{"hex":"#F0562A","name":"Signal Orange","usage":"Buttons"}]\n```';
    assert.deepEqual(parseExtractedColors(text), [
      { hex: "#f0562a", name: "Signal Orange", usage: "Buttons" },
    ]);
  });

  it("normalises the hex, so #FFF and #ffffff are one colour", () => {
    const out = parseExtractedColors('[{"hex":"FFF","name":"Paper"},{"hex":"#ffffff","name":"White"}]');
    assert.deepEqual(out.map((c) => c.hex), ["#ffffff"]);
  });

  it("drops a colour the brand already has, so re-uploading does not duplicate", () => {
    const out = parseExtractedColors(
      '[{"hex":"#F0562A","name":"Signal Orange"},{"hex":"#15151B","name":"Ink"}]',
      ["#f0562a"],
    );
    assert.deepEqual(out.map((c) => c.name), ["Ink"]);
  });

  it("names an unnamed colour after itself rather than leaving it blank", () => {
    assert.equal(parseExtractedColors('[{"hex":"#15151b"}]')[0].name, "#15151B");
  });

  it("returns nothing for an answer that is not a list", () => {
    for (const text of ["", "I could not find any colours.", "{}", "[not json]"]) {
      assert.deepEqual(parseExtractedColors(text), [], text);
    }
  });

  it("skips entries with no usable hex", () => {
    const out = parseExtractedColors('[{"hex":"burnt orange","name":"X"},{"hex":"#123456","name":"Y"}]');
    assert.deepEqual(out.map((c) => c.name), ["Y"]);
  });
});

describe("what can be read", () => {
  it("knows a PDF from an image, and refuses the rest", () => {
    assert.equal(colorMediaType("guidelines.pdf"), "application/pdf");
    assert.equal(colorMediaType("palette.PNG"), "image/png");
    assert.equal(colorMediaType("shot.jpeg"), "image/jpeg");
    assert.equal(colorMediaType("brand.docx"), null);
    assert.equal(colorMediaType("noextension"), null);
  });

  it("falls back to the mime type when the name has no extension", () => {
    assert.equal(colorMediaType("scan", "application/pdf"), "application/pdf");
    assert.equal(colorMediaType("scan", "image/heic"), "image/png");
  });
});

describe("finding the stored file again", () => {
  it("reads the object path back out of a public URL", () => {
    assert.equal(
      storagePathFromUrl("https://x.supabase.co/storage/v1/object/public/brand-assets/b1/brand-guideline/1-a.pdf"),
      "b1/brand-guideline/1-a.pdf",
    );
  });

  it("ignores a query string, so a signed URL still names the object", () => {
    assert.equal(
      storagePathFromUrl("https://x.supabase.co/storage/v1/object/sign/brand-assets/b1/g.pdf?token=abc"),
      "b1/g.pdf",
    );
  });

  it("is null for nothing, and for a URL from somewhere else", () => {
    assert.equal(storagePathFromUrl(null), null);
    assert.equal(storagePathFromUrl("https://example.com/guidelines.pdf"), null);
  });
});

describe("the columns these writes name", () => {
  // The live database has fewer columns than supabase/*.sql declares, and
  // migrations here are run by hand. A write naming a column that does not
  // exist fails the WHOLE request with PGRST204 — the guideline upload lost
  // every colour it had just read that way.
  const code = (f: string) => readFileSync(new URL(`../${f}`, import.meta.url), "utf8");

  it("writes brand_book_colors with hex and name only", () => {
    for (const f of ["app/api/visual/guideline/route.ts", "app/api/brand-book/color/route.ts"]) {
      const src = code(f);
      for (const column of ["role", "grouping", "css_value"]) {
        assert.ok(!new RegExp(`${column}:\\s`).test(src), `${f} writes ${column}, which the table does not have`);
      }
    }
  });

  it("writes brand_visual with guideline_url and updated_at only", () => {
    const src = code("app/api/visual/guideline/route.ts");
    for (const column of ["guideline_storage_path", "assets_updated_at", "guideline_name"]) {
      assert.ok(!new RegExp(`${column}:`).test(src), `it writes ${column}, which the table does not have`);
    }
  });
});

describe("a guideline that prints its palette is read as text", () => {
  it("counts distinct codes in every printed form", () => {
    assert.equal(hexCodesInText("HEX: #15181CHEX: #29323ACarbon Black"), 2);
    assert.equal(hexCodesInText("Primary #E8562A, again #e8562a"), 1);
    assert.equal(hexCodesInText("HEX 15181C and hex: 29323a"), 2);
    assert.equal(hexCodesInText("#FFF on #000"), 2);
  });
  it("does not count words, ids or colour-less text", () => {
    assert.equal(hexCodesInText("RGB: 25, 25, 24 CMYK: 0, 0, 4, 90"), 0);
    assert.equal(hexCodesInText("Order 1234567 and heading #1"), 0);
    assert.equal(hexCodesInText("decade facade"), 0);
  });
  it("needs two codes to call it a palette", () => {
    assert.equal(MIN_HEX_FOR_TEXT_PATH, 2);
  });
  it("the text prompt asks the same question over the text, capped", () => {
    const p = colorTextPrompt("x".repeat(COLOR_TEXT_MAX_CHARS + 500));
    assert.match(p, /extracted from a brand guideline PDF/);
    assert.match(p, /Return ONLY a JSON array/);
    assert.ok(p.length < COLOR_TEXT_MAX_CHARS + 1500);
  });
});

describe("visual/guideline spends once per file", () => {
  const src = readFileSync("app/api/visual/guideline/route.ts", "utf8");
  it("names the file by its content, and skips colours for the same file", () => {
    assert.match(src, /const path = `\$\{brandId\}\/brand-guideline\/\$\{sha\}-/);
    assert.match(src, /if \(sameFile\) \{/);
    assert.ok(src.indexOf("if (sameFile)") < src.indexOf("await meter("));
  });
  it("tries the text before sending the file", () => {
    assert.ok(src.indexOf("pdfPages(") < src.indexOf("await meter("));
  });
  it("removes the guideline it replaces", () => {
    assert.match(src, /previousPath && !sameFile/);
  });
});
