/**
 * What you can do with one document in Knowledge ▸ Documents.
 *
 * The list could delete, and only by hovering a row until a grey × appeared,
 * with no confirmation and no check that the delete had happened. There was no
 * way to look at a file you had uploaded, or to get it back out. Asked for:
 * "add an option to delete them or to preview or download them."
 *
 * The decisions live here rather than in the page so they can be tested, and
 * so the page does not have to know which file types a browser can render.
 */
import type { StringKey } from "./i18n/en.ts";

/** A document as the list holds it. Only the fields these decisions need. */
export interface DocumentLike {
  file_name: string;
  file_type?: string | null;
  storage_path?: string | null;
  file_url?: string | null;
  extracted_text?: string | null;
  status?: string | null;
}

/**
 * How a document can be shown in the app.
 *
 * "none" is an honest answer: a browser cannot render a .docx or a .pptx, and
 * a preview that opens a blank grey box is worse than a download button. Those
 * offer their extracted text instead when there is any, because what the brain
 * read is usually what the person wants to check.
 */
export type PreviewKind = "pdf" | "image" | "text" | "none";

const IMAGE = /\.(png|jpe?g|gif|webp|avif|svg)$/i;
const PDF = /\.pdf$/i;

export function extensionOf(fileName: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(fileName.trim());
  return m ? m[1].toLowerCase() : "";
}

export function previewKindOf(doc: DocumentLike): PreviewKind {
  const name = doc.file_name ?? "";
  const type = (doc.file_type ?? "").toLowerCase();
  // A pasted entry has no file at all: its text IS the document.
  if (!hasFile(doc)) return doc.extracted_text?.trim() ? "text" : "none";
  if (PDF.test(name) || type === "pdf" || type === "application/pdf") return "pdf";
  if (IMAGE.test(name) || type.startsWith("image/")) return "image";
  return doc.extracted_text?.trim() ? "text" : "none";
}

/** A row with no stored object is a pasted entry: nothing to download. */
export function hasFile(doc: DocumentLike): boolean {
  return Boolean((doc.storage_path ?? "").trim() || (doc.file_url ?? "").trim());
}

export function canDownload(doc: DocumentLike): boolean {
  return hasFile(doc);
}

export function canPreview(doc: DocumentLike): boolean {
  return previewKindOf(doc) !== "none";
}

/**
 * What the confirm dialog says.
 *
 * It names the file, and it says the part people do not expect: the document
 * leaves the brand brain, so Studio and AI Chat stop being able to cite it.
 * That is the consequence worth knowing, and a generic "are you sure" is the
 * dialog everyone clicks through without reading.
 */
export interface Tr { (key: StringKey, vars?: Record<string, string | number>): string }

export function deleteCopy(fileName: string, t: Tr): { title: string; body: string; confirm: string; cancel: string } {
  return {
    title: t("docs.deleteTitle", { name: fileName }),
    body: t("docs.deleteBody"),
    confirm: t("docs.deleteConfirm"),
    cancel: t("common.cancel"),
  };
}
