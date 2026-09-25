/**
 * Who may open HQ. spec: hq.md "Access, and the rules that protect your
 * customers".
 *
 *   - An explicit allowlist, checked server-side on every request: the user
 *     ids in HQ_OPERATOR_IDS (comma-separated). Not a `role` column a bad
 *     update could set, and never a client-side check.
 *   - A non-operator gets 404, never 403: a 403 confirms the route exists.
 *
 * The app authenticates API calls with a Bearer token and has no session
 * cookie, so the /hq PAGE cannot see who is asking. Two layers:
 *
 *   1. /api/hq/session (POST, Bearer) — the app calls it once after sign-in.
 *      For an operator it sets `bd_hq`, an HttpOnly cookie signed with a key
 *      derived from the service-role secret. For anyone else it answers 404,
 *      exactly as a route that does not exist.
 *   2. The /hq layout checks that cookie server-side and calls notFound()
 *      without it, so a non-operator gets a real 404 page.
 *
 * The cookie only unlocks the empty page. Every byte of data comes from
 * /api/hq/*, which re-checks the Bearer token against the allowlist on each
 * request — the cookie is never trusted for data.
 */

import { createHmac, createHash, timingSafeEqual } from "node:crypto";

export const HQ_COOKIE = "bd_hq";
export const HQ_COOKIE_TTL_S = 7 * 24 * 3600;

export function operatorIds(env: string | undefined = process.env.HQ_OPERATOR_IDS): Set<string> {
  return new Set(
    (env ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => /^[0-9a-f-]{36}$/.test(s)),
  );
}

export function isOperator(userId: string | null | undefined, env?: string): boolean {
  return !!userId && operatorIds(env).has(userId.toLowerCase());
}

/** The signing key. Derived, so there is no second secret to set and lose. */
export function cookieKey(secret: string | undefined = process.env.SUPABASE_SERVICE_ROLE_KEY): Buffer {
  if (!secret) throw new Error("hq: no signing secret");
  return createHash("sha256").update(`bd_hq:v1:${secret}`).digest();
}

export function signHqCookie(userId: string, expiresAtS: number, key: Buffer): string {
  const body = `${userId}.${expiresAtS}`;
  const mac = createHmac("sha256", key).update(body).digest("base64url");
  return `${body}.${mac}`;
}

/** The operator id the cookie names, if it is genuine, unexpired, and still on the allowlist. */
export function verifyHqCookie(
  value: string | undefined | null,
  key: Buffer,
  nowS = Math.floor(Date.now() / 1000),
  env?: string,
): string | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [userId, exp, mac] = parts;
  const want = createHmac("sha256", key).update(`${userId}.${exp}`).digest();
  let got: Buffer;
  try {
    got = Buffer.from(mac, "base64url");
  } catch {
    return null;
  }
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  if (!/^\d+$/.test(exp) || Number(exp) < nowS) return null;
  // Removing someone from the allowlist revokes them at once, cookie or not.
  if (!isOperator(userId, env)) return null;
  return userId;
}

export interface Operator {
  id: string;
  email: string | null;
}

/**
 * The operator behind a request's Bearer token, or null. Null means the
 * caller must answer 404 — not 401, not 403.
 */
export async function operatorFromRequest(req: Request): Promise<Operator | null> {
  const h = req.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  if (!token) return null;
  const { serviceClient } = await import("./api-auth.ts");
  const { data, error } = await serviceClient().auth.getUser(token);
  if (error || !data.user) return null;
  if (!isOperator(data.user.id)) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}

/** The response every HQ route gives a non-operator. Same as a missing route. */
export function hqNotFound(): Response {
  return new Response("Not Found", { status: 404, headers: { "content-type": "text/plain" } });
}
