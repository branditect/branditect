import type { MetadataRoute } from "next";
// Relative, with the extension: the test suite runs under Node's native
// TypeScript, which does not resolve the "@/" alias — and a sitemap worth
// asserting is one a test can call rather than pattern-match.
import { FI_COPY_READY, SITE_ORIGIN, SITE_PAGES, sitePath, type SitePage } from "../lib/site-locale.ts";

/* One origin, shared with metadataBase. See lib/site-locale.ts. */
const BASE = SITE_ORIGIN;

/**
 * The public routes, and only those, in both languages. Everything behind a
 * session is left out:
 * the app itself, the onboarding flow at /start, and the brand kit portal at
 * /k, whose links are meant to be sent to one person rather than found.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const priority: Record<SitePage, number> = { home: 1, about: 0.8, pricing: 0.8 };

  return SITE_PAGES.map((page) => ({
    url: `${BASE}${sitePath("en", page)}`,
    changeFrequency: "monthly" as const,
    priority: priority[page],
    // Reciprocal, and only once the Finnish page is actually Finnish.
    // Listing a page that is noindex tells a crawler two contradictory
    // things and gets the hreflang discarded along with it.
    ...(FI_COPY_READY
      ? { alternates: { languages: { en: `${BASE}${sitePath("en", page)}`, fi: `${BASE}${sitePath("fi", page)}` } } }
      : {}),
  }));
}
