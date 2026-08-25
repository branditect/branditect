/**
 * Startup check for required environment variables.
 *
 * Next calls register() once when the server boots. This reports every missing
 * variable at once, on one line, instead of the first one surfacing later as a
 * stack trace from inside a route bundle — which is how a missing service-role
 * key read as "page data collection failed at /api/catalog/product".
 *
 * It logs and does not throw: a missing key should fail the request that needs
 * it, not prevent the server from starting.
 */
const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
] as const;

export async function register() {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(
      `[env] MISSING: ${missing.join(", ")} — routes needing these will fail at runtime with a 500.`,
    );
  } else {
    console.log(`[env] all ${REQUIRED.length} required variables present`);
  }
}
