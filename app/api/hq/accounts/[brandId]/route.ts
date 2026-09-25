/**
 * HQ · one account. GET: the same metadata as the table plus 90 days of
 * activity and usage by kind (hq_account()). POST: change the plan — the only
 * support action built so far — through hq_set_plan(), which moves the budget
 * caps with the tier. Both are written to hq_audit.
 *
 * Metadata only, like the table: never strategy, tone, products, documents or
 * anything Studio wrote.
 */
import { NextRequest, NextResponse } from "next/server";
import { hqNotFound, operatorFromRequest } from "@/lib/hq-access";
import { writeAudit } from "@/lib/hq-audit";
import { serviceClient } from "@/lib/api-auth";
import { isStatus, isTier } from "@/lib/plans";

export const dynamic = "force-dynamic";

const BRAND_ID = /^[a-z0-9][a-z0-9_-]{0,80}$/i;

export async function GET(req: NextRequest, { params }: { params: { brandId: string } }) {
  const op = await operatorFromRequest(req);
  if (!op) return hqNotFound();
  const brandId = decodeURIComponent(params.brandId);
  if (!BRAND_ID.test(brandId)) return hqNotFound();

  const sb = serviceClient();
  const [all, one] = await Promise.all([sb.rpc("hq_accounts"), sb.rpc("hq_account", { p_brand: brandId })]);
  if (all.error || one.error) {
    return NextResponse.json({ error: (all.error ?? one.error)!.message }, { status: 500 });
  }
  const rows = ((all.data as { rows?: { brand_id: string }[] })?.rows ?? []);
  const row = rows.find((r) => r.brand_id === brandId);
  if (!row) return hqNotFound();

  await writeAudit(op, "view_account", brandId);
  return NextResponse.json({ row, detail: one.data }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: NextRequest, { params }: { params: { brandId: string } }) {
  const op = await operatorFromRequest(req);
  if (!op) return hqNotFound();
  const brandId = decodeURIComponent(params.brandId);
  if (!BRAND_ID.test(brandId)) return hqNotFound();

  const body = (await req.json().catch(() => ({}))) as {
    tier?: unknown; status?: unknown; mrr_cents?: unknown; trial_ends_at?: unknown;
  };
  const mrr = Number(body.mrr_cents);
  const trial = typeof body.trial_ends_at === "string" && body.trial_ends_at ? body.trial_ends_at : null;
  if (!isTier(body.tier) || !isStatus(body.status) || !Number.isInteger(mrr) || mrr < 0 || mrr > 10_000_000
      || (trial !== null && Number.isNaN(Date.parse(trial)))) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const { error } = await serviceClient().rpc("hq_set_plan", {
    p_brand: brandId, p_tier: body.tier, p_status: body.status, p_mrr_cents: mrr, p_trial_ends_at: trial,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAudit(op, "set_plan", brandId, { tier: body.tier, status: body.status, mrr_cents: mrr, trial_ends_at: trial });
  return NextResponse.json({ ok: true });
}
