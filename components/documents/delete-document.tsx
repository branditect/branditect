"use client";

import { useEffect, useRef } from "react";
import Icon from "@/components/icon";
import { deleteCopy } from "@/lib/document-actions";
import { useT } from "@/lib/i18n/use-t.tsx";

/**
 * The confirm step before a document is deleted.
 *
 * The list used to delete on one click of a grey × that only appeared on
 * hover. Two things were wrong with that: it was hard to find on purpose, for
 * an action that cannot be undone, and it never said what deleting actually
 * costs — the document leaves the brand brain, so Studio and AI Chat stop
 * being able to cite it. That consequence is the reason to read the dialog.
 *
 * Modelled on components/products/remove-product.tsx, including focus landing
 * on Cancel: a stray Enter must not be what deletes a file.
 */
export default function DeleteDocumentDialog({
  fileName, busy, error, onCancel, onConfirm,
}: {
  fileName: string;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = useT();
  const copy = deleteCopy(fileName, t);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { cancelRef.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, busy]);

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-ink/45 px-5"
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
      onClick={() => { if (!busy) onCancel(); }}
    >
      <div
        className="w-full max-w-[440px] rounded-panel border border-rule bg-card p-6 drop-shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-tile bg-red-50 text-red-500">
            <Icon name="trash" size={17} />
          </span>
          <div className="min-w-0">
            <h2 className="text-h3 font-bold leading-[1.3] text-ink">{copy.title}</h2>
            <p className="mt-2 text-sm font-medium leading-[1.55] text-muted">{copy.body}</p>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-tile bg-red-50 px-3 py-2 text-xs font-semibold text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-tile border border-rule-2 bg-white px-4 py-2 text-sm font-bold text-ink-2 hover:border-muted disabled:opacity-60"
          >
            {copy.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-tile bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60"
          >
            {busy ? t("common.processing") : copy.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
