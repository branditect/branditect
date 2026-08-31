"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * Sends a signed-in visitor from the landing page to their workspace.
 *
 * The spec asks for this on the server. It cannot be done on the server today:
 * the app uses plain @supabase/supabase-js, whose session lives in
 * localStorage, and @supabase/ssr is not installed, so a server component has
 * no session to read. Making it server side means moving auth to cookie
 * storage, which touches every authenticated surface and is not this job.
 *
 * getSession reads what is already in localStorage rather than calling the
 * network, so the redirect fires on the first client tick and the marketing
 * page is not left on screen while a request goes out.
 *
 * Renders nothing. The page itself is server rendered, so a crawler and a
 * signed-out visitor both get the full HTML.
 */
export default function SignedInGate() {
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive && data.session) router.replace("/home");
    });
    return () => { alive = false; };
  }, [router]);

  return null;
}
