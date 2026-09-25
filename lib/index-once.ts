/**
 * Index once. spec: hq-accounts.md Part 1, criterion 5.
 *
 * A document already indexed is never indexed again: the routes that read an
 * upload (vault/extract, brand-guideline/index) hash the file bytes on the
 * server before any provider call, and reuse a finished row with the same hash
 * for the same brand instead of paying for the same reading twice.
 *
 * The hash lives in `content_sha256`, which supabase/hq-billing.sql adds. Until
 * that file has been run the column does not exist; the routes then skip the
 * dedupe silently (one log line per process) rather than failing an upload.
 */
import { createHash } from "node:crypto";

/** sha256 of the bytes, hex. Several chunks hash as one stream, each prefixed
 *  by its length so ["ab","c"] and ["a","bc"] differ. */
export function sha256Hex(...chunks: (Uint8Array | ArrayBuffer)[]): string {
  const h = createHash("sha256");
  const single = chunks.length === 1;
  for (const c of chunks) {
    const bytes = c instanceof ArrayBuffer ? new Uint8Array(c) : c;
    if (!single) h.update(`${bytes.byteLength}:`);
    h.update(bytes);
  }
  return h.digest("hex");
}

/** PostgREST / Postgres saying the content_sha256 column is not there yet. */
export function isMissingHashColumn(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false;
  return err.code === "42703" || err.code === "PGRST204" || /content_sha256/i.test(err.message ?? "");
}

let warned = false;
/** One line per process, not one per upload. */
export function warnNoHashColumn(route: string): void {
  if (warned) return;
  warned = true;
  console.error(`[index-once] content_sha256 is missing (${route}) — dedupe is off until supabase/hq-billing.sql is applied`);
}
