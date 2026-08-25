/**
 * Public environment variables, for code that runs in the browser.
 *
 * Next inlines NEXT_PUBLIC_* by literal text substitution at build time: it
 * rewrites the exact source text `process.env.NEXT_PUBLIC_SUPABASE_URL`. A
 * dynamic lookup — process.env[name] — is not text it can rewrite, so in the
 * browser process.env is {} and every read comes back undefined.
 *
 * That is why the guard in lib/env.ts blanked the app: the server HTML was
 * correct, then hydration threw, React discarded the tree, and the page went
 * blank with the error visible only to a console captured from before load.
 *
 * Every name below must therefore appear as a literal property access. Do not
 * refactor this map into a loop or a helper that takes a name.
 */
const PUBLIC = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
} as const;

export type PublicEnvName = keyof typeof PUBLIC;

export function requirePublicEnv(name: PublicEnvName): string {
  const v = PUBLIC[name];
  if (!v) throw new Error(`${name} is not set (public env, inlined at build). Refusing to fall back to a committed key.`);
  return v;
}

/** Non-throwing, for the startup report. */
export function missingPublicEnv(): PublicEnvName[] {
  return (Object.keys(PUBLIC) as PublicEnvName[]).filter((k) => !PUBLIC[k]);
}
