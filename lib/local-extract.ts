/**
 * Reading an upload's text on our own server, without a model.
 *
 * /api/vault/extract used to send every file to Sonnet and ask it to retype
 * the text. That is the expensive direction — output tokens cost five times
 * input — and max_tokens (4000, about 12k characters) cut every longer
 * document short without saying so. DOCX, PPTX and XLSX were sent labelled
 * application/pdf, which the API rejects, so they were never read at all.
 *
 * A PDF with a text layer, and every Office file, holds its text as data.
 * Reading it here is free, complete and exact. The model is still used for
 * what only it can read: images, and scanned PDFs with no text layer — for
 * those this returns null and the route falls back to Claude as before.
 */
import { unzipSync, strFromU8 } from "fflate";

export interface LocalText {
  text: string;
  pages: number;
  via: "pdf-text" | "docx" | "pptx" | "xlsx";
}

/**
 * When a PDF's own text is enough. A scan has pages with no text at all, or a
 * few characters of page numbers; a brand guideline has some image-only pages
 * (a full-bleed photo, a logo sheet) among ones with prose. So: most pages
 * must carry text, and on average a real amount of it.
 */
export const MIN_CHARS_PER_PAGE = 200;
export const MIN_TEXT_PAGE_SHARE = 0.6;
const TEXT_PAGE_CHARS = 40;

export function pdfTextIsEnough(pages: string[]): boolean {
  if (pages.length === 0) return false;
  const lens = pages.map((p) => p.replace(/\s+/g, "").length);
  const total = lens.reduce((s, n) => s + n, 0);
  const withText = lens.filter((n) => n >= TEXT_PAGE_CHARS).length;
  return total / pages.length >= MIN_CHARS_PER_PAGE && withText / pages.length >= MIN_TEXT_PAGE_SHARE;
}

export async function extractPdfText(bytes: Uint8Array): Promise<LocalText | null> {
  const { getDocumentProxy, extractText } = await import("unpdf");
  // pdf.js detaches the buffer it is handed; the caller still needs its copy.
  const pdf = await getDocumentProxy(bytes.slice());
  try {
    const { totalPages, text } = await extractText(pdf, { mergePages: false });
    const pages = text.map(tidy);
    if (!pdfTextIsEnough(pages)) return null;
    return { text: pages.filter(Boolean).join("\n\n"), pages: totalPages, via: "pdf-text" };
  } finally {
    // unpdf's serverless pdf.js build may not expose destroy(); nothing leaks without it.
    const d = (pdf as { destroy?: () => Promise<void> }).destroy;
    if (typeof d === "function") await d.call(pdf).catch(() => undefined);
  }
}

/* ── Office files: a zip of XML ─────────────────────────────────────────── */

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

