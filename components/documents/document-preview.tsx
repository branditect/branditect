"use client";

import { useEffect } from "react";
import Icon from "@/components/icon";
import { previewKindOf, type DocumentLike } from "@/lib/document-actions";
import { useT } from "@/lib/i18n/use-t.tsx";

/**
 * Looking at a document without leaving the page.
 *
 * A PDF renders in an iframe and an image in an <img>, both from a signed URL
 * — the bucket is private, so there is no public address to point at. Anything
 * a browser cannot render (a .docx, a .pptx) says so and offers the download
 * instead of opening a blank grey box, and shows the extracted text when there
 * is any: what the brain read is usually what the person came to check.
 *
 * A pasted entry has no file at all. Its text IS the document, so that is what
 * this shows.
 */
export default function DocumentPreview({
  doc, url, text, loading, error, onClose,
}: {
  doc: DocumentLike;
  /** Signed, expiring. Null for a pasted entry, or while it is being signed. */
  url: string | null;
  /** extracted_text, fetched only when it is what gets shown. */
  text: string | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  const t = useT();
  const kind = previewKindOf(doc);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-ink/60 px-5 py-6"
      role="dialog"
      aria-modal="true"
      aria-label={t("docs.previewOf", { name: doc.file_name })}
      onClick={onClose}
    >
      <div
        className="mx-auto flex h-full w-full max-w-[1000px] flex-col overflow-hidden rounded-panel border border-rule bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-rule px-5 py-3">
          <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{doc.file_name}</span>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 rounded-tile border border-rule-2 px-3 py-1.5 text-2xs font-bold text-ink-2 hover:border-accent-line hover:text-accent-dark"
            >
              {t("docs.openInNewTab")}
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={t("docs.close")}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-nav text-muted-2 hover:bg-tile hover:text-ink-2"
          >
            <Icon name="close" size={14} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-page">
          {loading ? (
            <p className="p-6 text-sm font-medium text-muted">{t("common.loading")}</p>
          ) : error ? (
            <p className="p-6 text-sm font-semibold text-red-600" role="alert">{error}</p>
          ) : kind === "pdf" && url ? (
            <iframe src={url} title={doc.file_name} className="h-full w-full border-0 bg-white" />
          ) : kind === "image" && url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={doc.file_name} className="mx-auto max-h-full max-w-full object-contain p-4" />
          ) : text?.trim() ? (
            <div className="p-6">
              <div className="text-micro font-extrabold uppercase tracking-[.9px] text-faint">
                {t("docs.previewText")}
              </div>
              <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm leading-[1.6] text-ink-2">
                {text}
              </pre>
            </div>
          ) : (
            <p className="p-6 text-sm font-medium text-muted">
              {kind === "none" ? t("docs.previewUnavailable") : t("docs.previewNothing")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
