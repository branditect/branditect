/**
 * The decisions the Settings page makes, apart from the page.
 *
 * branditect-ui/spec/settings.md, phase 1. Everything here is testable by
 * calling it, which is the point: the panels themselves are three inputs and
 * a save button, and the parts worth getting right are what a save does with
 * what was typed.
 */

/** The largest sensible display name. Long enough for a real one, short enough not to break the greeting. */
export const MAX_NAME = 80;

/**
 * A typed display name, ready for `user_metadata.full_name`.
 *
 * Returns null for anything that is not a name, and null means "do not save".
 * Collapsing the whitespace matters more than it looks: `useUser` takes the
 * first word for the greeting, so a leading space made the greeting "Good
 * morning, " with nothing after it.
 */
export function normaliseName(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const name = input.trim().replace(/\s+/g, " ");
  if (name === "") return null;
  return name.slice(0, MAX_NAME);
}

/**
 * A typed website, ready for `brands.website`.
 *
 * Someone types `sorbify.fi`. Stored as-is it is not a link anywhere it is
 * rendered, so the scheme is added. Empty clears the field — returning null
 * for both "empty" and "invalid" would make clearing impossible, so they are
 * different results.
 */
export type WebsiteResult =
  | { ok: true; value: string | null }
  | { ok: false; reason: "invalid" };

export function normaliseWebsite(input: unknown): WebsiteResult {
  if (typeof input !== "string") return { ok: false, reason: "invalid" };
  const raw = input.trim();
  if (raw === "") return { ok: true, value: null };

  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return { ok: false, reason: "invalid" };
  }
  // A hostname with no dot is a typo, not a site — "sorbify" reaches nothing.
  // Localhost is the exception nobody types into a brand's settings.
  if (!url.hostname.includes(".") || url.hostname.startsWith(".") || url.hostname.endsWith(".")) {
    return { ok: false, reason: "invalid" };
  }
  return { ok: true, value: url.toString().replace(/\/$/, "") };
}

/** A brand name, which is also what the deletion confirmation is checked against. */
export function normaliseBrandName(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const name = input.trim().replace(/\s+/g, " ");
  return name === "" ? null : name.slice(0, 120);
}

/**
 * The rows below the line.
 *
 * "Order them by when they actually arrive, not by importance. A list where
 * the top item ships next is a list people stop checking; a list in random
 * order is one they ask about."
 *
 * `meter` is Credit use only: a dimmed bar so the shape of the thing is
 * visible before it works. It is decoration, not data, and carries no number.
 */
export interface ComingRow {
  key: string;
  titleKey: string;
  descKey: string;
  meter?: boolean;
}

export const COMING_SOON: ComingRow[] = [
  { key: "plan",          titleKey: "settings.soonPlan",          descKey: "settings.soonPlanDesc" },
  { key: "credits",       titleKey: "settings.soonCredits",       descKey: "settings.soonCreditsDesc", meter: true },
  { key: "team",          titleKey: "settings.soonTeam",          descKey: "settings.soonTeamDesc" },
  { key: "notifications", titleKey: "settings.soonNotifications", descKey: "settings.soonNotificationsDesc" },
  { key: "billing",       titleKey: "settings.soonBilling",       descKey: "settings.soonBillingDesc" },
];
