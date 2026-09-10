/**
 * The interface dictionary, and the one function that reads it.
 *
 * Inbox entry 3 of branditect-ui/spec/inbox.md. `en.ts` and `fi.ts` were
 * written by the design side; this file is the runtime around them and the
 * only place a key is ever looked up.
 *
 * NO REACT IN HERE. The provider and the hook live in ./use-t.tsx. Keeping the
 * lookup a plain function means it can be tested in node, called from a server
 * component, and used in a route handler without dragging a client boundary
 * along with it.
 *
 * FALLBACK. `fi` is typed `Record<StringKey, string>`, so a missing Finnish
 * string is a compile error rather than an English word on a Finnish screen.
 * The runtime fallback below is still there for the case the types cannot see:
 * a locale value that arrives from the database, from a cookie, or from a URL,
 * naming a language nobody has written a dictionary for.
 */
import { en, type StringKey } from "./en.ts";
import { fi } from "./fi.ts";

export type { StringKey };
export type Locale = "en" | "fi";

export const LOCALES: readonly Locale[] = ["en", "fi"];
export const DEFAULT_LOCALE: Locale = "en";

/** What the language switch shows. Each language names itself, in itself. */
export const LOCALE_NAME: Record<Locale, string> = { en: "English", fi: "Suomi" };

const DICTIONARIES: Record<Locale, Partial<Record<StringKey, string>>> = { en, fi };

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

/**
 * Whatever arrived, as a locale.
 *
 * Everything that produces one of these — the `interface_language` column, a
 * cookie, a select element — can produce null, an empty string, or a language
 * with no dictionary. All of them mean English, and none of them is worth
 * throwing over. The column does not exist until supabase/brand-language.sql
 * is run, so `undefined` is the normal case today, not an error case.
 */
export function toLocale(v: unknown): Locale {
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

/**
 * The cookie the server layout reads to know the language.
 *
 * It lives HERE, not beside the hook that writes it, and that is not tidiness.
 * A "use client" module's exports reach a server component as client-reference
 * proxies rather than as their values, so `cookies().get(LOCALE_COOKIE)` was
 * looking up a proxy object and quietly finding nothing. The page rendered, no
 * error appeared anywhere, and every screen was English with a Finnish cookie
 * sitting right there in the request. Found by printing the resolved locale
 * into the page, not by reading the code.
 */
export const LOCALE_COOKIE = "bd_locale";

export type Vars = Record<string, string | number>;

/**
 * Fill {placeholders}.
 *
 * Never build a sentence by concatenating keys — word order differs by
 * language, and Finnish puts the case ending where English puts a preposition.
 * A placeholder that has no value is left visible rather than blanked: an
 * empty gap in a sentence reads as a copy mistake, "{count}" reads as a bug
 * and gets fixed.
 */
export function interpolate(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole);
}

/** Every placeholder a string expects, in order of first appearance. */
export function placeholdersIn(text: string): string[] {
  const found: string[] = [];
  const re = /\{(\w+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (found.indexOf(m[1]) === -1) found.push(m[1]);
  }
  return found;
}

/**
 * One key, one language, one string.
 *
 * A key with no entry in any dictionary returns the key itself. That is
 * deliberate: `knowledge.emptyState` on screen is unmistakable and greppable,
 * where a blank space or a thrown error is neither. The scanner test is what
 * stops it happening, not this.
 */
export function translate(locale: Locale, key: StringKey, vars?: Vars): string {
  const text = DICTIONARIES[locale]?.[key] ?? en[key] ?? key;
  return interpolate(text, vars);
}
