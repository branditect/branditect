import { NextRequest, NextResponse } from "next/server";
import { serviceClient as supabase } from "@/lib/supabase-admin";
import { resolveBrand } from "@/lib/api-auth";
import { requireEnv } from "@/lib/env";
import {
  BRAND_KEY,
  relationsWithBrandId,
  storagePrefixesFor,
  confirmationMatches,
  deletionComplete,
  deletionFailures,
  formatDeletionLog,
  type BucketOutcome,
  type DeletionLog,
  type TableOutcome,
} from "@/lib/account-deletion";

/**
 * Delete an account and everything under it.
 *
 * Part 4 of branditect-ui/spec/security-hardening.md. The reasoning lives in
 * lib/account-deletion.ts; this is the part that talks to the database.
 *
 * Storage first, rows second, the auth user last, and every step verified by
 * re-reading rather than by the absence of an error. A delete that reports
 * success and leaves the files behind is the most common way this is got
 * wrong, and it is invisible from the caller's side.
 */
export const maxDuration = 120;

/**
 * Every object key under one prefix, paging through subdirectories.
 *
 * A listing error is returned, not swallowed. The first version returned the
 * keys it had so far, which meant a failed listing produced a short list
 * before the delete AND a short list after it — the verification agreed with
 * the deletion because both were blind in the same way, and the account was
 * reported erased with its files still there.
 */
async function objectsUnder(bucket: string, prefix: string): Promise<{ keys: string[]; error?: string }> {
  const keys: string[] = [];
  const queue = [prefix];
  while (queue.length) {
    const dir = queue.shift() as string;
    let offset = 0;
    for (;;) {
      const { data, error } = await supabase.storage.from(bucket).list(dir, { limit: 1000, offset });
      if (error || !data) return { keys, error: error?.message ?? "no listing" };
      for (const entry of data) {
        const key = dir ? `${dir}/${entry.name}` : entry.name;
        // A folder comes back with no id. Supabase has no recursive list.
        if (entry.id === null || entry.id === undefined) queue.push(key);
        else keys.push(key);
      }
      if (data.length < 1000) break;
      offset += 1000;
    }
  }
  return { keys };
}

/**
 * The live schema, from PostgREST's own OpenAPI document.
 *
 * Not a list in this codebase, and not `information_schema` either — reaching
 * that needs a SECURITY DEFINER function, which needs a migration this item is
 * not allowed. PostgREST generates this from the same catalogue and refreshes
 * it when the schema changes, so a table added tomorrow is enumerated
 * tomorrow with nothing here edited.
 */
