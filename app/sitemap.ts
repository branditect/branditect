import type { MetadataRoute } from "next";

const BASE = "https://www.branditect.io";

/**
 * The public routes, and only those. Everything behind a session is left out:
 * the app itself, the onboarding flow at /start, and the brand kit portal at
 * /k, whose links are meant to be sent to one person rather than found.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/pricing`, changeFrequency: "monthly", priority: 0.8 },
  ];
}
