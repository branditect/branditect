/**
 * Prompt caching: one helper, used by every route that sends a system prompt.
 *
 * Inbox entry 2 of branditect-ui/spec/inbox.md. The API only caches when
 * `system` is an ARRAY of content blocks carrying `cache_control`. Passing a
 * string — which every route did until now — silently pays full input price
 * for the same brand context on every call. Nothing errors; you just never
 * get a read.
 *
 * ORDER IS THE WHOLE TRICK. A cache entry is keyed on an exact prefix, so
 * anything that varies per request must sit AFTER the cached block. One
 * changing character at the front invalidates the entry and you pay the write
 * premium every call for no reads. That is why this helper takes the stable
 * text and the per-request text as two separate arguments and assembles them
 * itself: a caller cannot concatenate them in the wrong order, because it
 * never holds them concatenated.
 *
 * TTL. `ttl: "1h"` is accepted on the plain Messages API — no beta header —
 * measured on 2026-09-10 against claude-sonnet-5 with
 * @anthropic-ai/sdk 0.81.0 and anthropic-version 2023-06-01: the write came
 * back as `cache_creation.ephemeral_1h_input_tokens: 2404` and the second
 * identical call as `cache_read_input_tokens: 2404`.
 *
 * A write costs more than a plain input token — 1.25x at 5m, 2x at 1h — so
 * caching only pays once reads outnumber that premium, at about three calls
 * inside the TTL. One hour is chosen over five minutes because the failure
 * mode of an expired entry is worse than the extra write: a miss pays 1x to
 * re-read AND 1.25x to re-write, so a founder who comes back to a draft
 * twenty minutes later would be charged more than if nothing were cached.
 */

/** The `system` array shape, typed here so the raw-fetch route can use it too. */
export interface SystemBlock {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral"; ttl?: "5m" | "1h" };
}

export const CACHE_TTL: "5m" | "1h" = "1h";

/**
 * The per-request half, deliberately NOT a string.
 *
 * The failure this type exists to prevent is a caller writing
 * `cachedSystem(copyStable(x) + copyPerRequest(y))` — one argument, the brief
 * folded into the cached prefix, everything still compiling and running and
 * quietly writing a new cache entry on every call.
 *
 * It is NOT a compile error. That was checked rather than assumed on
 * 2026-09-10: TypeScript permits "+" between a string and an object, so tsc
 * reports nothing. What being an object buys is that the mistake is loud at
 * runtime — the prompt ends "[object Object]" instead of carrying the brief —
 * and that lib/prompt-cache.test.ts can recognise the shape. The check that
 * actually catches it is "concatenates nothing into the cached argument",
 * which runs in npm test.
 */
export interface PerRequestBlock {
  readonly kind: "per-request";
  readonly text: string;
}

export function perRequest(text: string): PerRequestBlock {
  return { kind: "per-request", text };
}

/**
 * Sonnet caches nothing below 1024 tokens. Below it, `cache_control` is
 * ignored rather than rejected, so attaching it costs nothing — but the log
 * line will show write=0 read=0 forever, which is the honest signal that a
 * prompt is too short to be worth caching. Do not read this constant as a
 * gate; it is here so the number has a name in the report.
 */
export const SONNET_MIN_CACHEABLE_TOKENS = 1024;

/**
 * Build the `system` array.
 *
 * @param stable      Brand context and static rules. Byte-identical across
 *                    calls for the same brand, or nothing caches.
 * @param varying     Anything that changes call to call — a brief, a length,
 *                    a chosen product, wrapped with perRequest(). Goes in its
 *                    own uncached block after the cached one. Omit when there
 *                    is none.
 */
export function cachedSystem(stable: string, varying?: PerRequestBlock | null): SystemBlock[] {
  if (typeof stable !== "string" || stable.trim() === "") {
    // A blank stable block would put cache_control on nothing and push the
    // real prompt into the uncached position, which reads as working.
    throw new Error("cachedSystem: the stable block is empty");
  }
  const blocks: SystemBlock[] = [
    { type: "text", text: stable, cache_control: { type: "ephemeral", ttl: CACHE_TTL } },
  ];
  if (varying && varying.text.trim() !== "") {
    blocks.push({ type: "text", text: varying.text });
  }
  return blocks;
}

/** The three numbers the API reports back. Every field is optional: an older
 *  response, or a route that did not cache, simply omits them. */
export interface CacheUsage {
  input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

export interface CacheStats {
  route: string;
  written: number;
  read: number;
  uncached: number;
  /** Share of the cacheable prefix that was READ rather than written, 0..1.
   *  null when neither happened — the prompt is below the minimum, or the
   *  block array never reached the API. */
  hitRate: number | null;
}

export function cacheStats(route: string, usage: CacheUsage | null | undefined): CacheStats {
  const written = Number(usage?.cache_creation_input_tokens ?? 0) || 0;
  const read = Number(usage?.cache_read_input_tokens ?? 0) || 0;
  const uncached = Number(usage?.input_tokens ?? 0) || 0;
  const prefix = written + read;
  return { route, written, read, uncached, hitRate: prefix > 0 ? read / prefix : null };
}

/**
 * Criterion 3: the hit rate has to be visible or it is unmeasured, and
 * unit-economics.md says utilisation is already the most uncertain input in
 * the whole model. One line per call, greppable as `[cache]`.
 */
export function cacheLogLine(route: string, usage: CacheUsage | null | undefined): string {
  const s = cacheStats(route, usage);
  const rate = s.hitRate === null ? "n/a" : `${Math.round(s.hitRate * 100)}%`;
  return `[cache] ${s.route} write=${s.written} read=${s.read} uncached=${s.uncached} hit=${rate}`;
}

export function logCacheUsage(route: string, usage: CacheUsage | null | undefined): void {
  console.log(cacheLogLine(route, usage));
}
