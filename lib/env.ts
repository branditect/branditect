/**
 * Fail loudly on a missing key rather than falling back to one committed in
 * the repo. Every Supabase client in this codebase used to carry the anon JWT
 * as a string literal, so a misconfigured environment kept working against
 * production credentials instead of surfacing the mistake.
 */
export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set. Refusing to fall back to a committed key.`);
  return v;
}
