/**
 * Every HQ action is written down: who, what, which brand, when (hq.md). A
 * support tool nobody can audit is indistinguishable from a backdoor.
 *
 * Page views are actions too — reading across every brand is the thing that
 * needs a record, not only changing one.
 */

import type { Operator } from "./hq-access.ts";

export type HqAction = "view_accounts" | "view_account" | "set_plan" | "export_csv";

export async function writeAudit(
  op: Operator,
  action: HqAction,
  targetBrand: string | null,
  details: Record<string, unknown> | null = null,
): Promise<void> {
  const { serviceClient } = await import("./api-auth.ts");
  const { error } = await serviceClient().from("hq_audit").insert({
    operator_id: op.id,
    operator_email: op.email,
    action,
    target_brand: targetBrand,
    details,
  });
  if (error) {
    // Not fatal to a page view, but never silent: an unaudited HQ is the
    // failure this table exists to prevent.
    console.error(`[hq] audit write failed (${action})`, error.message);
  }
}
