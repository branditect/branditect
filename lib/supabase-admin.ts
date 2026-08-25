import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";

/**
 * Service-role client, constructed lazily.
 *
 * It used to be built at module scope in every route. `next build` imports each
 * route module to collect page data, so a missing key threw during the build
 * and took down the whole deploy — which is exactly what happened when
 * SUPABASE_SERVICE_ROLE_KEY was absent on a new Vercel project. A missing
 * secret should fail the request that needs it, with a 500, not every deploy.
 *
 * The proxy keeps call sites as `supabase.from(...)`: the client is created on
 * first property access, which only happens inside a handler.
 *
 * Bypasses RLS — callers must enforce ownership themselves. See lib/api-auth.ts.
 */
let client: SupabaseClient | null = null;

function get(): SupabaseClient {
  if (!client) {
    client = createClient(
      requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    );
  }
  return client;
}

export const serviceClient: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const c = get() as unknown as Record<string | symbol, unknown>;
    const value = c[prop];
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(c) : value;
  },
});
