/**
 * Server-only secrets.
 *
 * The dynamic lookup below works on the server, where process.env is real. It
 * cannot work in the browser: Next inlines NEXT_PUBLIC_* by literal text
 * substitution and has nothing to substitute for process.env[name]. Importing
 * this module into a client bundle therefore used to blank the page at
 * hydration, so it now refuses loudly instead.
 *
 * For anything the browser needs, use lib/env-public.ts.
 */
if (typeof window !== "undefined") {
  throw new Error(
    "lib/env.ts is server-only — its dynamic process.env lookup returns undefined in the browser. Use requirePublicEnv from lib/env-public.ts.",
  );
}

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set. Refusing to fall back to a committed key.`);
  return v;
}
