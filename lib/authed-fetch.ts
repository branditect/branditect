"use client";

import { supabase } from "@/lib/supabase";

/**
 * fetch with the caller's Supabase access token attached.
 *
 * Every /api route runs on the service key, which bypasses RLS, so the route
 * has to identify the caller itself — see lib/api-auth.ts resolveBrand. It can
 * only do that if the browser sends the token, and there was no shared way to
 * do it: the brand-asset endpoints simply trusted a brandId in the body.
 *
 * Sending a brandId at all is now optional and only ever checked against the
 * one the caller owns; the routes use the resolved id, which cannot be spoofed.
 */
export async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

/**
 * The same call, with the JSON shaped for a body. Kept separate so callers
 * posting FormData do not accidentally get a JSON content type, which makes
 * multipart uploads fail in a way that reads like a server error.
 */
export async function authedJson(
  input: string,
  method: "POST" | "PATCH" | "DELETE",
  body: unknown,
): Promise<Response> {
  return authedFetch(input, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
