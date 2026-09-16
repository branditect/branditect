"use client";

import { useEffect, useRef } from "react";
import Icon from "@/components/icon";
import { confirmCopy } from "@/lib/product-delete";
import { useT } from "@/lib/i18n/use-t.tsx";

/**
 * The confirm step before a product is removed.
 *
 * It names the product, because a generic "are you sure" is the dialog people
 * click through without reading. It says what actually happens, including that
 * the costs and guardrails are kept, so the decision is informed rather than
 * frightening.
 */
export default function RemoveProductDialog({
  name, busy, onCancel, onConfirm,
}: {
  name: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = useT();
  const copy = confirmCopy(name, t);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus lands on Cancel, not on the destructive button. A stray Enter should
  // not be what removes a product.
  useEffect(() => { cancelRef.current?.focus(); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-ink/45 px-5"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-title"
        className="w-full max-w-[430px] rounded-panel bg-card p-6 drop-shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="remove-title" className="text-h3 font-bold">{copy.title}</h2>
        <p className="mt-2.5 text-sm font-normal leading-[1.6] text-muted">{copy.body}</p>
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-tile border border-rule-2 bg-card px-5 py-2.5 text-sm font-bold text-ink-2 hover:border-accent-line"
          >
            {t("products.keepIt")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-tile bg-accent px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {busy ? t("product.removing") : copy.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}

/** The undo bar. Restoring is one click for as long as it is on screen. */
export function UndoBar({
  name, onUndo, onDismiss,
}: {
  name: string;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  const t = useT();
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 12_000);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-3 rounded-pill bg-ink px-5 py-3 text-sm font-semibold text-white shadow-float"
    >
      <Icon name="check" size={14} />
      <span>{t("product.removed", { name })}</span>
      <button
        type="button"
        onClick={onUndo}
        className="rounded-pill bg-white/15 px-3.5 py-1.5 text-xs font-bold hover:bg-white/25"
      >
        {t("products.undo")}
      </button>
    </div>
  );
}
