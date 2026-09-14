"use client";

/**
 * The language switch. Item 3 of inbox entry 3, and section 3 of
 * spec/settings.md.
 *
 * ONE COMPONENT, TWO FIELDS. `interface_language` is what Saara reads;
 * `output_language` is what her customers read. They are two different
 * questions and the Settings page asks them as two cards, but the mechanics
 * are identical — read the brand, write the column, report the result — and
 * two copies of that drift. The field is a prop.
 *
 * The cookie belongs to the interface only. There is no first-paint problem
 * for the output language: nothing on screen is rendered in it.
 *
 * TWO PLACES THE INTERFACE SWITCH WRITES, AND WHY BOTH.
 *
 * The cookie is what the server layout reads on the next request, so it is
 * what makes the first paint correct rather than English-then-Finnish.
 * `brands.interface_language` is the durable answer, so the same person on a
 * different machine gets their own language rather than the browser's.
 *
 * `interface_language` is a real column since 10 Sep, so the write is expected
 * to succeed and a failure is reported as one. The browser-only note survives
 * for the case that is still real — no brand row yet, during onboarding —
 * where the cookie is genuinely the only place the choice can live. What this
 * must never do is change the language and claim to have saved it.
 *
 * TWO LOOKS, ONE SWITCH. `variant="toggle"` is the English | Suomi pill in
 * the sidebar, the same control as the one in the public site's nav (inbox 7b:
 * "same two options, same labels, same place"). Before it, the only way to
 * change language behind the login was two cards deep in Settings, so someone
 * who had just used the toggle on the site could not find it once signed in.
 * It is a look, not a second implementation: the writes below are shared.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useBrand } from "@/lib/useBrand";
import { LOCALES, LOCALE_NAME, toLocale, type Locale } from "@/lib/i18n/index.ts";
import { useLocale, useT, writeLocaleCookie } from "@/lib/i18n/use-t.tsx";

export type LanguageField = "interface" | "output";

export default function LanguageSwitch({
  field = "interface",
  variant = "cards",
}: { field?: LanguageField; variant?: "cards" | "toggle" } = {}) {
  const t = useT();
  const interfaceLocale = useLocale();
  const router = useRouter();
  const { brand, loading: brandLoading } = useBrand();
  const [pending, start] = useTransition();
  const [localOnly, setLocalOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputLocale, setOutputLocale] = useState<Locale | null>(null);

  // The output language has no cookie and no server render behind it, so it
  // is read from the brand and held here. `undefined` while the brand loads,
  // which toLocale reads as English.
  const stored = toLocale(brand?.output_language);
  const current = field === "interface" ? interfaceLocale : (outputLocale ?? stored);
  const column = field === "interface" ? "interface_language" : "output_language";

  async function choose(next: Locale) {
    // NOT BEFORE THE BRAND HAS LOADED. With no brand yet this takes the
    // "no brand row" branch below: the cookie is written and the column is
    // not. LocaleSync then finds the brand's stored language, disagrees with
    // the cookie, and puts the old language back on the next load, so the
    // choice silently reverts. The Settings cards always had this race; the
    // sidebar toggle is on screen from the first paint, which is what made it
    // likely. Found by scripts/language-toggle-ui.mjs on a slow sign-in.
    if (brandLoading) return;
    if (next === current) return;
    setError(null);

    if (field === "interface") {
      // The cookie first: it is the one that cannot fail, and the one the
      // next paint reads.
      writeLocaleCookie(next);
    } else {
      // Optimistic, because there is no cookie to hold the answer and no
      // re-render that would bring it back. Rolled back if the write fails.
      setOutputLocale(next);
    }

    if (brand?.id) {
      // `.select()` for the same reason as brand-panel: an UPDATE filtered
      // out by RLS resolves with no error and no rows, so the absence of an
      // error is not evidence that anything was written.
      const { data: written, error: dbError } = await supabase
        .from("brands").update({ [column]: next }).eq("id", brand.id).select("id");
      // supabase-js resolves { data, error } and never throws, so an unchecked
      // call here would report a saved preference that was never written.
      if (!dbError && (!written || written.length === 0)) {
        setLocalOnly(field === "interface");
        if (field === "output") setOutputLocale(current);
      } else if (dbError) {
        setError(dbError.message);
        if (field === "output") setOutputLocale(current);
      } else {
        setLocalOnly(false);
      }
    } else {
      // Only the interface can live in a browser. An output language with
      // nowhere to be stored has not been set, and saying otherwise would
      // promise Studio a language it will not read.
      if (field === "output") setOutputLocale(current);
      setLocalOnly(true);
    }

    if (field === "interface") start(() => router.refresh());
  }

  // In the sidebar the notes take a line of their own under the row rather
  // than squeezing in beside the pill (the root is `contents` there).
  const noteClass = variant === "toggle" ? "basis-full px-[9px] pt-1 text-2xs font-medium" : "mt-3 text-xs font-medium";
  const notes = (
    <>
      {localOnly && (
        <p className={`${noteClass} text-muted-2`}>
          {t("settings.languageSavedLocally")}
        </p>
      )}
      {error && <p className={`${noteClass} text-danger`}>{error}</p>}
    </>
  );

  if (variant === "toggle") {
    return (
      <div className="contents">
        <div
          role="group"
          aria-label={t("settings.language")}
          className="inline-flex items-center gap-0.5 rounded-pill border border-rule-2 bg-card p-0.5"
        >
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => choose(l)}
              disabled={pending || brandLoading}
              aria-pressed={l === current}
              className={
                l === current
                  ? "rounded-pill bg-ink px-2.5 py-[3px] text-2xs font-extrabold text-white"
                  : "rounded-pill px-2.5 py-[3px] text-2xs font-extrabold text-muted hover:text-ink"
              }
            >
              {LOCALE_NAME[l]}
            </button>
          ))}
        </div>
        {notes}
      </div>
    );
  }

  return (
    <div>
      <div className="text-sm font-semibold text-ink">
        {t(field === "interface" ? "settings.interfaceLanguage" : "settings.outputLanguage")}
      </div>
      <p className="mt-1 text-xs font-medium text-muted">
        {t(field === "interface" ? "settings.interfaceLanguageHelp" : "settings.outputLanguageHelp")}
      </p>

      <div className="mt-3 flex gap-2">
        {LOCALES.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => choose(l)}
            disabled={pending || brandLoading}
            aria-pressed={l === current}
            className={
              l === current
                ? "rounded-card bg-grad-mark px-4 py-2 text-sm font-bold text-white drop-shadow-btn"
                : "rounded-card bg-white px-4 py-2 text-sm font-semibold text-ink drop-shadow-btn"
            }
          >
            {LOCALE_NAME[l]}
          </button>
        ))}
      </div>

      {notes}
    </div>
  );
}
