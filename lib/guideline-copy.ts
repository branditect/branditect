/**
 * The guideline page's editorial copy is generated once per version of its
 * inputs, not once per visit. See supabase/guideline-copy.sql.
 *
 * The hash covers what the prompt is built from — the strategy row and the
 * visual DNA row — minus bookkeeping columns. A save that changes no content
 * still bumps updated_at, and that must not cost the customer 2 credits.
 */
import { createHash } from "node:crypto";

type Row = Record<string, unknown> | null | undefined;

/** Bookkeeping columns: timestamps and ids say nothing about the brand. */
const IGNORED = /(^id$|_at$)/;

function content(row: Row): Record<string, unknown> | null {
  if (!row) return null;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(row).sort()) if (!IGNORED.test(k)) out[k] = row[k];
  return out;
}

export function guidelineCopyHash(strategy: Row, visualDna: Row): string {
  return createHash("sha256")
    .update(JSON.stringify([content(strategy), content(visualDna)]))
    .digest("hex");
}

/** The table not existing yet (migration unapplied) reads as a miss, never a failure. */
export function isMissingTable(error: { code?: string } | null | undefined): boolean {
  return !!error && (error.code === "42P01" || error.code === "PGRST205");
}
