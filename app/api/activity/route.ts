/**
 * "This brand was used today." hq.md: one throttled upsert, so last_active_at
 * and the 14-day activity sparkline in HQ reflect real use.
 *
 * Most screens read Supabase straight from the browser, so API calls alone
 * would miss someone who only reads. components/presence.tsx calls this once
 * on load and when the tab comes back, at most every five minutes; the
 * database throttles again (touch_brand_activity), so a burst costs nothing.
 *
 * Writes a timestamp and a date. Reads nothing.
 */
import { NextRequest } from "next/server";
import { resolveBrand, serviceClient } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await resolveBrand(req);
  if (!auth.ok) return new Response(null, { status: auth.status });
  const { error } = await serviceClient().rpc("touch_brand_activity", { p_brand: auth.brandId });
  if (error && error.code !== "PGRST202") console.error("[activity]", error.message);
  return new Response(null, { status: 204 });
}
