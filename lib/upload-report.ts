/**
 * What to say when an upload does not land.
 *
 * components/file-library.tsx discarded the result of its brand_images insert
 * entirely — `await supabase.from("brand_images").insert({...})` with nothing
 * destructured. supabase-js resolves `{ data, error }` and never throws, so a
 * rejected row produced no exception, no message and no file: the upload
 * appeared to work and silently did nothing.
 *
 * That silence is exactly why a stale migration file could pass for a live
 * bug. supabase/brand_images.sql still showed a six-value CHECK constraint that
 * would have rejected `video`, `audio`, `graphic` and `web`, and if it had
 * still been live, every upload in four of the five tabs would have failed
 * without saying so — indistinguishable, from the outside, from a feature
 * nobody had used yet.
 *
 * Kept out of the component so the reporting can be tested: the runner strips
 * types but does not parse JSX.
 */

export type FailureKind = "storage" | "row" | "too-big";

export interface UploadFailure {
  fileName: string;
  kind: FailureKind;
  detail?: string | null;
}

/**
 * One file's failure, in a sentence. The database's own words are kept — a
 * check-constraint violation names the constraint, which is the difference
 * between "it did not work" and a fixable report.
 */
export function describeFailure(f: UploadFailure): string {
  const name = f.fileName || "That file";
  switch (f.kind) {
    case "too-big":
      return `${name} is over the size limit and was not uploaded.`;
    case "storage":
      return `${name} could not be stored${f.detail ? `: ${f.detail}` : "."}`;
    case "row":
      // The bytes are in storage but nothing points at them, which is worse
      // than a plain failure: retrying leaves an orphan behind.
      return `${name} was uploaded but could not be saved to the library${f.detail ? `: ${f.detail}` : "."}`;
  }
}

/**
 * The banner for a batch. Null means every file landed — the only case in
 * which saying nothing is correct.
 */
export function summariseUpload(failures: UploadFailure[], attempted: number): string | null {
  if (failures.length === 0) return null;
  if (failures.length === 1) return describeFailure(failures[0]);

  const kinds = new Set(failures.map((f) => f.kind));
  const lead = `${failures.length} of ${attempted} files did not upload.`;
  if (kinds.size === 1) {
    // One cause, so name it once rather than repeating it per file.
    const sample = describeFailure({ ...failures[0], fileName: "" }).replace(/^That file /, "");
    return `${lead} ${sample}`;
  }
  return `${lead} ${failures.map((f) => describeFailure(f)).join(" ")}`;
}

/**
 * Did this attempt actually store anything. Used to decide whether to refetch;
 * a batch where nothing landed should not look like it refreshed successfully.
 */
export function anyLanded(failures: UploadFailure[], attempted: number): boolean {
  return attempted - failures.length > 0;
}
