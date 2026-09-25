"use client";

/**
 * HQ · one account. spec: hq.md §3.
 *
 * Metadata only — never their brand content. Plan and budget, 90 days of
 * activity, usage by kind with cost and failures, the four readiness checks as
 * yes/no, storage, and every HQ action taken on this account.
 *
 * One support action is built: changing the plan, which moves the budget caps
 * with it (hq_set_plan) and is written to the audit log. Password reset, trial
 * extension, credit adjustment and "view as this account" are not built yet.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { authedFetch, authedJson } from "@/lib/authed-fetch";
import { STATUS_LABEL, bytes, euros, toView, type AccountRow } from "@/lib/hq-view";
import { STATUSES, TIERS, type PlanStatus, type Tier } from "@/lib/plans";
import { TIER_LABEL } from "@/lib/hq-view";
import { TierChip } from "../../ui";

interface Detail {
  activity_days: string[];
  usage_by_kind: { kind: string; events: number; failures: number; cost_cents: number | string; credits: number }[];
  usage_by_day: { day: string; cost_cents: number | string; events: number }[];
  audit: { at: string; operator: string | null; action: string }[];
}

const KIND_LABEL: Record<string, string> = {
  image: "Images", copy: "Copy", chat: "Chat", index: "Indexing", analyse: "Setup & analysis",
};

export default function HqAccountPage({ params }: { params: { brandId: string } }) {
  const brandId = decodeURIComponent(params.brandId);
  const [row, setRow] = useState<AccountRow | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await authedFetch(`/api/hq/accounts/${encodeURIComponent(brandId)}`);
    if (r.status === 404) return setState("missing");
    const body = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMessage(body.error ?? `HTTP ${r.status}`);
      return setState("error");
    }
    setRow(body.row);
    setDetail(body.detail);
    setState("ready");
  }, [brandId]);

  useEffect(() => { void load(); }, [load]);

  if (state === "loading") return <p className="text-[13px] text-muted py-10">Loading account…</p>;
  if (state === "missing") return <p className="text-[13px] text-muted py-10">Not found.</p>;
  if (state === "error" || !row || !detail) {
    return <p className="rounded-[11px] bg-danger-wash text-danger px-4 py-3 text-[13px] font-semibold">{message}</p>;
  }

  const v = toView(row);
  const checks: [string, boolean][] = [
    ["Questionnaire gate cleared", v.gateCleared],
    ["Six files in Knowledge", row.documents + row.presentations + row.links >= 6],
    ["Seven brand and product images", row.brand_images >= 7],
    ["Brand guideline uploaded", row.has_guideline],
  ];
  const totalEvents = detail.usage_by_kind.reduce((s, k) => s + Number(k.events), 0);
  const totalFailures = detail.usage_by_kind.reduce((s, k) => s + Number(k.failures), 0);
  const maxDayCost = Math.max(0.01, ...detail.usage_by_day.map((d) => Number(d.cost_cents)));
  const active = new Set(detail.activity_days.map((d) => d.slice(0, 10)));
  const days90 = Array.from({ length: 90 }, (_, i) => new Date(Date.now() - (89 - i) * 86_400_000).toISOString().slice(0, 10));

  return (
    <div className="max-w-[1100px]">
      <Link href="/hq" className="text-[12px] font-bold text-muted hover:text-accent-dark">← Accounts</Link>
      <div className="flex flex-wrap items-end gap-3 mt-2 mb-5">
        <div className="min-w-0">
          <div className="text-[10px] font-extrabold tracking-[1.3px] uppercase text-violet">Account</div>
          <h1 className="text-[26px] font-extrabold tracking-[-0.8px] mt-1 truncate">{v.name}</h1>
          <p className="text-[13px] text-muted mt-[3px]">
            {v.email || "no owner email"} · {v.brandId} · signed up{" "}
            {v.signedUpAt ? new Date(v.signedUpAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <TierChip tier={v.tier} />
          <span className="text-[11.5px] font-extrabold rounded-full px-2.5 py-1 bg-tile text-ink-2">{v.statusLabel}</span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4 mb-3">
        <Stat k="Cost to serve 30d" v={euros(v.costCents)}
          d={`credits ${euros(v.costSplit.credits)} · indexing ${euros(v.costSplit.indexing)} · failures ${euros(v.costSplit.failures)}`} />
        <Stat k="Revenue" v={v.revenueCents ? `${euros(v.revenueCents)}/mo` : "Free"} d={v.ratio.pct === null ? "no revenue" : `cost is ${v.ratio.label} of revenue`} />
        <Stat k="Credits" v={`${v.creditsUsed} of ${v.creditsCap}`}
          d={`${row.period === "month" ? "resets monthly" : "once, no reset"}${v.creditsCapped ? " · capped" : ""}`} />
        <Stat k="Budget (cost ceiling)" v={`${euros(Number(row.cost_used_cents ?? 0))} of ${euros(row.cost_cap_cents ?? 0)}`}
          d={row.cost_cap_cents === null ? "no budget row yet — created on first paid call" : "hard stop; enforced by the database"} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Plan">
          <PlanForm brandId={brandId} row={row} onSaved={load} />
        </Panel>

        <Panel title={`Readiness · ${v.readiness}%`}>
          <ul className="flex flex-col gap-2 text-[13px]">
            {checks.map(([label, ok]) => (
              <li key={label} className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full grid place-items-center text-[11px] font-extrabold ${ok ? "bg-green-wash text-green-ink" : "bg-tile text-muted-2"}`}>
                  {ok ? "✓" : "–"}
                </span>
                <span className={ok ? "text-ink" : "text-muted"}>{label}</span>
                <span className="ml-auto text-[11.5px] font-bold text-muted-2">{ok ? "Done" : "Not yet"}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11.5px] text-muted-2">
            {row.documents} documents · {row.presentations} presentations · {row.links} links · {row.brand_images} brand images ·
            storage {bytes(v.storageBytes)} in {row.storage_files} files
          </p>
        </Panel>

        <Panel title={`Usage · 90 days · ${totalEvents} calls, ${totalFailures} failed`}>
          {detail.usage_by_kind.length === 0 ? (
            <p className="text-[13px] text-muted">No paid calls recorded yet.</p>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[10.5px] uppercase tracking-[0.7px] text-muted-2">
                  <th className="text-left font-extrabold pb-2">Kind</th>
                  <th className="text-right font-extrabold pb-2">Calls</th>
                  <th className="text-right font-extrabold pb-2">Failed</th>
                  <th className="text-right font-extrabold pb-2">Credits</th>
                  <th className="text-right font-extrabold pb-2">Cost</th>
                </tr>
              </thead>
              <tbody>
                {detail.usage_by_kind.map((k) => (
                  <tr key={k.kind} className="border-t border-rule">
                    <td className="py-1.5 font-bold">{KIND_LABEL[k.kind] ?? k.kind}</td>
                    <td className="py-1.5 text-right tabular-nums">{k.events}</td>
                    <td className={`py-1.5 text-right tabular-nums ${Number(k.failures) > 0 ? "text-danger font-bold" : ""}`}>{k.failures}</td>
                    <td className="py-1.5 text-right tabular-nums">{k.credits}</td>
                    <td className="py-1.5 text-right tabular-nums font-bold">{euros(Number(k.cost_cents))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Activity and cost · 90 days">
          <div className="flex items-end gap-px h-10" aria-label={`${active.size} active days in the last 90`}>
            {days90.map((d) => (
              <i key={d} title={d} className={`block flex-1 rounded-sm ${active.has(d) ? "h-full bg-violet" : "h-[3px] bg-rule-2"}`} />
            ))}
          </div>
          <p className="text-[11.5px] text-muted-2 mt-1">{active.size} active days in the last 90 · last active {v.lastActive.label.toLowerCase()}</p>
          <div className="flex items-end gap-px h-16 mt-4" aria-hidden="true">
            {days90.map((d) => {
              const c = Number(detail.usage_by_day.find((x) => x.day.slice(0, 10) === d)?.cost_cents ?? 0);
              return <i key={d} title={`${d}: ${euros(c)}`} className="block flex-1 rounded-sm bg-tier-ent" style={{ height: c > 0 ? `${Math.max(6, (c / maxDayCost) * 100)}%` : "0" }} />;
            })}
          </div>
          <p className="text-[11.5px] text-muted-2 mt-1">Cost to serve per day</p>
        </Panel>

        <Panel title="HQ actions on this account">
          {detail.audit.length === 0 ? (
            <p className="text-[13px] text-muted">None yet.</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-[12.5px]">
              {detail.audit.map((a, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-muted-2 tabular-nums whitespace-nowrap">{new Date(a.at).toLocaleString("en-GB")}</span>
                  <span className="font-bold">{a.action.replace(/_/g, " ")}</span>
                  <span className="text-muted truncate">{a.operator}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <p className="mt-4 bg-lavender/40 border border-lav-line rounded-[11px] px-4 py-[13px] text-[12.5px] text-lav-ink leading-relaxed">
        <b className="font-extrabold">Metadata only.</b> Counts, sizes, timestamps and spend. Never a customer&apos;s strategy,
        tone of voice, product costs, uploaded documents or anything Studio wrote for them.
      </p>
    </div>
  );
}

function Stat({ k, v, d }: { k: string; v: string; d: string }) {
  return (
    <div className="bg-card border border-rule-2 rounded-2xl px-4 py-[15px] shadow-sm">
      <div className="text-[10.5px] font-extrabold tracking-[0.9px] uppercase text-muted-2">{k}</div>
      <div className="text-[22px] font-extrabold tracking-[-0.8px] mt-1.5 tabular-nums">{v}</div>
      <div className="text-[11.5px] font-semibold text-muted-2 mt-1">{d}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card border border-rule-2 rounded-2xl px-[18px] py-4 shadow-sm">
      <h2 className="text-[13.5px] font-extrabold mb-3">{title}</h2>
      {children}
    </section>
  );
}

function PlanForm({ brandId, row, onSaved }: { brandId: string; row: AccountRow; onSaved: () => void }) {
  const [tier, setTier] = useState<Tier>(row.tier);
  const [status, setStatus] = useState<PlanStatus>(row.status);
  const [mrr, setMrr] = useState(((row.mrr_cents ?? 0) / 100).toFixed(2));
  const [trial, setTrial] = useState(row.trial_ends_at ? row.trial_ends_at.slice(0, 10) : "");
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const save = async () => {
    const cents = Math.round(Number(mrr.replace(",", ".")) * 100);
    if (!Number.isFinite(cents) || cents < 0) return setNote("MRR must be a number of euros.");
    setSaving(true);
    setNote(null);
    const r = await authedJson(`/api/hq/accounts/${encodeURIComponent(brandId)}`, "POST", {
      tier, status, mrr_cents: cents, trial_ends_at: trial ? new Date(`${trial}T23:59:00Z`).toISOString() : null,
    });
    setSaving(false);
    const body = await r.json().catch(() => ({}));
    if (!r.ok) return setNote(body.error ?? `HTTP ${r.status}`);
    setNote("Saved, and written to the audit log. The budget caps follow the tier.");
    onSaved();
  };

  const field = "w-full border border-rule-2 rounded-[9px] bg-card px-3 py-2 text-[13px] outline-none focus:border-accent";
  return (
    <div className="grid grid-cols-2 gap-3 text-[12px] font-bold text-muted">
      <label className="flex flex-col gap-1">Tier
        <select className={field} value={tier} onChange={(e) => setTier(e.target.value as Tier)}>
          {TIERS.map((t) => <option key={t} value={t}>{TIER_LABEL[t]}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1">Status
        <select className={field} value={status} onChange={(e) => setStatus(e.target.value as PlanStatus)}>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1">MRR, € per month (what they actually pay)
        <input className={field} inputMode="decimal" value={mrr} onChange={(e) => setMrr(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1">Trial ends
        <input className={field} type="date" value={trial} onChange={(e) => setTrial(e.target.value)} />
      </label>
      <div className="col-span-2 flex items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-full bg-ink text-card px-4 py-2 text-[12.5px] font-extrabold disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save plan"}
        </button>
        {note && <span className="text-[12px] font-semibold text-muted">{note}</span>}
      </div>
    </div>
  );
}
