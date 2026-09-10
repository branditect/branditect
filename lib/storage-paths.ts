/**
 * Turning a stored public URL back into a bucket and an object path.
 *
 * Part 2 of branditect-ui/spec/security-hardening.md, queue item 3. The whole
 * change rests on one fact: **a signed URL expires, so it cannot be stored.**
 * Every table in this app stores the full public URL, so making a bucket
 * private without first storing the path turns every image in the app into a
 * dead link in one statement, for everyone, with no way back except making the
 * bucket public again.
 *
 * So: store the path, sign at read time. This file is the parse that gets from
 * one to the other, and it is deliberately the ONLY one. The spec says reuse
 * the parse that already exists rather than writing a second — it was
 * `split("/brand-images/")[1]` in components/image-library.tsx and again in
 * file-library.tsx, once per bucket, which is exactly the shape that goes
 * wrong when a third bucket appears. Both now call this.
 *
 * WHAT THE LIVE DATABASE ACTUALLY HOLDS, measured 2026-09-10 rather than
 * assumed from the spec — see COLUMNS below. The spec named three buckets and
 * one of them does not exist.
 */

/** The marker Supabase puts in every public object URL. */
export const PUBLIC_MARK = "/storage/v1/object/public/";

/** The marker in a signed one. Its presence in a stored column is a bug. */
export const SIGNED_MARK = "/storage/v1/object/sign/";

export interface StorageRef {
  bucket: string;
  /** The object key inside the bucket, decoded, with no query string. */
  path: string;
}

/**
 * Parse a stored URL.
 *
 * Returns null for anything that is not a Supabase public object URL — an
 * external image, an empty string, a data: URI. Null means "leave it alone",
 * never "broken".
 *
 * The query string is stripped: the templates screen appends `?t=<timestamp>`
 * for cache-busting, and while it stores the clean URL today, a cache-buster
 * that ever reached the column would otherwise become part of the object key
 * and resolve to nothing.
 */
export function parseStorageUrl(url: unknown): StorageRef | null {
  if (typeof url !== "string" || url === "") return null;
  const at = url.indexOf(PUBLIC_MARK);
  if (at === -1) return null;
  const rest = url.slice(at + PUBLIC_MARK.length).split("?")[0].split("#")[0];
  const slash = rest.indexOf("/");
  if (slash <= 0) return null;
  const bucket = rest.slice(0, slash);
  const raw = rest.slice(slash + 1);
  if (!raw) return null;
  let path: string;
  try {
    path = decodeURIComponent(raw);
  } catch {
    // A stray % in a filename is not a reason to lose the row.
    path = raw;
  }
  return { bucket, path };
}

/** The path only, when the caller already knows which bucket it wants. */
export function storagePathFromUrl(url: unknown, bucket: string): string | null {
  const ref = parseStorageUrl(url);
  return ref && ref.bucket === bucket ? ref.path : null;
}

/** True when a URL is a signed one. Used by the test that keeps them out of the database. */
export function isSignedUrl(url: unknown): boolean {
  return typeof url === "string" && url.indexOf(SIGNED_MARK) !== -1;
}

/**
 * The brand a path belongs to, by convention: every upload path in this
 * codebase starts with the brand_id.
 *
 * The storage policies scope on exactly this, so a row whose path prefix is
 * not its own brand_id becomes invisible the moment the bucket goes private.
 * That is why the audit checks it rather than trusting the convention.
 */
export function brandPrefixOf(path: string): string {
  return path.split("/")[0] ?? "";
}

export interface UrlColumn {
  table: string;
  column: string;
  /** Where the storage path is written. null where no such column can exist. */
  pathColumn: string | null;
  bucket: string;
  /** Rows carrying a public URL when this was measured. */
  measured: number;
  note?: string;
}

/**
 * Every column in the live database holding a public storage URL.
 *
 * Found by reading one page of every table and scanning every string column
 * for the public marker, not by grepping the code — two of these are written
 * by routes that name no bucket near the insert.
 *
 * Measured 2026-09-10.
 */
export const COLUMNS: UrlColumn[] = [
  { table: "brand_images", column: "file_url", pathColumn: "storage_path", bucket: "brand-images", measured: 114 },
  { table: "catalog_products", column: "image_url", pathColumn: "image_storage_path", bucket: "brand-images", measured: 10 },
  { table: "brand_book_pages", column: "file_url", pathColumn: "storage_path", bucket: "brand-assets", measured: 43 },
  { table: "brand_logos", column: "file_url", pathColumn: "storage_path", bucket: "brand-assets", measured: 15 },
  { table: "brand_templates", column: "thumbnail_url", pathColumn: "thumbnail_path", bucket: "brand-assets", measured: 5,
    note: "thumbnail_path already exists and is used for deletion; the backfill fills it where it is null." },
  { table: "brands", column: "logo_url", pathColumn: "logo_storage_path", bucket: "brand-assets", measured: 3 },
  { table: "brand_visual", column: "guideline_url", pathColumn: "guideline_storage_path", bucket: "brand-assets", measured: 1 },
  {
    table: "mission_notes", column: "content", pathColumn: null, bucket: "brand-images", measured: 3,
    note:
      "A URL inside free text, not a URL column. There is no path column that would help: " +
      "the content is prose with an image link in it. Three rows. Flagged rather than migrated — " +
      "see the report.",
  },
];
