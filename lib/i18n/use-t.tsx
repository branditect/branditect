"use client";

/**
 * The React side of the dictionary: one provider, one hook.
 *
 * WHY THE LOCALE COMES FROM A COOKIE AND NOT FROM `useBrand`.
 *
 * The brand loads asynchronously. If the locale came from it, every Finnish
 * screen would render in English first and then swap, on every navigation.
 * Reading a cookie in the server layout means the first paint is already
 * right, and there is no hydration mismatch — the server and the client render
 * from the same value, because the server passed it down as a prop.
 *
 * Reading the cookie in a client component instead would be the classic
 * version of the bug CLAUDE.md documents at length: the server has no
 * `document`, so it renders English, the client reads the cookie and renders
 * Finnish, React finds a mismatch and the page never hydrates. From the
 * outside that looks like a wedged auth call.
 *
 * The database column is still the source of truth. `useBrandLocale` below
 * reconciles the two: when a brand loads with an `interface_language` the
 * cookie does not have, it writes the cookie so the NEXT paint is right. It
 * does not re-render the current one, on purpose — a language change mid-page
 * is worse than one navigation in the wrong language.
 */
import { createContext, useContext, useEffect } from "react";
import {
  DEFAULT_LOCALE, LOCALE_COOKIE, translate, toLocale,
  type Locale, type StringKey, type Vars,
} from "./index.ts";

export { LOCALE_COOKIE };

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/**
 * `const t = useT()` then `t("nav.home")`.
 *
 * The key is typed, so a typo is a compile error rather than the literal
 * string "nav.hoem" on screen.
 */
export function useT(): (key: StringKey, vars?: Vars) => string {
  const locale = useLocale();
  return (key, vars) => translate(locale, key, vars);
}

/** Write the cookie. One year, lax, site-wide — it is a preference, not a secret. */
export function writeLocaleCookie(locale: Locale): void {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

export function readLocaleCookie(): Locale | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  return m ? toLocale(m[1]) : null;
}

/**
 * Keep the cookie in step with the brand's `interface_language`.
 *
 * Mounted once in the app shell. Takes the value the brand actually has —
 * `undefined` until supabase/brand-language.sql is run, which `toLocale`
 * reads as English — and writes it to the cookie when it differs. The current
 * render is left alone.
 */
export function useBrandLocale(interfaceLanguage: unknown): void {
  useEffect(() => {
    if (interfaceLanguage === undefined || interfaceLanguage === null) return;
    const wanted = toLocale(interfaceLanguage);
    if (readLocaleCookie() !== wanted) writeLocaleCookie(wanted);
  }, [interfaceLanguage]);
}
