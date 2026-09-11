"use client";

/**
 * Section 3 of spec/settings.md. Two cards, not two rows.
 *
 * "The layout carries the argument: one is labelled for you, the other for
 * your customers. The single most common mistake here is assuming one switch
 * does both, and a row-and-dropdown pair invites exactly that."
 *
 * Both cards are the same `LanguageSwitch` with a different field, so there
 * is one implementation of read-the-brand, write-the-column, report-the-
 * result. The eyebrow above each is what makes them two questions.
 *
 * The reference tints the interface card violet and the output card orange.
 * There is no violet in the palette, so the interface card uses the lavender
 * pair that is there and the output card keeps the accent — the contrast
 * between them, which is the point, survives.
 */
import { useT } from "@/lib/i18n/use-t.tsx";
import LanguageSwitch from "@/components/language-switch";

export default function LanguagePanel() {
  const t = useT();
  return (
    <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="rounded-card border border-rule-3 bg-card p-3.5">
        <div className="text-micro font-extrabold uppercase tracking-[.9px] text-lav-ink">
          {t("settings.forYou")}
        </div>
        <div className="mt-1.5">
          <LanguageSwitch field="interface" />
        </div>
      </div>
      <div className="rounded-card border border-accent-line bg-card p-3.5">
        <div className="text-micro font-extrabold uppercase tracking-[.9px] text-accent-dark">
          {t("settings.forCustomers")}
        </div>
        <div className="mt-1.5">
          <LanguageSwitch field="output" />
        </div>
      </div>
    </div>
  );
}
