import { createClient } from "@supabase/supabase-js";
// Relative, with the extension: the test suite runs under Node's native
// TypeScript, which does not resolve the "@/" alias.
import { requireEnv } from "./env.ts";
export { decideAccess } from "./ownership.ts";

/**
 * Ownership checks for /api routes.
 *
 * Every route here uses the service role key, which bypasses RLS completely.
 * Closing RLS at the database therefore does nothing for them — they have to
 * enforce ownership in code, and this is the one place that does it.
 *
 * The rules, in order:
 *   1. Identify the caller from their own token, never the service key.
 *   2. Look up the brand that user owns.
 *   3. A mismatch is 403, never 404 — a 404 would confirm which brand ids
 *      exist, which is the thing being protected.
 *   4. Prefer the session's brand and ignore the parameter, unless the route
 *      genuinely needs one passed.
 */

/** Service-role client. Bypasses RLS, so every caller must gate on ownership. */
export function serviceClient() {
  return createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

/** Reads the bearer token the caller sent. Returns null when there is none. */
export function bearerToken(req: Request): string | null {
  const h = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!h?.startsWith("Bearer ")) return null;
  const t = h.slice(7).trim();
  return t.length ? t : null;
}

export type AuthFailure = { ok: false; status: 401 | 403; message: string };
export type AuthSuccess = { ok: true; userId: string; brandId: string };
export type AuthResult = AuthSuccess | AuthFailure;

/**
 * Identify the caller and resolve the brand they own.
 *
 * `requested` is checked against the owned brand rather than trusted. Routes
 * that do not need a caller-supplied id should omit it and use the returned
 * brandId, which cannot be spoofed.
 */
export async function resolveBrand(req: Request, requested?: string | null): Promise<AuthResult> {
  const token = bearerToken(req);
  if (!token) return { ok: false, status: 401, message: "Not signed in" };

  // The caller's token, not the service key — this is what identifies them.
  const asCaller = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );

  const { data: { user }, error } = await asCaller.auth.getUser();
  if (error || !user) return { ok: false, status: 401, message: "Not signed in" };

  const { data: owned } = await serviceClient()
    .from("brands").select("brand_id").eq("user_id", user.id).limit(1).maybeSingle();

  if (!owned?.brand_id) return { ok: false, status: 403, message: "No brand for this account" };

  // Same message and status whether the id is wrong or simply someone else's.
  if (requested && requested !== owned.brand_id) {
    return { ok: false, status: 403, message: "Not your brand" };
  }
  return { ok: true, userId: user.id, brandId: owned.brand_id };
}

