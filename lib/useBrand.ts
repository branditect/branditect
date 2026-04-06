"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface Brand {
  id: string;
  brand_id: string;
  brand_name: string;
  website: string | null;
  industry: string | null;
  logo_url: string | null;
  colors: { hex: string; name: string }[] | null;
}

interface UseBrandReturn {
  brand: Brand | null;
  brandId: string;
  brandName: string;
  loading: boolean;
}

let cachedBrand: Brand | null = null;
const logoListeners = new Set<(url: string | null) => void>();

// Call this after updating the primary logo in Brand Library.
// Updates the in-memory cache and re-renders all useBrand consumers (e.g. sidebar).
export function updateBrandLogo(url: string | null) {
  if (cachedBrand) {
    cachedBrand = { ...cachedBrand, logo_url: url };
    logoListeners.forEach(fn => fn(url));
  }
}

export function useBrand(): UseBrandReturn {
  const [brand, setBrand] = useState<Brand | null>(cachedBrand);
  const [loading, setLoading] = useState(!cachedBrand);

  // Subscribe to logo updates pushed from other parts of the app
  useEffect(() => {
    const listener = (url: string | null) => {
      setBrand(prev => prev ? { ...prev, logo_url: url } : prev);
    };
    logoListeners.add(listener);
    return () => { logoListeners.delete(listener); };
  }, []);

  useEffect(() => {
    if (cachedBrand) {
      setBrand(cachedBrand);
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data } = await supabase
          .from("brands")
          .select("*")
          .eq("user_id", user.id)
          .eq("onboarding_completed", true)
          .limit(1)
          .maybeSingle();

        if (data) {
          cachedBrand = data as Brand;
          setBrand(cachedBrand);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return {
    brand,
    brandId: brand?.brand_id || "default",
    brandName: brand?.brand_name || "Your Brand",
    loading,
  };
}

// For clearing cache on logout or brand switch
export function clearBrandCache() {
  cachedBrand = null;
}
