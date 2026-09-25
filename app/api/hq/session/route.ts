/**
 * Unlocks the /hq page for an operator. See lib/hq-access.ts.
 *
 * Operator: 204 and a signed HttpOnly cookie scoped to /hq.
 * Anyone else, signed in or not: 404, byte-for-byte what a route that does not
 * exist answers — this route must not confirm that HQ is here.
 */
import { NextRequest } from "next/server";
import {
  HQ_COOKIE, HQ_COOKIE_TTL_S, cookieKey, hqNotFound, operatorFromRequest, signHqCookie,
} from "@/lib/hq-access";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const op = await operatorFromRequest(req);
  if (!op) return hqNotFound();

  const exp = Math.floor(Date.now() / 1000) + HQ_COOKIE_TTL_S;
  const value = signHqCookie(op.id, exp, cookieKey());
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return new Response(null, {
    status: 204,
    headers: {
      "set-cookie": `${HQ_COOKIE}=${value}; Path=/hq; HttpOnly; SameSite=Strict; Max-Age=${HQ_COOKIE_TTL_S}${secure}`,
      "cache-control": "no-store",
    },
  });
}
