/**
 * Account deletion that actually deletes.
 *
 * Part 4 of branditect-ui/spec/security-hardening.md, queue item 4. The
 * decisions live here rather than in the route so they can be tested by
 * calling them, the way lib/rls-audit.ts is.
 *
 * ── THE LIST OF TABLES IS NOT IN THIS FILE, AND THAT IS THE POINT ─────────
 *
 * The spec: "Enumerate the tables from the database, not from a list in the
 * code. A hand-maintained list goes stale the first time a table is added,
 * and the failure is silent — data that should be gone, isn't."
 *
 * So there is no list. `relationsWithBrandId` reads PostgREST's own OpenAPI
 * document, which PostgREST generates from the live catalogue and refreshes
 * when the schema changes. A table added tomorrow is in it tomorrow, with
 * nothing here edited. It is the same fact `information_schema` would give,
 * reachable without a migration — and this item is allowed none.
 *
 * ── WHY IT DOES NOT TRY TO TELL A TABLE FROM A VIEW ───────────────────────
 *
 * `product_attachment_counts` is a view with a `brand_id`, and it is
 * auto-updatable, so a DELETE through it reaches `catalog_products`. The
 * obvious move is to classify relations and skip the views. Nothing in the
 * OpenAPI document says which is which — the one available signal, an absent
 * `required` array, is also absent from any table whose columns all have
 * defaults, and skipping a real table is the silent failure this whole item
 * is about.
 *
 * So it does not classify. **Every delete is `WHERE brand_id = <this brand>`,
 * and that is the property that makes it safe** — whatever relation it
 * resolves to, it can only remove rows belonging to the brand being deleted.
 * A view is then redundant rather than dangerous, and the verification pass
 * proves the result instead of the reasoning. That is entry 5d's rule: name
 * the property that makes it safe, rather than the shape of the example.
 *
 * ── ORDER ─────────────────────────────────────────────────────────────────
 *
 * Storage first, rows second, the auth user last. A half-failure then leaves
 * an account that can be retried; the other order strands files nobody can
 * find or reach. `brands` is the last row deleted for the same reason: while
 * it exists, everything else is still discoverable from it.
 */

/** The column every brand-scoped relation is keyed by. */
export const BRAND_KEY = "brand_id";

/** `brands` goes last, because while it exists the rest is still findable. */
export const ANCHOR_TABLE = "brands";

/**
 * Every relation in the live schema carrying a `brand_id`.
 *
 * Takes PostgREST's OpenAPI document. Returns them ordered, with `brands`
 * last. Throws rather than returning a short list: a truncated enumeration
 * reads as a successful deletion that quietly left data behind, which is the
 * exact failure the spec names.
 */
export function relationsWithBrandId(openapi: unknown): string[] {
  const doc = openapi as { definitions?: Record<string, { properties?: Record<string, unknown> }> };
  const defs = doc?.definitions;
  if (!defs || typeof defs !== "object") {
    throw new Error("the schema document has no definitions — cannot enumerate what to delete");
  }
  const names = Object.entries(defs)
    .filter(([, d]) => d && typeof d === "object" && BRAND_KEY in (d.properties ?? {}))
    .map(([name]) => name);

  if (!names.includes(ANCHOR_TABLE)) {
    throw new Error(`the enumeration does not contain ${ANCHOR_TABLE} — it cannot be the live schema`);
  }
  const rest = names.filter((n) => n !== ANCHOR_TABLE).sort();
  return [...rest, ANCHOR_TABLE];
}

/**
 * The storage prefixes belonging to one brand.
 *
 * TWO, NOT ONE, and it is not defensiveness. `brand-assets` holds objects
 * under the brand's UUID as well as its slug — the same slug/UUID confusion
 * that made templates render nowhere — and the spec's "the brand's prefix"
 * describes only half of what is actually on disk. Deleting one prefix leaves
 * the other, and the files are the part that was private.
 *
 * Empty and duplicate values are dropped, so a brand whose two ids somehow
 * match is listed once rather than deleted twice.
 */
export function storagePrefixesFor(brand: { brand_id?: string | null; id?: string | null }): string[] {
  const out: string[] = [];
  for (const v of [brand.brand_id, brand.id]) {
    if (typeof v === "string" && v !== "" && !out.includes(v)) out.push(v);
  }
  return out;
}

