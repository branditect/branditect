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
import { translate, type StringKey, type Vars } from "./i18n/index.ts";

/**
 * A translator. Components pass `useT()`; everything else, tests included,
 * gets English, so the English wording has one definition: the dictionary.
 */
type Tr = (key: StringKey, vars?: Vars) => string;
const EN: Tr = (key, vars) => translate("en", key, vars);

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
export function describeFailure(f: UploadFailure, t: Tr = EN): string {
  const name = f.fileName || t("files.upload.thatFile");
  switch (f.kind) {
    case "too-big":
      return t("files.upload.tooBig", { name });
    case "storage":
      return f.detail ? t("files.upload.storageDetail", { name, detail: f.detail }) : t("files.upload.storage", { name });
    case "row":
      // The bytes are in storage but nothing points at them, which is worse
      // than a plain failure: retrying leaves an orphan behind.
      return f.detail ? t("files.upload.rowDetail", { name, detail: f.detail }) : t("files.upload.row", { name });
  }
}

/** The same failure with no file named, for a batch that shares one cause. */
function describeCause(f: UploadFailure, t: Tr): string {
  switch (f.kind) {
    case "too-big": return t("files.upload.sameTooBig");
    case "storage": return f.detail ? t("files.upload.sameStorageDetail", { detail: f.detail }) : t("files.upload.sameStorage");
    case "row": return f.detail ? t("files.upload.sameRowDetail", { detail: f.detail }) : t("files.upload.sameRow");
  }
}

/**
 * The banner for a batch. Null means every file landed — the only case in
 * which saying nothing is correct.
 */
export function summariseUpload(failures: UploadFailure[], attempted: number, t: Tr = EN): string | null {
  if (failures.length === 0) return null;
  if (failures.length === 1) return describeFailure(failures[0], t);

  const kinds = new Set(failures.map((f) => f.kind));
  const lead = t("files.upload.lead", { failed: failures.length, attempted });
  if (kinds.size === 1) {
    // One cause, so name it once rather than repeating it per file.
    return `${lead} ${describeCause(failures[0], t)}`;
  }
  return `${lead} ${failures.map((f) => describeFailure(f, t)).join(" ")}`;
}

/**
 * Did this attempt actually store anything. Used to decide whether to refetch;
 * a batch where nothing landed should not look like it refreshed successfully.
 */
export function anyLanded(failures: UploadFailure[], attempted: number): boolean {
  return attempted - failures.length > 0;
}
