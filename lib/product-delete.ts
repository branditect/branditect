/**
 * Removing a product.
 *
 * Soft delete, not DELETE. A product row carries the landed cost, the tax
 * rate, the floor price, the maximum discount and the margin guardrails
 * somebody worked out once, and Supabase is on the Free plan: no scheduled
 * backups, no point-in-time recovery. This project has already lost a product
 * description permanently. A row marked `deleted_at` can be brought back; a
 * deleted one cannot.
 *
 * Pure, so the rules can be asserted without a database.
 */
import { translate, type StringKey, type Vars } from "./i18n/index.ts";

/**
 * A translator. Components pass `useT()`; everything else, tests included,
 * gets English, so the English wording has one definition: the dictionary.
 */
type Tr = (key: StringKey, vars?: Vars) => string;
const EN: Tr = (key, vars) => translate("en", key, vars);

export interface DeletableRow {
  id: string;
  brand_id?: string | null;
  deleted_at?: string | null;
}

/** A row is live until it carries a deletion stamp. */
export function isLive(row: { deleted_at?: string | null } | null | undefined): boolean {
  return Boolean(row) && !row!.deleted_at;
}

export function liveOnly<T extends { deleted_at?: string | null }>(rows: T[] | null | undefined): T[] {
  return (rows ?? []).filter(isLive);
}

export function deletedOnly<T extends { deleted_at?: string | null }>(rows: T[] | null | undefined): T[] {
  return (rows ?? []).filter((r) => Boolean(r.deleted_at));
}

/**
 * How long a deleted product stays recoverable. Stated in one place because
 * the copy on screen and any future purge job have to agree, and a promise of
 * thirty days that is silently seven is worse than no promise.
 */
export const RECOVERABLE_DAYS = 30;

export function daysLeft(deletedAt: string, now: Date = new Date()): number {
  const gone = new Date(deletedAt).getTime();
  if (Number.isNaN(gone)) return RECOVERABLE_DAYS;
  const elapsed = (now.getTime() - gone) / 86_400_000;
  return Math.max(0, Math.ceil(RECOVERABLE_DAYS - elapsed));
}

/** The line under a deleted row. */
export function recoveryNote(deletedAt: string, now: Date = new Date()): string {
  const left = daysLeft(deletedAt, now);
  if (left <= 0) return "Due to be cleared";
  if (left === 1) return "1 day left to restore";
  return `${left} days left to restore`;
}

/**
 * What the confirm step says. Naming the product is the whole point: a generic
 * "are you sure" is the dialog people click through without reading.
 */
export function confirmCopy(name: string, t: Tr = EN): { title: string; body: string; confirm: string } {
  return {
    title: t("product.confirmTitle", { name }),
    body: t("product.confirmBody", { days: RECOVERABLE_DAYS }),
    confirm: t("product.confirmRemove"),
  };
}
