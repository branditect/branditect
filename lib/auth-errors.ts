/**
 * Auth copy, from branditect-ui/spec/auth.md.
 *
 * Say what went wrong and what to do. No apologies, no "Oops!".
 *
 * The table holds dictionary keys; the words are in lib/i18n. Every renderer
 * calls t() on them, so an error reads in the interface language. The
 * identical-message rule below is unchanged: it is about which key, and a
 * wrong password and an unknown email still get the same one.
 */
import type { StringKey } from "./i18n/index.ts";

export const AUTH_COPY = {
  emptyEmail: "auth.emptyEmail",
  emptyPassword: "auth.enterPassword",
  emptyBrandName: "auth.emptyBrandName",
  badEmail: "auth.badEmail",
  badCredentials: "auth.badCredentials",
  shortPassword: "auth.shortPassword",
  alreadyRegistered: "auth.alreadyRegistered",
  rateLimited: "auth.rateLimited",
  serverError: "auth.serverError",
  timedOut: "auth.timedOut",
  resetSent: "auth.resetSent",
  resetExpired: "auth.resetExpired",
  confirmSent: "auth.confirmSent",
} as const satisfies Record<string, StringKey>;

/** Minimum password length on sign-up. Length beats composition rules. */
export const MIN_PASSWORD = 10;

/** `message` and `linkLabel` are keys; render them with t(). */
export type AuthError = { message: StringKey; linkHref?: string; linkLabel?: StringKey };

/**
 * Map a Supabase auth failure onto the copy table.
 *
 * The security rule this exists to enforce: a wrong password and an email with
 * no account return the *same* message. Supabase already collapses both into
 * "Invalid login credentials", and nothing here may un-collapse them — a
 * distinct "no account with that email" lets anyone enumerate who has one.
 *
 * Anything unrecognised falls through to the generic server message rather
 * than surfacing a raw driver string. Specific errors go to the log.
 */
export function mapAuthError(err: { message?: string; status?: number } | null): AuthError {
  if (!err) return { message: AUTH_COPY.serverError };

  const raw = (err.message ?? "").toLowerCase();

  if (err.status === 429 || raw.includes("rate limit") || raw.includes("too many")) {
    return { message: AUTH_COPY.rateLimited };
  }
  if (raw.includes("already registered") || raw.includes("already been registered")) {
    return {
      message: AUTH_COPY.alreadyRegistered,
      linkHref: "/login",
      linkLabel: "auth.signInInstead",
    };
  }
  if (raw.includes("invalid login credentials") || raw.includes("invalid credentials")) {
    return { message: AUTH_COPY.badCredentials };
  }
  if (raw.includes("password should be at least") || raw.includes("password is too short")) {
    return { message: AUTH_COPY.shortPassword };
  }
  if (raw.includes("unable to validate email") || raw.includes("invalid email")) {
    return { message: AUTH_COPY.badEmail };
  }

  console.error("[auth] unmapped error:", err.message, err.status);
  return { message: AUTH_COPY.serverError };
}

/** Deliberately loose. Real validation is the server's job; this only catches typos. */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
