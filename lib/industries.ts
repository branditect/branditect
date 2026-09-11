/**
 * The industries a brand can pick. Section 2 of branditect-ui/spec/settings.md.
 *
 * ONE LIST, AND THE VALUES ARE THE ENGLISH LABELS. `app/onboarding/page.tsx`
 * has always written its own label straight into `brands.industry` — "Food &
 * Beverage", not a code — so that string is the stored value whether we like
 * it or not. Changing it to a slug would need a backfill of live rows, and
 * rule 1 of the queue allows no migration. So `value` is the English label and
 * `labelKey` is what gets shown.
 *
 * The spec says Settings offers "the same list as onboarding". That screen is
 * not extracted yet and holds its own array of literals, so this file does not
 * import into it — a test asserts the two lists match instead, and fails if
 * either drifts. When onboarding is extracted it should import from here and
 * that test becomes trivially true.
 */
import type { StringKey } from "./i18n/en.ts";

export interface Industry {
  /** What is stored in `brands.industry`, and what onboarding writes. */
  value: string;
  labelKey: StringKey;
  emoji: string;
}

export const INDUSTRIES: Industry[] = [
  { value: "Tech & SaaS", labelKey: "industry.tech", emoji: "💻" },
  { value: "E-commerce", labelKey: "industry.ecommerce", emoji: "🛒" },
  { value: "Health & Wellness", labelKey: "industry.health", emoji: "🧘" },
  { value: "Food & Beverage", labelKey: "industry.food", emoji: "🍽" },
  { value: "Professional Services", labelKey: "industry.services", emoji: "💼" },
  { value: "Fashion & Beauty", labelKey: "industry.fashion", emoji: "✨" },
  { value: "Education", labelKey: "industry.education", emoji: "📚" },
  { value: "Real Estate", labelKey: "industry.realEstate", emoji: "🏠" },
  { value: "Other", labelKey: "industry.other", emoji: "◈" },
];

/** Whether a stored value is one this list offers. */
export function isKnownIndustry(value: unknown): boolean {
  return typeof value === "string" && INDUSTRIES.some((i) => i.value === value);
}
