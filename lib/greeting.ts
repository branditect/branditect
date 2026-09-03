/**
 * The time-of-day greeting on Home.
 *
 * This lived inline in the Home page and was called with `new Date()` computed
 * during render. A client component still renders on the server, so the hour
 * came from the server's clock — UTC on Vercel — and then from the browser's
 * clock on hydration. In Helsinki (UTC+3 in summer) the two disagree whenever
 * the offset crosses a boundary at 12:00 or 18:00: 09:00–12:00, 15:00–18:00 and
 * 21:00–00:00 UTC, which is 12:00–15:00, 18:00–21:00 and 00:00–03:00 local.
 * React then found "Good afternoon" where the server had written "Good
 * morning" and threw error #425.
 *
 * The fix is in the page: the hour is read in an effect, so the server and the
 * first client render always agree. This module holds the rule and the
 * pre-mount text so both are testable.
 */

/** What the server renders, and what the browser renders before it knows the hour. */
export const GREETING_BEFORE_MOUNT = "Hello";

export function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Whether a UTC hour and the same instant in a given offset produce different
 * greetings. Only used by the tests, to state the bug rather than describe it.
 */
export function greetingsDisagree(utcHour: number, offsetHours: number): boolean {
  const local = ((utcHour + offsetHours) % 24 + 24) % 24;
  return greeting(utcHour) !== greeting(local);
}