export function decodeXml(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

function tidy(s: string): string {
  return s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** The text runs of each paragraph, one paragraph per line. */
function paragraphs(xml: string, para: string, run: string): string[] {
  const out: string[] = [];
  const paraRe = new RegExp(`<${para}[\\s>][\\s\\S]*?</${para}>`, "g");
  const runRe = new RegExp(`<${run}(?:\\s[^>]*)?>([\\s\\S]*?)</${run}>|<(?:w:tab|a:tab)\\s*/>|<(?:w:br|a:br)(?:\\s[^>]*)?/>`, "g");
  for (const p of xml.match(paraRe) ?? []) {
    let line = "";
    for (const m of Array.from(p.matchAll(runRe))) {
      if (m[1] !== undefined) line += decodeXml(m[1]);
      else line += m[0].includes("tab") ? "\t" : "\n";
    }
    if (line.trim()) out.push(line.trim());
  }
  return out;
}

function numbered(files: Record<string, Uint8Array>, re: RegExp): string[] {
  return Object.keys(files)
    .filter((k) => re.test(k))
    .sort((a, b) => Number(a.match(/(\d+)\.xml$/)?.[1] ?? 0) - Number(b.match(/(\d+)\.xml$/)?.[1] ?? 0));
}

export function extractDocx(files: Record<string, Uint8Array>): string {
  const parts = ["word/document.xml", ...numbered(files, /^word\/(header|footer|footnotes)\d*\.xml$/)];
  return parts
    .filter((k) => files[k])
    .map((k) => paragraphs(strFromU8(files[k]), "w:p", "w:t").join("\n"))
    .filter(Boolean)
    .join("\n\n");
}

export function extractPptx(files: Record<string, Uint8Array>): { text: string; pages: number } {
  const slides = numbered(files, /^ppt\/slides\/slide\d+\.xml$/);
  const text = slides
    .map((k, i) => {
      const body = paragraphs(strFromU8(files[k]), "a:p", "a:t").join("\n");
      const notesKey = `ppt/notesSlides/notesSlide${k.match(/(\d+)\.xml$/)![1]}.xml`;
      const notes = files[notesKey] ? paragraphs(strFromU8(files[notesKey]), "a:p", "a:t").join("\n") : "";
      return [`Slide ${i + 1}`, body, notes && `Notes: ${notes}`].filter(Boolean).join("\n");
    })
    .join("\n\n");
  return { text, pages: slides.length };
}

export function extractXlsx(files: Record<string, Uint8Array>): { text: string; pages: number } {
  const shared: string[] = [];
  const sst = files["xl/sharedStrings.xml"];
  if (sst) {
    for (const si of strFromU8(sst).match(/<si>[\s\S]*?<\/si>/g) ?? []) {
      shared.push(Array.from(si.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g), (m) => decodeXml(m[1])).join(""));
    }
  }
  const names = Array.from(
    strFromU8(files["xl/workbook.xml"] ?? new Uint8Array()).matchAll(/<sheet\s[^>]*name="([^"]*)"/g),
    (m) => decodeXml(m[1]),
  );
  const sheets = numbered(files, /^xl\/worksheets\/sheet\d+\.xml$/);
  const text = sheets
    .map((k, i) => {
      const rows: string[] = [];
      for (const row of strFromU8(files[k]).match(/<row[\s>][\s\S]*?<\/row>/g) ?? []) {
        const cells: string[] = [];
        for (const c of row.match(/<c[\s>][\s\S]*?<\/c>|<c\s[^>]*\/>/g) ?? []) {
          const type = c.match(/\st="([^"]+)"/)?.[1];
          const v = c.match(/<v>([\s\S]*?)<\/v>/)?.[1];
          if (type === "s" && v !== undefined) cells.push(shared[Number(v)] ?? "");
          else if (type === "inlineStr") cells.push(Array.from(c.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g), (m) => decodeXml(m[1])).join(""));
          else cells.push(v !== undefined ? decodeXml(v) : "");
        }
        if (cells.some((x) => x.trim())) rows.push(cells.join("\t").replace(/\t+$/, ""));
      }
      return rows.length ? [`Sheet: ${names[i] ?? i + 1}`, ...rows].join("\n") : "";
    })
    .filter(Boolean)
    .join("\n\n");
  return { text, pages: sheets.length };
}

export type OfficeKind = "docx" | "pptx" | "xlsx";

export function officeKind(path: string): OfficeKind | null {
  const m = path.toLowerCase().match(/\.(docx|pptx|xlsx)$/);
  return m ? (m[1] as OfficeKind) : null;
}

/** Only the XML parts we read are inflated; media inside the zip is skipped. */
export function extractOffice(bytes: Uint8Array, kind: OfficeKind): LocalText | null {
  const files = unzipSync(bytes, { filter: (f) => f.name.endsWith(".xml") });
  let text: string;
  let pages: number;
  if (kind === "docx") {
    text = extractDocx(files);
    pages = Math.max(1, Math.ceil(text.length / 3000));
  } else {
    ({ text, pages } = kind === "pptx" ? extractPptx(files) : extractXlsx(files));
  }
  text = tidy(text);
  return text ? { text, pages: Math.max(1, pages), via: kind } : null;
}
