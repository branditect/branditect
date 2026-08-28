/**
 * Auth copy, from branditect-ui/spec/auth.md.
 *
 * Say what went wrong and what to do. No apologies, no "Oops!".
 */

export const AUTH_COPY = {
  emptyEmail: "Enter your email",
  emptyPassword: "Enter your password",
  emptyBrandName: "Enter your brand name",
  badEmail: "That doesn't look like an email address",
  badCredentials: "That email and password don't match",
  shortPassword: "At least 10 characters",
  alreadyRegistered: "That email already has an account.",
  rateLimited: "Too many attempts. Try again in 15 minutes.",
  serverError: "Something went wrong at our end. Try again.",
  resetSent: "If that email has an account, a reset link is on its way.",
  resetExpired: "That link has expired. Request a new one.",
  confirmSent: "Check your email to confirm your address, then sign in. Your questionnaire is waiting.",
} as const;

/** Minimum password length on sign-up. Length beats composition rules. */
export const MIN_PASSWORD = 10;

export type AuthError = { message: string; linkHref?: string; linkLabel?: string };

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
      linkLabel: "Sign in instead",
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
