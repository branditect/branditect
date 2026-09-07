/**
 * A bound on how long an auth call may hang before the person is told.
 *
 * app/login/page.tsx awaited supabase.auth.signInWithPassword with no
 * try/catch and no timeout. If that call hangs or throws, `loading` stays
 * true, no error renders and nothing navigates: the person watches a spinner
 * forever with no way to tell whether it worked.
 *
 * That is not hypothetical. It happened during the Notes verification on
 * 2026-09-07 — the network was fine, the host was reachable, a raw password
 * grant from the same page returned 200 with a token, and the app's own
 * supabase.auth call never resolved. Nothing appeared on screen.
 *
 * A promise that never settles cannot be caught. Only a race against a clock
 * turns it into something the interface can say out loud.
 */

import { AUTH_COPY, type AuthError } from "./auth-errors.ts";

/** Long enough for a slow connection, short enough to be a wait not a void. */
export const AUTH_TIMEOUT_MS = 15_000;

export class AuthTimeout extends Error {
  constructor(what: string) {
    super(`${what} did not respond within ${AUTH_TIMEOUT_MS}ms`);
    this.name = "AuthTimeout";
  }
}

/**
 * Race a promise against the clock. The timer is always cleared, including on
 * the happy path, so a signed-in page does not hold a pending timeout open.
 */
export function withTimeout<T>(
  work: Promise<T>,
  what: string,
  ms: number = AUTH_TIMEOUT_MS,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const clock = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new AuthTimeout(what)), ms);
  });
  return Promise.race([work, clock]).finally(() => clearTimeout(timer)) as Promise<T>;
}

/**
 * What to show when the call threw or timed out rather than returning an
 * error. Raw driver strings never reach the user, same rule as mapAuthError.
 */
export function mapThrown(e: unknown): AuthError {
  if (e instanceof AuthTimeout || (e as { name?: string })?.name === "AuthTimeout") {
    return { message: AUTH_COPY.timedOut };
  }
  return { message: AUTH_COPY.serverError };
}

/**
 * Where to send someone whose sign-in worked but whose routing did not.
 *
 * They ARE signed in at this point, so stranding them on the login form would
 * be worse than a slightly wrong destination. lib/post-auth.ts already treats
 * /start as its own can't-tell answer.
 */
export const POST_AUTH_FALLBACK = "/start";
