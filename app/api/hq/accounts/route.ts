/**
 * HQ · Accounts data. Operator-only, 404 for everyone else.
 *
 * Reads exactly one thing: hq_accounts() in supabase/hq-accounts.sql, which
 * returns metadata only. This file selects no table directly — so there is no
 * column list here to get wrong, and lib/hq-sentinel.test.ts checks both.
 */
import { NextRequest, NextResponse } from "next/server";
import { hqNotFound, operatorFromRequest } from "@/lib/hq-access";
import { writeAudit } from "@/lib/hq-audit";
import { serviceClient } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const op = await operatorFromRequest(req);
  if (!op) return hqNotFound();

  const sb = serviceClient();
  // Close reservations the app never settled, so their cost shows up here.
  await sb.rpc("budget_expire_stale").then(() => undefined, () => undefined);

  const { data, error } = await sb.rpc("hq_accounts");
  if (error) {
    const missing = error.code === "PGRST202" || /could not find the function/i.test(error.message);
    return NextResponse.json(
      missing
        ? { installed: false, error: "HQ is not installed yet: run supabase/hq-billing.sql, then supabase/hq-accounts.sql." }
        : { error: error.message },
      { status: missing ? 200 : 500, headers: { "cache-control": "no-store" } },
    );
  }

  await writeAudit(op, "view_accounts", null);
  return NextResponse.json(
    { installed: true, operator: op.email, ...(data as object) },
    { headers: { "cache-control": "no-store" } },
  );
}
