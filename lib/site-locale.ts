/**
 * Language on the marketing site. Inbox entry 7b.
 *
 * ── WHY NOT THE COOKIE ───────────────────────────────────────────────────
 *
 * `bd_locale` works behind the login because there is a session and nobody is
 * indexing it. A public page switched by cookie serves one URL with two
 * different languages, so Google indexes whichever it saw first and the
 * Finnish version does not exist as far as search is concerned — which
 * defeats the only reason a Finnish marketing page exists.
 *
 * So the site uses real routes: `/fi`, `/fi/pricing`, `/fi/about`, with
 * `hreflang` pointing each at its pair, and a toggle that changes the URL.
 * Behind the login the cookie stays. Two mechanisms, because they answer
 * different questions — the site needs to be findable, the app needs to
 * remember you. What matches is the *toggle*: same two options, same labels,
 * same place.
 *
 * ── NO AUTOMATIC REDIRECT ────────────────────────────────────────────────
 *
 * A signed-in Finnish user landing on `/` stays on `/`. Redirecting by
 * `Accept-Language` is how you get a Finn who cannot reach the English page
 * and an American who cannot reach the Finnish one, and it makes the URL a
 * liar: the same address serves different content to different people, which
 * is the cookie problem wearing a different hat.
 *
 * `Accept-Language` is therefore read by nothing here. The entry allows it to
 * decide "which one the toggle points at first" — and the toggle offers both
 * at all times, so there is nothing left for it to decide. Machinery that
 * changes no outcome is not built.
 */

/**
 * The public origin. hreflang is ignored unless it is absolute, so this is
 * what `metadataBase` in the root layout is set from, and what the sitemap
 * prefixes. One value, because two would drift and only one of them would
 * be the one search engines saw.
 */
export const SITE_ORIGIN = "https://www.branditect.io";

export const SITE_LOCALES = ["en", "fi"] as const;
export type SiteLocale = (typeof SITE_LOCALES)[number];
export const DEFAULT_SITE_LOCALE: SiteLocale = "en";

/** The public pages, as ids rather than paths. */
export const SITE_PAGES = ["home", "pricing", "about"] as const;
export type SitePage = (typeof SITE_PAGES)[number];

const SEGMENT: Record<SitePage, string> = { home: "", pricing: "pricing", about: "about" };

/**
 * THE INDEXING SWITCH.
 *
 * `/fi` reads every `site.*`, `plan.*`, `cmp.*` and `credit.*` key, but some
 * copy still has no key and renders in English: the generated list is
 * branditect-ui/spec/i18n-gap-site.md (`npm run i18n:gap:site`). Until that
 * list is empty:
 *
 *   - the fi routes are `noindex`, because a page indexed as Finnish that is
 *     partly English is worse than no Finnish page at all: it is the
 *     duplicate-content problem this entry is trying to avoid, inverted;
 *   - the sitemap lists no `fi` alternate, and `<html lang>` stays "en".
 *
 * THE TOGGLE IS NOT BEHIND THIS ANY MORE. It used to be, on the reasoning
 * that offering "Suomi" over English copy is a promise the page does not keep.
 * Saara's call on 2026-09-14 was to show it now: with the round-two copy most
 * of every Finnish page is Finnish, and a visitor can use it before a crawler
 * is told to. So a person can reach /fi, and search still cannot. No Finnish
 * has been invented here.
 */
export const FI_COPY_READY = false;

export function isSiteLocale(v: unknown): v is SiteLocale {
  return typeof v === "string" && (SITE_LOCALES as readonly string[]).includes(v);
}

/** The path for one page in one language. Always absolute, never trailing-slashed. */
export function sitePath(locale: SiteLocale, page: SitePage): string {
  const seg = SEGMENT[page];
  if (locale === DEFAULT_SITE_LOCALE) return seg ? `/${seg}` : "/";
  return seg ? `/${locale}/${seg}` : `/${locale}`;
}

/**
 * Which language and which page a pathname is.
 *
 * Returns null for anything that is not a public page, so the nav does not
 * try to find a Finnish twin for `/settings`.
 */
export function readSitePath(pathname: string): { locale: SiteLocale; page: SitePage } | null {
  const clean = pathname.replace(/\/+$/, "") || "/";
  for (const locale of SITE_LOCALES) {
    for (const page of SITE_PAGES) {
      if (sitePath(locale, page) === clean) return { locale, page };
    }
  }
  return null;
}

/** The same page in the other language, or null when there is no pair. */
export function otherLanguage(pathname: string): { locale: SiteLocale; href: string } | null {
  const here = readSitePath(pathname);
  if (!here) return null;
  const other = here.locale === "en" ? "fi" : "en";
  return { locale: other, href: sitePath(other, here.page) };
}

/**
 * `alternates` for a page's metadata, from the page's own locale.
 *
 * Both directions on every page, plus `x-default` on the English one —
 * hreflang has to be reciprocal or search engines discard it, which is the
 * commonest way this is got wrong.
 *
 * THE CANONICAL IS THE PAGE ITSELF, in its own language. It used to be the
 * English path for both, on the reasoning that the Finnish page is a
 * translation. Search engines read a cross-language canonical as "this page
 * is a duplicate of that one" and drop the Finnish URL from the index, which
 * throws away the hreflang with it and leaves `/fi` unfindable — the exact
 * outcome the routes exist to prevent. A translation is not a duplicate.
 */
export function alternatesFor(page: SitePage, locale: SiteLocale = DEFAULT_SITE_LOCALE): {
  canonical: string;
  languages: Record<string, string>;
} {
  return {
    canonical: sitePath(locale, page),
    languages: {
      en: sitePath("en", page),
      fi: sitePath("fi", page),
      "x-default": sitePath("en", page),
    },
  };
}

/**
 * Where the pricing heading breaks: how many words of `site.pricing.h1` sit on
 * the first line. English "The commercial brain / for your brand.", Finnish
 * "Brändisi / kaupalliset aivot." The phrase runs in the opposite order, so
 * the break cannot be at the same word, and a count keeps the Finnish words
 * in the dictionary where they belong. The test checks where it lands.
 */
export const PRICING_H1_BREAK_AFTER: Record<SiteLocale, number> = { en: 3, fi: 1 };

/** What a locale is called, in its own language. Matches the Settings switch. */
export const SITE_LOCALE_NAME: Record<SiteLocale, string> = { en: "English", fi: "Suomi" };
