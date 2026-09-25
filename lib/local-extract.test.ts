import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { zipSync, strToU8 } from "fflate";
import { decodeXml, extractOffice, extractPdfText, officeKind, pdfTextIsEnough } from "./local-extract.ts";

/** A one-page PDF whose text layer says `line`, with a correct xref table. */
function pdfWith(lines: string[]): Uint8Array {
  const body = lines.map((l, i) => `BT /F1 12 Tf 50 ${750 - i * 16} Td (${l}) Tj ET`).join("\n");
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${body.length} >>\nstream\n${body}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) out += `${String(o).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return strToU8(out);
}

const zip = (files: Record<string, string>) =>
  zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(v)])));

describe("which PDFs are read here and which go to the model", () => {
  it("a scan — no text layer — goes to the model", () => {
    assert.equal(pdfTextIsEnough(["", "", ""]), false);
  });
  it("page numbers alone are not a text layer", () => {
    assert.equal(pdfTextIsEnough(["1", "2", "3"]), false);
  });
  it("a text document is read here, even with a photo page or two", () => {
    const prose = "x".repeat(900);
    assert.equal(pdfTextIsEnough([prose, "", prose, prose, prose]), true);
  });
  it("mostly empty pages go to the model, however long the one text page", () => {
    assert.equal(pdfTextIsEnough(["x".repeat(5000), "", "", ""]), false);
  });
  it("reads a real PDF's text layer", async () => {
    const line = "Sorbify absorbs oil spills fast and is made in Finland for professional use";
    const r = await extractPdfText(pdfWith([line, line, line, line]));
    assert.ok(r, "expected local text");
    assert.equal(r!.via, "pdf-text");
    assert.equal(r!.pages, 1);
    assert.match(r!.text, /made in Finland/);
  });
  it("returns null for a PDF with too little text", async () => {
    assert.equal(await extractPdfText(pdfWith(["1"])), null);
  });
});

describe("Office files", () => {
  it("DOCX: paragraphs in order, entities decoded, tabs and breaks kept", () => {
    const r = extractOffice(zip({
      "word/document.xml": `<w:document><w:body>
        <w:p><w:r><w:t>Hinta &amp; kate</w:t></w:r></w:p>
        <w:p><w:r><w:t xml:space="preserve">Tuote </w:t></w:r><w:r><w:tab/><w:t>24,90 €</w:t></w:r></w:p>
        <w:p><w:r><w:t>Rivi</w:t><w:br/><w:t>kaksi</w:t></w:r></w:p>
      </w:body></w:document>`,
    }), "docx");
    assert.equal(r!.text, "Hinta & kate\nTuote \t24,90 €\nRivi\nkaksi");
  });
  it("PPTX: slides in numeric order (slide10 after slide2), with notes", () => {
    const slide = (t: string) => `<p:sld><a:p><a:r><a:t>${t}</a:t></a:r></a:p></p:sld>`;
    const r = extractOffice(zip({
      "ppt/slides/slide10.xml": slide("Ten"),
      "ppt/slides/slide2.xml": slide("Two"),
      "ppt/slides/slide1.xml": slide("One"),
      "ppt/notesSlides/notesSlide2.xml": slide("Say this"),
    }), "pptx");
    assert.equal(r!.pages, 3);
    assert.equal(r!.text, "Slide 1\nOne\n\nSlide 2\nTwo\nNotes: Say this\n\nSlide 3\nTen");
  });
  it("XLSX: shared strings, inline strings and numbers, one row per line", () => {
    const r = extractOffice(zip({
      "xl/workbook.xml": `<workbook><sheets><sheet name="Hinnasto" sheetId="1"/></sheets></workbook>`,
      "xl/sharedStrings.xml": `<sst><si><t>Tuote</t></si><si><t>Hinta</t></si><si><r><t>Sorbify </t></r><r><t>Oil</t></r></si></sst>`,
      "xl/worksheets/sheet1.xml": `<worksheet><sheetData>
        <row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>
        <row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2"><v>24.9</v></c></row>
        <row r="3"><c r="A3" t="inlineStr"><is><t>Uusi</t></is></c></row>
      </sheetData></worksheet>`,
    }), "xlsx");
    assert.equal(r!.text, "Sheet: Hinnasto\nTuote\tHinta\nSorbify Oil\t24.9\nUusi");
  });
  it("an Office file with no text is null, so the route does not call it ready", () => {
    assert.equal(extractOffice(zip({ "word/document.xml": "<w:document/>" }), "docx"), null);
  });
  it("knows the three kinds by extension, nothing else", () => {
    assert.equal(officeKind("b/1_Plan.DOCX"), "docx");
    assert.equal(officeKind("b/deck.pptx"), "pptx");
    assert.equal(officeKind("b/x.pdf"), null);
    assert.equal(decodeXml("&#228;&#x2013;&lt;"), "ä–<");
  });
});

describe("the route reads locally before it meters", () => {
  const src = readFileSync("app/api/vault/extract/route.ts", "utf8");
  it("tries the local read before the model call", () => {
    assert.ok(src.indexOf("extractPdfText(") < src.indexOf("await meter("));
    assert.ok(src.indexOf("extractOffice(") < src.indexOf("await meter("));
  });
  it("never sends an Office file to the API labelled as a PDF", () => {
    assert.doesNotMatch(src, /DOCX \/ PPTX \/ XLSX — attempt Claude/);
  });
});