export interface TableOutcome {
  table: string;
  /** Rows matching the brand before the delete. */
  before: number;
  /** Rows matching the brand after it. Anything but 0 is a failure. */
  after: number;
  /** Present when the delete or a count errored. */
  error?: string;
}

export interface BucketOutcome {
  bucket: string;
  /** Object keys found under the brand's prefixes. */
  found: number;
  /** Object keys still there afterwards. Anything but 0 is a failure. */
  remaining: number;
  error?: string;
}

export interface DeletionLog {
  brandId: string;
  brandName: string;
  userId: string;
  buckets: BucketOutcome[];
  tables: TableOutcome[];
  /** Whether auth.admin.deleteUser succeeded. */
  userDeleted: boolean;
  userError?: string;
}

/**
 * Did it all actually go?
 *
 * Deliberately not "did every call return without error". A delete that
 * reports success and leaves rows behind is the failure mode this item
 * exists to prevent, so the verdict is the *after* counts.
 */
export function deletionComplete(log: DeletionLog): boolean {
  return log.userDeleted
    && log.tables.every((t) => t.after === 0)
    && log.buckets.every((b) => b.remaining === 0)
    && log.buckets.length > 0;
}

/** Everything that did not come out clean, as sentences. */
export function deletionFailures(log: DeletionLog): string[] {
  const out: string[] = [];
  if (log.buckets.length === 0) out.push("no bucket was looked at");
  for (const b of log.buckets) {
    // -1 means the bucket could not be listed afterwards, which is not the
    // same as empty and must never read as one.
    if (b.remaining < 0) out.push(`${b.bucket}: could not be verified — ${b.error ?? "no listing"}`);
    else if (b.remaining > 0) out.push(`${b.bucket}: ${b.remaining} object(s) still present`);
    else if (b.error) out.push(`${b.bucket}: ${b.error}`);
  }
  for (const t of log.tables) {
    if (t.after > 0) out.push(`${t.table}: ${t.after} row(s) still present`);
    else if (t.error) out.push(`${t.table}: ${t.error}`);
  }
  if (!log.userDeleted) out.push(`auth user: ${log.userError ?? "not deleted"}`);
  return out;
}

/**
 * The record of erasure.
 *
 * "GDPR asks you to demonstrate erasure, and 'we ran the function' is not a
 * demonstration." So this names every relation and every bucket touched, with
 * counts, including the ones that held nothing — a table absent from the log
 * is indistinguishable from a table that was never looked at.
 */
export function formatDeletionLog(log: DeletionLog): string {
  const lines = [
    `[account-deletion] brand=${log.brandId} (${log.brandName}) user=${log.userId}`,
  ];
  for (const b of log.buckets) {
    lines.push(`  storage ${b.bucket}: ${b.found} removed, ${b.remaining} left${b.error ? `  ERROR ${b.error}` : ""}`);
  }
  for (const t of log.tables) {
    lines.push(`  rows ${t.table}: ${t.before} removed, ${t.after} left${t.error ? `  ERROR ${t.error}` : ""}`);
  }
  lines.push(`  auth user: ${log.userDeleted ? "deleted" : `NOT DELETED — ${log.userError ?? "unknown"}`}`);
  const failures = deletionFailures(log);
  lines.push(failures.length ? `  INCOMPLETE: ${failures.join("; ")}` : "  complete");
  return lines.join("\n");
}

/**
 * The confirmation the user typed against the brand name.
 *
 * "Confirmation is typing the brand name, not a checkbox." Trailing whitespace
 * is forgiven because it comes from a paste, not from a decision. Case is not:
 * an exact match is the whole point of asking, and a brand named `Vetra` is
 * not confirmed by `vetra` any more than by nothing.
 *
 * An empty brand name never matches anything, or an account whose brand row
 * lost its name would delete on an empty box.
 */
export function confirmationMatches(typed: unknown, brandName: unknown): boolean {
  if (typeof typed !== "string" || typeof brandName !== "string") return false;
  const target = brandName.trim();
  if (target === "") return false;
  return typed.trim() === target;
}
