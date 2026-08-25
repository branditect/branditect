import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requirePublicEnv } from "@/lib/env-public";

/**
 * Browser client, constructed lazily.
 *
 * Built at module scope this threw during `next build`, which imports every
 * route module to collect page data — so a missing key broke the deploy rather
 * than the one request that needed it. The proxy defers construction to first
 * use, which only happens in a handler or a component.
 */
let client: SupabaseClient | null = null;

function get(): SupabaseClient {
  if (!client) {
    client = createClient(
      requirePublicEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requirePublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    );
  }
  return client;
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const c = get() as unknown as Record<string | symbol, unknown>;
    const value = c[prop];
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(c) : value;
  },
});