async function liveSchema(): Promise<unknown> {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const res = await fetch(`${url}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`could not read the schema: ${res.status}`);
  return res.json();
}

async function countFor(table: string, brandId: string): Promise<{ n: number; error?: string }> {
  const { count, error } = await supabase
    .from(table).select("*", { count: "exact", head: true }).eq(BRAND_KEY, brandId);
  if (error) return { n: -1, error: error.message };
  return { n: count ?? 0 };
}

export async function POST(req: NextRequest) {
  let body: { confirm?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const auth = await resolveBrand(req);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const { brandId, userId } = auth;

  // The brand row is read before anything is touched: its name is what the
  // confirmation is checked against, and its UUID is the second storage
  // prefix. Reading it afterwards would be reading a row that is gone.
  const { data: brand, error: brandError } = await supabase
    .from("brands").select("id, brand_id, brand_name").eq(BRAND_KEY, brandId).maybeSingle();
  if (brandError) return NextResponse.json({ error: brandError.message }, { status: 500 });
  if (!brand) return NextResponse.json({ error: "No brand for this account" }, { status: 403 });

  if (!confirmationMatches(body?.confirm, brand.brand_name)) {
    // The name is not echoed back. It is already on the screen that asks for
    // it, and a mismatch is the user's typing, not a fact they need told.
    return NextResponse.json({ error: "That is not the brand name." }, { status: 400 });
  }

  let tables: string[];
  try {
    tables = relationsWithBrandId(await liveSchema());
  } catch (e) {
    // Refused, not guessed. A fallback list here would delete most of an
    // account and report that it deleted all of it.
    const message = e instanceof Error ? e.message : "could not enumerate the schema";
    console.error("[account-deletion] refused:", message);
    return NextResponse.json({ error: "Could not read the schema. Nothing was deleted." }, { status: 503 });
  }

  const log: DeletionLog = {
    brandId, brandName: brand.brand_name ?? "", userId,
    buckets: [], tables: [], userDeleted: false,
  };

  // ── 1 · storage, because the files are the part that was actually private ──
  const prefixes = storagePrefixesFor(brand);
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  // An empty list is refused as well as an error. This app has four buckets;
  // zero means the listing failed quietly, and the deletion would otherwise
  // report success having looked at nothing. Found by control.
  if (bucketError || !buckets || buckets.length === 0) {
    console.error("[account-deletion] refused: could not list buckets:", bucketError?.message ?? "none returned");
    return NextResponse.json({ error: "Could not read storage. Nothing was deleted." }, { status: 503 });
  }

  for (const b of buckets) {
    const outcome: BucketOutcome = { bucket: b.name, found: 0, remaining: 0 };
    const keys: string[] = [];
    for (const prefix of prefixes) {
      const listed = await objectsUnder(b.name, prefix);
      if (listed.error) outcome.error = listed.error;
      keys.push(...listed.keys);
    }
    outcome.found = keys.length;
    if (keys.length) {
      // remove() takes at most 1000 keys per call.
      for (let i = 0; i < keys.length; i += 1000) {
        const { error } = await supabase.storage.from(b.name).remove(keys.slice(i, i + 1000));
        if (error) outcome.error = error.message;
      }
    }
    let left = 0;
    for (const prefix of prefixes) {
      const listed = await objectsUnder(b.name, prefix);
      // A bucket that cannot be listed afterwards is not an empty bucket.
      if (listed.error) { outcome.error = listed.error; left = -1; break; }
      left += listed.keys.length;
    }
    outcome.remaining = left;
    log.buckets.push(outcome);
  }

  // ── 2 · rows, every relation carrying a brand_id, brands last ─────────────
  for (const table of tables) {
    const outcome: TableOutcome = { table, before: 0, after: 0 };
    const before = await countFor(table, brandId);
    if (before.error) {
      // A relation that cannot be counted is not skipped quietly: after stays
      // -1 and deletionComplete fails on it.
      outcome.before = -1; outcome.after = -1; outcome.error = before.error;
      log.tables.push(outcome);
      continue;
    }
    outcome.before = before.n;

    const { error } = await supabase.from(table).delete().eq(BRAND_KEY, brandId);
    if (error) outcome.error = error.message;

    const after = await countFor(table, brandId);
    outcome.after = after.error ? -1 : after.n;
    if (after.error && !outcome.error) outcome.error = after.error;
    log.tables.push(outcome);
  }

  // ── 3 · the auth user, last, so a half-failure is retryable ───────────────
  // Only when everything above came out clean. Deleting the user first would
  // leave rows and files nobody can reach, sign in as, or retry.
  // Rows and files only. `deletionFailures` also reports the auth user, which
  // has not been attempted yet at this point — including it here made the
  // pre-check always fail and the user never get deleted.
  const residue = deletionFailures({ ...log, userDeleted: true });
  if (residue.length === 0) {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) log.userError = error.message;
    else log.userDeleted = true;
  } else {
    log.userError = "not attempted: rows or files remain";
  }

  console.log(formatDeletionLog(log));

  if (!deletionComplete(log)) {
    return NextResponse.json(
      { error: "Deletion did not complete. Nothing has been left signed in; try again.", incomplete: deletionFailures(log) },
      { status: 500 },
    );
  }
  return NextResponse.json({ deleted: true, tables: log.tables.length, buckets: log.buckets.length });
}
