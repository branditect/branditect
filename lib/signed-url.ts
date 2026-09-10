/**
 * One place that turns a stored row into a URL you can put in an <img>.
 *
 * Queue item 3. The buckets are public today and private tomorrow, and this
 * helper is what makes that a migration rather than an outage:
 *
 *   - It prefers `storage_path` and signs it.
 *   - It falls back to the stored `file_url` when there is no path yet, or when
 *     signing fails.
 *
 * So it is correct BEFORE supabase/private-buckets.sql is run (no path column,
 * public URL, returns the URL unchanged), DURING (path present, bucket still
 * public, returns a signed URL that works anyway), and AFTER (path present,
 * bucket private, signing is the only thing that works). Nothing has to be
 * timed.
 *
 * BATCHED, BECAUSE FORTY ROUND TRIPS IS A BLANK GRID. `createSignedUrls`
 * (plural) takes a list. Signing forty images one call at a time is forty
 * round trips before Knowledge ▸ Media paints anything, which is criterion 5.
 */
import { parseStorageUrl } from "./storage-paths.ts";

/** One hour. Long enough for a working session, short enough to be worth expiring. */
export const SIGNED_URL_TTL_SECONDS = 3600;

/** The bit of the supabase client this needs, so a route can pass the service client. */
export interface StorageSigner {
  storage: {
    from(bucket: string): {
      createSignedUrl(path: string, expiresIn: number): Promise<{
        data: { signedUrl: string } | null;
        error: { message: string } | null;
      }>;
      createSignedUrls(paths: string[], expiresIn: number): Promise<{
        data: ({ path?: string | null; signedUrl?: string | null; error?: string | null } | null)[] | null;
        error: { message: string } | null;
      }>;
    };
  };
}

export interface Displayable {
  /** The object key, once the migration has run. Null before it has. */
  storagePath?: string | null;
  /** The stored public URL. Kept forever; it is the fallback. */
  fileUrl?: string | null;
}

/**
 * The path to sign for one row.
 *
 * Falls back to parsing the stored URL, which is how this works before the
 * backfill has run: the path is already inside the URL, it is simply not in a
 * column yet.
 */
export function pathFor(item: Displayable, bucket: string): string | null {
  if (typeof item.storagePath === "string" && item.storagePath !== "") return item.storagePath;
  const ref = parseStorageUrl(item.fileUrl);
  return ref && ref.bucket === bucket ? ref.path : null;
}

/**
 * Sign one. Returns the fallback URL rather than null when signing fails —
 * a bucket that is still public signs fine, and one that is private but
 * missing the object is a broken image either way, so the stored URL is never
 * a worse answer than nothing.
 */
export async function signedUrl(
  client: StorageSigner,
  bucket: string,
  item: Displayable,
): Promise<string | null> {
  const path = pathFor(item, bucket);
  if (!path) return item.fileUrl ?? null;
  const { data, error } = await client.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  // supabase-js resolves { data, error } and never throws, so an unchecked call
  // here would render `undefined` into a src attribute.
  if (error || !data?.signedUrl) return item.fileUrl ?? null;
  return data.signedUrl;
}

/**
 * Sign a whole grid in one call.
 *
 * Returns an array the same length and order as the input — a caller that
 * zipped a shorter array back onto its rows would silently shift every image
 * by one, so the length is preserved even for rows that could not be signed.
 */
export async function signedUrls(
  client: StorageSigner,
  bucket: string,
  items: Displayable[],
): Promise<(string | null)[]> {
  const paths = items.map((i) => pathFor(i, bucket));
  const wanted: string[] = [];
  const slotOf = new Map<number, number>();
  paths.forEach((p, i) => {
    if (p) { slotOf.set(i, wanted.length); wanted.push(p); }
  });

  if (wanted.length === 0) return items.map((i) => i.fileUrl ?? null);

  const { data, error } = await client.storage.from(bucket)
    .createSignedUrls(wanted, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return items.map((i) => i.fileUrl ?? null);

  return items.map((item, i) => {
    const slot = slotOf.get(i);
    if (slot === undefined) return item.fileUrl ?? null;
    const signed = data[slot]?.signedUrl;
    return typeof signed === "string" && signed !== "" ? signed : (item.fileUrl ?? null);
  });
}
