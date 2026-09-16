/**
 * Strategy versions: a redo never destroys the strategy that is live.
 *
 * branditect-ui/spec/strategy-in-and-again.md, part 2, and the one rule the
 * whole feature hangs on:
 *
 *   ARCHIVE ON FINISH, NEVER ON START.
 *
 * `brand_strategies` holds one current row per brand. A redo that marked the
 * old row replaced when it STARTED would mean a founder who begins one and
 * gets interrupted has destroyed a working strategy and replaced it with three
 * answers. So nothing here marks anything replaced except inside the call that
 * writes its replacement, and an insert that fails puts the old row back.
 *
 * WHY THE STORE INTERFACE. The ordering below is the feature, and ordering is
 * exactly what a test cannot check through a supabase client without a
 * database. So the four writes are an interface, `supabaseStrategyStore` is the
 * adapter, and lib/strategy-intake.test.ts drives the logic with a fake that
 * records the order and can fail on demand.
 *
 * Requires supabase/strategy-sources-and-versions.sql, which adds the columns
 * and the partial unique index that makes "exactly one current" a database
 * fact rather than a promise. Until it is run, every call here fails loudly
 * and names the file — see `isMissingColumn`.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Provenance, StrategySource } from "./strategy-intake.ts";

export const MIGRATION_FILE = "supabase/strategy-sources-and-versions.sql";

/** What the flow sends and what a row holds. */
export interface StrategyInput {
  brandId: string;
  userId: string | null;
  answers: Record<number, string>;
  provenance: Provenance;
  source: StrategySource;
  sourceDocumentId?: string | null;
  /** The generated document, when there is one yet. Null right after intake. */
  generatedStrategy?: string | null;
  category?: string | null;
}

export interface StrategyRow {
  id: string;
  brand_id: string;
  version: number;
  is_current: boolean;
  replaced_at: string | null;
  source: StrategySource;
  provenance: Provenance;
  answers: Record<string, string>;
  generated_strategy: string | null;
  source_document_id: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}

export type StoreError = { message: string; code?: string };

/**
 * The four writes, in the order they must happen. An adapter maps them onto
 * supabase; a test maps them onto an array.
 */
export interface StrategyStore {
  /** The current row, if any, and the highest version number ever used. */
  head(brandId: string): Promise<{ current: StrategyRow | null; maxVersion: number; error?: StoreError }>;
  markReplaced(id: string, at: string): Promise<{ error?: StoreError }>;
  insert(row: Omit<StrategyRow, "id">): Promise<{ id?: string; error?: StoreError }>;
  /** Undo a markReplaced, for when the insert that justified it failed. */
  restoreCurrent(id: string): Promise<{ error?: StoreError }>;
}

/**
 * PostgREST reports an unknown column as 42703. Anything that reaches this is
 * the migration not having been run, and saying so is the difference between a
 * five-second fix and an afternoon: three migrations in this repo were written,
 * committed and never run, and each one looked like a broken feature.
 */
export function isMissingColumn(error: StoreError | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "42703") return true;
  return /column .* does not exist|could not find the '.*' column/i.test(error.message ?? "");
}

export function migrationMessage(error?: StoreError | null): string {
  const detail = error?.message ? ` (${error.message})` : "";
  return `The strategy tables are missing their version columns. Run ${MIGRATION_FILE} in the Supabase SQL editor.${detail}`;
}

export type SaveResult =
  | { ok: true; id: string; version: number }
  | { ok: false; status: number; message: string; migration?: boolean };

/**
 * Archive the current strategy and write its replacement, in that order.
 *
 * The order is forced by the partial unique index: with two rows claiming
 * `is_current`, the insert is rejected by the database. So the old row is
 * stood down first — and if the insert then fails, it is stood back up, which
 * is the difference between a failed redo and a brand with no strategy.
 */
