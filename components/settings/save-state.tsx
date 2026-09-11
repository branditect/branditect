"use client";

/**
 * The save button, its pending label and its result, in one place.
 *
 * CRITERION 4 OF spec/settings.md IS THE WHOLE REASON THIS EXISTS. "Every
 * write reports its result. No `.then(({ error }) => { if (!error) … })`.
 * This has now caused two silent failures in this codebase — the onboarding
 * logo upload and the image library inserts — and a settings page that says
 * nothing when a save fails is the third."
 *
 * So a panel cannot render a save button without also rendering somewhere for
 * the answer to go: both come from here. A panel hands it a function that
 * returns an error message or null, and this shows "Saving…", then either
 * "Saved" or the message. There is no path through it that shows nothing.
 */
import { useState } from "react";
import { useT } from "@/lib/i18n/use-t.tsx";

export type SaveFn = () => Promise<string | null>;

export default function SaveRow({ save, disabled }: { save: SaveFn; disabled?: boolean }) {
  const t = useT();
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (state === "saving") return;
    setState("saving");
    setError(null);
    let message: string | null;
    try {
      message = await save();
    } catch (e) {
      // A throw is a failure too. Reporting only the resolved { error } was
      // how the earlier silent failures looked like successes.
      message = e instanceof Error ? e.message : t("settings.saveFailed");
    }
    if (message) {
      setError(message);
      setState("idle");
    } else {
      setState("saved");
    }
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={disabled || state === "saving"}
          className={
            disabled || state === "saving"
              ? "rounded-[9px] bg-tile px-[18px] py-[9px] text-[13px] font-extrabold text-muted-2"
              : "rounded-[9px] bg-grad-mark px-[18px] py-[9px] text-[13px] font-extrabold text-white drop-shadow-btn"
          }
        >
          {state === "saving" ? t("settings.saving") : t("settings.save")}
        </button>
        {state === "saved" && !error && (
          <span className="text-xs font-bold text-good">{t("settings.saved")}</span>
        )}
      </div>
      {error && <p role="alert" className="mt-2 text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

/** A label and its field, on the reference's two-column grid. */
export function Row({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="grid grid-cols-1 items-start gap-1.5 border-t border-rule py-[13px] sm:grid-cols-[172px_minmax(0,1fr)] sm:gap-4">
      <div className="pt-0 text-[13px] font-bold text-ink-2 sm:pt-[9px]">{label}</div>
      <div>
        {children}
        {hint && <p className="mt-1.5 text-xs leading-relaxed text-muted-2">{hint}</p>}
      </div>
    </div>
  );
}

/** The panel shell: an icon tile, a heading, a sub-line. */
export function Panel({
  tile, title, sub, children,
}: { tile: React.ReactNode; title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="mt-3.5 rounded-panel border border-rule bg-card px-[22px] pb-5 pt-[18px] drop-shadow-panel">
      <div className="flex items-center gap-[11px] pb-1">
        {tile}
        <div>
          <h2 className="text-[16px] font-extrabold tracking-[-0.2px] text-ink">{title}</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{sub}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
