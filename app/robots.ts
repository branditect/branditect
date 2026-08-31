import type { MetadataRoute } from "next";

const BASE = "https://www.branditect.io";

/**
 * A brand kit link at /k carries a brand's logos, fonts and guidelines to
 * someone outside the account. It is unguessable rather than secret, so the
 * one thing that must not happen is a search engine indexing one that was
 * pasted into a public brief.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/k/",
        "/start",
        "/home",
        "/brand/",
        "/knowledge/",
        "/studio/",
        "/numbers",
        "/chat",
        "/settings/",
        "/onboarding",
        "/login",
        "/signup",
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