export async function archiveAndInsert(
  store: StrategyStore,
  input: StrategyInput,
  now: () => string = () => new Date().toISOString(),
): Promise<SaveResult> {
  const { current, maxVersion, error: headError } = await store.head(input.brandId);
  if (headError) {
    return isMissingColumn(headError)
      ? { ok: false, status: 503, message: migrationMessage(headError), migration: true }
      : { ok: false, status: 500, message: headError.message };
  }

  const replacedAt = now();
  if (current) {
    const { error } = await store.markReplaced(current.id, replacedAt);
    if (error) {
      return isMissingColumn(error)
        ? { ok: false, status: 503, message: migrationMessage(error), migration: true }
        : { ok: false, status: 500, message: error.message };
    }
  }

  const { id, error } = await store.insert({
    brand_id: input.brandId,
    version: maxVersion + 1,
    is_current: true,
    replaced_at: null,
    source: input.source,
    provenance: input.provenance,
    // JSON object keys are strings once they are through the wire, and the
    // readers key on the question number as a string. Normalised here so a
    // row written by this path and one written by the questionnaire look the
    // same to everything downstream.
    answers: Object.fromEntries(Object.entries(input.answers).map(([k, v]) => [String(k), v])),
    generated_strategy: input.generatedStrategy ?? null,
    source_document_id: input.sourceDocumentId ?? null,
  });

  if (error || !id) {
    // The insert is what justified standing the old one down. It did not
    // happen, so put it back before reporting the failure.
    if (current) await store.restoreCurrent(current.id);
    const e = error ?? { message: "The strategy was not written" };
    return isMissingColumn(e)
      ? { ok: false, status: 503, message: migrationMessage(e), migration: true }
      : { ok: false, status: 500, message: e.message };
  }

  return { ok: true, id, version: maxVersion + 1 };
}

/**
 * Restoring an old version is itself a version change, never a delete.
 *
 * "I liked the old one" is a thing people say about their own brand more often
 * than about anything else, so version 1 coming back is version 3, and version
 * 2 stays readable.
 */
export async function restoreVersion(
  store: StrategyStore,
  brandId: string,
  version: StrategyRow,
  now: () => string = () => new Date().toISOString(),
): Promise<SaveResult> {
  return archiveAndInsert(store, {
    brandId,
    userId: null,
    answers: version.answers as unknown as Record<number, string>,
    provenance: version.provenance ?? {},
    source: version.source,
    sourceDocumentId: version.source_document_id,
    generatedStrategy: version.generated_strategy,
  }, now);
}

/* ────────────────────────────────────────────────── the supabase adapter ── */

/**
 * The client these take is the real one. The ORDERING is what the tests drive,
 * and that goes through StrategyStore above, so nothing here needs faking.
 */
export type StrategyDb = SupabaseClient;

const COLUMNS =
  "id, brand_id, version, is_current, replaced_at, source, provenance, answers, generated_strategy, source_document_id, created_at, updated_at";

export function supabaseStrategyStore(db: StrategyDb): StrategyStore {
  return {
    async head(brandId) {
      const { data, error } = await db
        .from("brand_strategies")
        .select(COLUMNS)
        .eq("brand_id", brandId)
        .order("version", { ascending: false });
      if (error) return { current: null, maxVersion: 0, error };
      const rows = (data ?? []) as StrategyRow[];
      return {
        current: rows.find((r) => r.is_current) ?? null,
        maxVersion: rows.reduce((m, r) => Math.max(m, r.version ?? 0), 0),
      };
    },
    async markReplaced(id, at) {
      const { error } = await db
        .from("brand_strategies")
        .update({ is_current: false, replaced_at: at })
        .eq("id", id);
      return { error: error ?? undefined };
    },
    async insert(row) {
      const { data, error } = await db
        .from("brand_strategies")
        .insert(row)
        .select("id")
        .single();
      return { id: (data as { id?: string } | null)?.id, error: error ?? undefined };
    },
    async restoreCurrent(id) {
      const { error } = await db
        .from("brand_strategies")
        .update({ is_current: true, replaced_at: null })
        .eq("id", id);
      return { error: error ?? undefined };
    },
  };
}

/** The strategy a brand is running on right now. */
export async function currentStrategy(db: StrategyDb, brandId: string): Promise<{ row: StrategyRow | null; error?: StoreError }> {
  const { data, error } = await db
    .from("brand_strategies")
    .select(COLUMNS)
    .eq("brand_id", brandId)
    .eq("is_current", true)
    .maybeSingle();
  if (error) return { row: null, error };
  return { row: (data as StrategyRow | null) ?? null };
}

/** Every version a brand has had, newest first. The old ones stay readable. */
export async function versionsOf(db: StrategyDb, brandId: string): Promise<{ rows: StrategyRow[]; error?: StoreError }> {
  const { data, error } = await db
    .from("brand_strategies")
    .select(COLUMNS)
    .eq("brand_id", brandId)
    .order("version", { ascending: false });
  if (error) return { rows: [], error };
  return { rows: (data ?? []) as StrategyRow[] };
}
