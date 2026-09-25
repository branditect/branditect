/**
 * Records HQ actions that happen in the browser — today, exporting the
 * accounts table as CSV. The export is built client-side from data the
 * operator already loaded (and was audited loading); this makes the fact that
 * it left the screen a row too.
 */
import { NextRequest, NextResponse } from "next/server";
import { hqNotFound, operatorFromRequest } from "@/lib/hq-access";
import { writeAudit } from "@/lib/hq-audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const op = await operatorFromRequest(req);
  if (!op) return hqNotFound();
  const body = (await req.json().catch(() => ({}))) as { action?: unknown; rows?: unknown };
  if (body.action !== "export_csv") return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  await writeAudit(op, "export_csv", null, { rows: Number(body.rows) || 0 });
  return NextResponse.json({ ok: true });
}
