"use client";

/**
 * The interface language switch. Item 3 of inbox entry 3.
 *
 * TWO PLACES IT WRITES, AND WHY BOTH.
 *
 * The cookie is what the server layout reads on the next request, so it is
 * what makes the first paint correct rather than English-then-Finnish.
 * `brands.interface_language` is the durable answer, so the same person on a
 * different machine gets their own language rather than the browser's.
 *
 * The column does not exist yet — supabase/brand-language.sql is written and
 * not run, per rule 1 of the queue. So the database write is allowed to fail
 * and the switch still works: the cookie holds, the interface changes, and the
 * panel says plainly that the choice is on this browser only. What it must
 * never do is change the language and claim to have saved it.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useBrand } from "@/lib/useBrand";
import { LOCALES, LOCALE_NAME, type Locale } from "@/lib/i18n/index.ts";
import { useLocale, useT, writeLocaleCookie } from "@/lib/i18n/use-t.tsx";

/** The shapes Postgres and PostgREST use to say "no such column". */
function isMissingColumn(message: string): boolean {
  return /column .*interface_language.* does not exist/i.test(message)
    || /interface_language/.test(message) && /schema cache/i.test(message);
}

export default function LanguageSwitch() {
  const t = useT();
  const current = useLocale();
  const router = useRouter();
  const { brand } = useBrand();
  const [pending, start] = useTransition();
  const [localOnly, setLocalOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose(next: Locale) {
    if (next === current) return;
    setError(null);

    // The cookie first: it is the one that cannot fail, and the one the next
    // paint reads.
    writeLocaleCookie(next);

    if (brand?.id) {
      const { error: dbError } = await supabase
        .from("brands").update({ interface_language: next }).eq("id", brand.id);
      // supabase-js resolves { data, error } and never throws, so an unchecked
      // call here would report a saved preference that was never written.
      if (dbError) {
        if (isMissingColumn(dbError.message)) setLocalOnly(true);
        else setError(dbError.message);
      } else {
        setLocalOnly(false);
      }
    } else {
      setLocalOnly(true);
    }

    start(() => router.refresh());
  }

  return (
    <div>
      <div className="text-sm font-semibold text-ink">{t("settings.interfaceLanguage")}</div>
      <p className="mt-1 text-xs font-medium text-muted">{t("settings.interfaceLanguageHelp")}</p>

      <div className="mt-3 flex gap-2">
        {LOCALES.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => choose(l)}
            disabled={pending}
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

      {localOnly && (
        <p className="mt-3 text-xs font-medium text-muted-2">
          {t("settings.languageSavedLocally")}
        </p>
      )}
      {error && <p className="mt-3 text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
