"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ensureBrand } from "@/lib/brand-bootstrap";

export interface Brand {
  id: string;
  brand_id: string;
  brand_name: string;
  website: string | null;
  industry: string | null;
  logo_url: string | null;
  colors: { hex: string; name: string }[] | null;
  /**
   * Real columns since 10 Sep, both defaulting to 'en' in the database.
   * Optional here because a brand row read before that migration, or a
   * partial select, can still arrive without them — and every reader
   * defaults to "en" on its own rather than relying on the column.
   */
  interface_language?: string | null;
  output_language?: string | null;
}

interface UseBrandReturn {
  brand: Brand | null;
  brandId: string;
  brandName: string;
  loading: boolean;
}

/**
 * The cache is keyed by user id.
 *
 * It used to be a bare module-level `cachedBrand`. A module survives a
 * client-side navigation, and sign-out was exactly that — signOut() followed by
 * router.replace() — so the next person to log in on the same browser was
 * handed the previous user's brand. Keying by user id means a cache entry can
 * never be read by anyone else; the auth listener below then discards it
 * outright rather than leaving it to sit in memory.
 */
let cache: { userId: string; brand: Brand } | null = null;

/**
 * Accounts this tab has already tried to repair.
 *
 * WHY REPAIR IS HERE AT ALL. A brand row is created by the sign-up and
 * sign-in screens, which is every door except the one a new account actually
 * uses: confirming the address from the email lands them back on the site
 * with a session already established, so neither screen runs. They are signed
 * in, the account is real, and `brandId` is the string "default" — which no
 * account owns, so every save is refused by the database and nothing they do
 * sticks. Reported as "the account exists, it just will not save anything".
 *
 * Repairing where the brand is *read* covers all the doors at once, including
 * any added later. The set keeps it to one attempt per account per tab, so a
 * failure cannot become a loop.
 */
const repairAttempted = new Set<string>();
const logoListeners = new Set<(url: string | null) => void>();

function cachedFor(userId: string | null | undefined): Brand | null {
  return userId && cache?.userId === userId ? cache.brand : null;
}

export function clearBrandCache() {
  cache = null;
}

/** Sign-out forgets the repair attempt too: the next account gets its own. */
function forgetRepairs() {
  repairAttempted.clear();
}

// Call this after updating the primary logo in Brand Library.
// Updates the in-memory cache and re-renders all useBrand consumers (e.g. sidebar).
export function updateBrandLogo(url: string | null) {
  if (cache) {
    cache = { ...cache, brand: { ...cache.brand, logo_url: url } };
    logoListeners.forEach(fn => fn(url));
  }
}

/**
 * Drop the cache the moment the session changes. SIGNED_OUT clears it, and so
 * does a SIGNED_IN for anyone other than the user it was built for — which is
 * the case that leaked.
 */
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") { clearBrandCache(); forgetRepairs(); return; }
    const uid = session?.user?.id ?? null;
    if (cache && cache.userId !== uid) clearBrandCache();
  });
}

export function useBrand(): UseBrandReturn {
  // Never seeded from the cache synchronously: the current user is not known
  // until getUser() resolves, and seeding first is what showed one user another
  // user's brand for a frame.
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to logo updates pushed from other parts of the app
  useEffect(() => {
    const listener = (url: string | null) => {
      setBrand(prev => prev ? { ...prev, logo_url: url } : prev);
    };
    logoListeners.add(listener);
    return () => { logoListeners.delete(listener); };
  }, []);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { clearBrandCache(); if (alive) setLoading(false); return; }

        // A hit is only a hit for this user.
        const hit = cachedFor(user.id);
        if (hit) { if (alive) { setBrand(hit); setLoading(false); } return; }

        const read = async () =>
          (await supabase
            .from("brands")
            .select("*")
            .eq("user_id", user.id)
            .eq("onboarding_completed", true)
            .limit(1)
            .maybeSingle()).data;

        let data = await read();

        // Signed in, but no brand: make one and read again, rather than
        // handing back "default" and letting the database refuse every write.
        if (!data && !repairAttempted.has(user.id)) {
          repairAttempted.add(user.id);
          const { brandId } = await ensureBrand();
          if (brandId) data = await read();
        }

        if (data) {
          cache = { userId: user.id, brand: data as Brand };
          if (alive) setBrand(cache.brand);
        }
      } catch {
        // silent
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, []);

  return {
    brand,
    brandId: brand?.brand_id || "default",
    brandName: brand?.brand_name || "Your Brand",
    loading,
  };
}


