/**
 * The ownership decision, on its own.
 *
 * Kept out of lib/api-auth.ts because that reaches lib/env.ts, which is
 * server-only and throws when imported anywhere but a Server Component — the
 * test runner included. The rule this file holds is the one worth testing, so
 * it must stay importable.
 */
export function decideAccess(
  ownedBrandId: string | null, requested: string | null | undefined,
): { ok: true; brandId: string } | { ok: false; status: 403 } {
  if (!ownedBrandId) return { ok: false, status: 403 };
  // Same refusal whether the id belongs to someone else or does not exist —
  // a distinguishable 404 would confirm which brand ids are real.
  if (requested && requested !== ownedBrandId) return { ok: false, status: 403 };
  return { ok: true, brandId: ownedBrandId };
}
