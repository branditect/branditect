/**
 * Can this upload possibly land?
 *
 * WHY THIS EXISTS. Storage answers three different situations with one
 * sentence — "new row violates row-level security policy":
 *
 *   1. nobody is signed in (the session expired while the tab stayed open),
 *   2. the brand is `default`, which no account owns,
 *   3. the folder belongs to a brand owned by another account.
 *
 * Confirmed against the live project: all three produce that exact string, and
 * an upload into one's own brand folder succeeds. The message is therefore
 * correct and useless — it names the rule that refused, not the thing the
 * person has to change. Two of the three are fixable by the person in about
 * five seconds, once they are told which one happened.
 *
 * The first two are knowable *before* any bytes are sent, which is what this
 * checks. The third can only be found out by asking storage, so it is handled
 * by explainStorageDetail() below, on the way back.
 */
import { supabase } from "@/lib/supabase";
import type { StringKey } from "@/lib/i18n";

/** The brand id useBrand() falls back to when it finds no brand row. */
export const NO_BRAND = "default";

export type UploadBlock = { key: StringKey } | null;

/**
 * Null when the upload may proceed, otherwise the string to show.
 *
 * Deliberately not throwing: a caller that forgets a try/catch would turn a
 * "sign in again" into a blank screen, which is the failure this whole file
 * exists to stop.
 */
export async function uploadBlocker(brandId: string | null | undefined): Promise<UploadBlock> {
  if (!brandId || brandId === NO_BRAND) return { key: "files.upload.noBrand" };

  // getSession reads the stored token; getUser would verify it against the
  // server. The distinction matters here: an expired token is exactly the
  // case being caught, and getSession refreshes it when it can.
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return { key: "files.upload.signedOut" };

  return null;
}

/**
 * Storage's own words, made actionable.
 *
 * Only the row-level-security sentence is rewritten, and only when the
 * preflight above has already ruled out the two causes it can see — so what
 * is left is "this folder is not yours". Every other message is kept as it
 * came: a size limit or a MIME rejection already says what to do.
 */
export function explainStorageDetail(
  detail: string | null | undefined,
  t: (key: StringKey) => string,
): string | null {
  if (!detail) return detail ?? null;
  return /row-level security/i.test(detail) ? t("files.upload.notYourBrand") : detail;
}
