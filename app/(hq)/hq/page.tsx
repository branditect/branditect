"use client";

/**
 * HQ · Accounts. spec: branditect-ui/spec/hq-accounts.md Part 2,
 * design: branditect-ui/reference/hq-accounts.html.
 *
 * Everything shown comes from /api/hq/accounts, which reads hq_accounts():
 * counts, sizes, timestamps, tiers and spend. Never a customer's content.
 * The shaping, sorting and colour rules live in lib/hq-view.ts, tested there.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authedFetch, authedJson } from "@/lib/authed-fetch";
import {
  bytes, euros, filterAccounts, isTestAccount, needsAttention, sortAccounts, toCsv, toView,
  type AccountRow, type AccountView, type SortKey, type Tone,
} from "@/lib/hq-view";
import type { PlanStatus, Tier } from "@/lib/plans";
import { TIER_CHIP, TierChip } from "./ui";

interface Totals {
  accounts: number;
  new_7d: number;
  active_7d: number;
  mrr_cents: number;
  mrr_last_month_cents: number;
  cost_month_cents: number | string;
  cost_last_month_cents: number | string;
  trials_ending_7d: number;
  platform_today: { spend_cents: number | string; soft_alert_cents: number; hard_stop_cents: number; soft_alerted_at: string | null } | null;
}

type Load =
  | { state: "loading" }
  | { state: "missing" }
  | { state: "error"; message: string }
  | { state: "notInstalled"; message: string }
  | { state: "ready"; rows: AccountRow[]; totals: Totals; generatedAt: string };

const PAGE = 25;

export default function HqAccountsPage() {
  const router = useRouter();
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [q, setQ] = useState("");
  const [tier, setTier] = useState<Tier | "all">("all");
  const [status, setStatus] = useState<PlanStatus | "any">("any");
  const [sort, setSort] = useState<{ key: SortKey; dir: "desc" | "asc" }>({ key: "ratio", dir: "desc" });
  const [page, setPage] = useState(0);
  const [showTests, setShowTests] = useState(false);

  useEffect(() => {
    let alive = true;
    authedFetch("/api/hq/accounts")
      .then(async (r) => {
        if (!alive) return;
        if (r.status === 404) return setLoad({ state: "missing" });
        const body = await r.json().catch(() => ({}));
        if (!r.ok) return setLoad({ state: "error", message: body.error ?? `HTTP ${r.status}` });
        if (body.installed === false) return setLoad({ state: "notInstalled", message: body.error });
        setLoad({ state: "ready", rows: body.rows ?? [], totals: body.totals, generatedAt: body.generated_at });
      })
      .catch((e) => alive && setLoad({ state: "error", message: String(e?.message ?? e) }));
    return () => { alive = false; };
  }, []);

  // Test accounts are left out unless asked for — of the table AND the tiles,
  // so every number on the screen is about customers.
  const realRows = useMemo(
    () => (load.state === "ready" ? load.rows.filter((r) => showTests || !isTestAccount(r)) : []),
    [load, showTests],
  );
  const testCount = load.state === "ready" ? load.rows.filter((r) => isTestAccount(r)).length : 0;
  const views = useMemo(() => realRows.map((r) => toView(r)), [realRows]);
  const shown = useMemo(
    () => sortAccounts(filterAccounts(views, q, tier, status), sort.key, sort.dir),
    [views, q, tier, status, sort],
  );
  useEffect(() => setPage(0), [q, tier, status, sort, showTests]);

  if (load.state === "loading") return <p className="text-[13px] text-muted py-10">Loading accounts…</p>;
  if (load.state === "missing") return <p className="text-[13px] text-muted py-10">Not found.</p>;
  if (load.state === "error") return <Notice tone="bad" text={`Could not load accounts: ${load.message}`} />;
  if (load.state === "notInstalled") return <Notice tone="warn" text={load.message} />;

  const t = { ...load.totals, ...tilesFrom(realRows) };
  const costMonth = Number(t.cost_month_cents) || 0;
  const costLast = Number(t.cost_last_month_cents) || 0;
  const margin = t.mrr_cents > 0 ? Math.round(((t.mrr_cents - costMonth) / t.mrr_cents) * 100) : null;
  const attention = needsAttention(views, realRows);
  const pageRows = shown.slice(page * PAGE, page * PAGE + PAGE);
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const plat = t.platform_today;

  const setSortKey = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" }));

  const exportCsv = async () => {
    const blob = new Blob([toCsv(shown)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `branditect-accounts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    await authedJson("/api/hq/audit", "POST", { action: "export_csv", rows: shown.length }).catch(() => undefined);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4 mb-[18px]">
        <div>
          <div className="text-[10px] font-extrabold tracking-[1.3px] uppercase text-violet">Branditect HQ</div>
          <h1 className="text-[26px] font-extrabold tracking-[-0.8px] mt-1">Accounts</h1>
          <p className="text-[13px] text-muted mt-[3px]">Everyone who has ever signed up, what they are on, and what they cost.</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-[7px] bg-card border border-rule-2 rounded-full px-3.5 py-[7px] text-xs font-bold text-muted">
          <i className="w-[7px] h-[7px] rounded-full bg-good flex-none" />
          Live · loaded {new Date(load.generatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          {plat && (
            <span className="ml-1 text-ink-2">
              · Today {euros(Number(plat.spend_cents))} of {euros(plat.hard_stop_cents)} platform ceiling
              {plat.soft_alerted_at ? " · soft alert crossed" : ""}
            </span>
          )}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-[11px] mb-3">
        <Tile k="Accounts" v={String(t.accounts)} d={`${t.new_7d} new this week`} tone={t.new_7d > 0 ? "ok" : "none"} />
        <Tile k="Active 7d" v={String(t.active_7d)} d={t.accounts ? `${Math.round((t.active_7d / t.accounts) * 100)}% of accounts` : "—"} />
        <Tile k="MRR" v={euros(t.mrr_cents)} d={delta(t.mrr_cents - t.mrr_last_month_cents, "on last month")} tone={t.mrr_cents >= t.mrr_last_month_cents ? "ok" : "bad"} />
        <Tile k="Cost this month" v={euros(costMonth)} d={delta(costMonth - costLast, "on last month")} tone={costMonth > costLast ? "bad" : "ok"} />
        <Tile k="Gross margin" v={margin === null ? "—" : `${margin}%`} d={margin === null ? "no revenue yet" : "MRR minus cost"} />
        <Tile k="Trials ending" v={String(t.trials_ending_7d)} d="within 7 days" />
      </div>

      {attention.length > 0 && (
        <div className="bg-card border border-rule-2 border-l-[3px] border-l-accent rounded-2xl px-[18px] py-[15px] mb-5 shadow-sm">
          <h3 className="text-[13.5px] font-extrabold flex items-center gap-2">
            Needs attention <span className="text-[10.5px] font-extrabold bg-tint-1 text-accent-dark rounded-[5px] px-[7px] py-0.5">{attention.length}</span>
          </h3>
          <ul className="mt-[11px] flex flex-col gap-2">
            {attention.map((a, i) => (
              <li key={i} className="flex items-center gap-2.5 text-[13px] text-ink-2">
                <span className={`w-[7px] h-[7px] rounded-full flex-none ${a.tone === "bad" ? "bg-danger" : "bg-amber"}`} />
                <span className="sr-only">{a.tone === "bad" ? "Problem:" : "Warning:"}</span>
                <span>{a.text}</span>
                {a.brandId && (
                  <Link prefetch={false} href={`/hq/accounts/${encodeURIComponent(a.brandId)}`} className="ml-auto text-[11.5px] font-extrabold text-accent-dark whitespace-nowrap">
                    Open account →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-[9px] mb-[11px]">
        <label className="relative flex-1 min-w-[220px] max-w-[340px]">
          <span className="sr-only">Search brand or email</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search brand or email…"
            className="w-full border border-rule-2 rounded-full bg-card px-3.5 py-[9px] text-[13px] outline-none focus:border-accent"
          />
        </label>
        <Segmented
          value={tier}
          onChange={(v) => setTier(v as Tier | "all")}
          options={[["all", "All"], ["free", "Free"], ["pro", "Pro"], ["pro_plus", "Pro Plus"], ["enterprise", "Enterprise"]]}
        />
        <Segmented
          value={status}
          onChange={(v) => setStatus(v as PlanStatus | "any")}
          options={[["any", "Any status"], ["trialing", "Trialing"], ["past_due", "Past due"], ["cancelled", "Cancelled"]]}
        />
        <label className="ml-auto flex items-center gap-1.5 text-[12px] font-bold text-muted cursor-pointer">
          <input type="checkbox" checked={showTests} onChange={(e) => setShowTests(e.target.checked)} />
          Show test accounts ({testCount})
        </label>
        <button
          type="button"
          onClick={() => void exportCsv()}
          className=" border border-rule-2 bg-card rounded-full px-[15px] py-2 text-[12.5px] font-bold text-ink-2 hover:border-accent-line hover:text-accent-dark"
        >
          Export CSV
        </button>
      </div>

      <div className="bg-card border border-rule-2 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[980px]">
            <thead>
              <tr>
                <Th k="name" sort={sort} onSort={setSortKey}>Brand</Th>
                <Th k="tier" sort={sort} onSort={setSortKey}>Plan</Th>
                <Th k="signedUp" sort={sort} onSort={setSortKey}>Signed up</Th>
                <Th k="lastActive" sort={sort} onSort={setSortKey}>Last active</Th>
                <Th k="readiness" sort={sort} onSort={setSortKey} num>Readiness</Th>
                <Th k="storage" sort={sort} onSort={setSortKey} num>Storage</Th>
                <Th k="credits" sort={sort} onSort={setSortKey} num>Credits used</Th>
                <Th k="cost" sort={sort} onSort={setSortKey} num>Cost to serve 30d</Th>
                <Th k="ratio" sort={sort} onSort={setSortKey} num>Cost vs revenue</Th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((v) => (
                <Row key={v.brandId} v={v} onOpen={() => router.push(`/hq/accounts/${encodeURIComponent(v.brandId)}`)} />
              ))}
              {pageRows.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-[13px] text-muted">No accounts match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 border-t border-rule-2 bg-tile-2 text-[12.5px] font-semibold text-muted">
          Showing {pageRows.length} of {shown.length} accounts
          {pages > 1 && (
            <div className="ml-auto flex gap-1.5">
              {Array.from({ length: pages }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i)}
                  className={`border rounded-[7px] px-[11px] py-[5px] text-xs font-extrabold ${i === page ? "bg-ink text-card border-ink" : "bg-card border-rule-2 text-ink-2"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3.5 mt-3 text-[11.5px] font-semibold text-muted">
        <Legend cls="bg-faint-2" label="Free" />
        <Legend cls="bg-accent" label="Pro" />
        <Legend cls="bg-violet" label="Pro Plus" />
        <Legend cls="bg-tier-ent" label="Enterprise" />
        <span className="ml-3" />
        <Legend cls="bg-violet" label="Cost from credits" />
        <Legend cls="bg-tier-ent" label="Cost from indexing" />
        <Legend cls="bg-danger" label="Cost from failures" />
        <span className="ml-3" />
        <Legend cls="bg-green-ink" label="Under 30% of revenue" />
        <Legend cls="bg-amber" label="30 to 60%" />
        <Legend cls="bg-danger" label="Over 60%, or unpaid" />
      </div>

      {/* Not decoration, and it does not get removed when the page grows (spec). */}
      <p className="mt-4 bg-lavender/40 border border-lav-line rounded-[11px] px-4 py-[13px] text-[12.5px] text-lav-ink leading-relaxed">
        <b className="font-extrabold">Metadata only.</b> This screen shows counts, sizes, timestamps and spend. It never
        shows a customer&apos;s strategy, tone of voice, product costs, uploaded documents or anything Studio wrote for
        them. Opening an account shows the same kinds of number in more detail, never their content.
      </p>
    </div>
  );
}

/** The tiles, from the rows on screen: test accounts excluded unless shown. */
function tilesFrom(rows: AccountRow[]) {
  const now = Date.now();
  const week = 7 * 86_400_000;
  return {
    accounts: rows.length,
    new_7d: rows.filter((r) => r.signed_up_at && now - Date.parse(r.signed_up_at) < week).length,
    active_7d: rows.filter((r) => r.last_active_at && now - Date.parse(r.last_active_at) < week).length,
    mrr_cents: rows.filter((r) => r.status === "active" || r.status === "past_due").reduce((s, r) => s + (Number(r.mrr_cents) || 0), 0),
    cost_month_cents: rows.reduce((s, r) => s + (Number(r.cost_month_cents) || 0), 0),
    trials_ending_7d: rows.filter((r) => r.status === "trialing" && r.trial_ends_at
      && Date.parse(r.trial_ends_at) - now < week && Date.parse(r.trial_ends_at) >= now).length,
  };
}

function delta(cents: number, suffix: string): string {
  if (cents === 0) return `no change ${suffix}`;
  return `${cents > 0 ? "▲" : "▼"} ${euros(Math.abs(cents))} ${suffix}`;
}

function Notice({ tone, text }: { tone: "warn" | "bad"; text: string }) {
  return (
    <div className={`rounded-[11px] px-4 py-3 text-[13px] font-semibold ${tone === "bad" ? "bg-danger-wash text-danger" : "bg-amber-wash text-ink-2"}`}>
      {text}
    </div>
  );
}

function Tile({ k, v, d, tone = "none" }: { k: string; v: string; d: string; tone?: Tone }) {
  const cls = tone === "ok" ? "text-green-ink" : tone === "bad" ? "text-danger" : "text-muted-2";
  return (
    <div className="bg-card border border-rule-2 rounded-2xl px-4 py-[15px] shadow-sm">
      <div className="text-[10.5px] font-extrabold tracking-[0.9px] uppercase text-muted-2">{k}</div>
      <div className="text-[27px] font-extrabold tracking-[-1.1px] leading-tight mt-2 tabular-nums">{v}</div>
      <div className={`text-[11.5px] font-bold mt-[5px] ${cls}`}>{d}</div>
    </div>
  );
}

function Segmented({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="flex bg-card border border-rule-2 rounded-full p-[3px]" role="group">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={`rounded-full px-[13px] py-1.5 text-xs font-extrabold ${value === v ? "bg-ink text-card" : "text-muted-2"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Th({ k, sort, onSort, num, children }: {
  k: SortKey; sort: { key: SortKey; dir: "desc" | "asc" }; onSort: (k: SortKey) => void; num?: boolean; children: React.ReactNode;
}) {
  const on = sort.key === k;
  return (
    <th
      scope="col"
      aria-sort={on ? (sort.dir === "desc" ? "descending" : "ascending") : "none"}
      className={`bg-tile-2 text-[10.5px] font-extrabold tracking-[0.7px] uppercase px-3 py-[11px] border-b border-rule-2 align-bottom ${num ? "text-right" : "text-left"} ${on ? "text-accent-dark" : "text-muted-2"}`}
    >
      <button type="button" onClick={() => onSort(k)} className={`uppercase tracking-[0.7px] leading-tight max-w-[92px] ${num ? "text-right" : "text-left"}`}>
        {children}
        <span className={on ? "ml-1" : "ml-1 opacity-40"}>{on && sort.dir === "asc" ? "▲" : "▼"}</span>
      </button>
    </th>
  );
}

function Meter({ pct, cls, label }: { pct: number; cls: string; label: string }) {
  return (
    <div className="w-[68px] ml-auto">
      <div className="text-[11px] font-extrabold text-ink-2 text-right mb-1 tabular-nums">{label}</div>
      <div className="h-[5px] rounded bg-rule overflow-hidden">
        <i className={`block h-full rounded ${cls}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
    </div>
  );
}

function Spark({ days }: { days: number[] }) {
  return (
    <span className="flex items-end gap-px h-[18px]" aria-hidden="true">
      {days.map((d, i) => (
        <i key={i} className={`block w-[3px] rounded-sm ${d ? "h-[18px] bg-violet" : "h-[3px] bg-rule-2"}`} />
      ))}
    </span>
  );
}

const RATIO_CLS: Record<Tone, string> = {
  ok: "bg-green-wash text-green-ink",
  warn: "bg-amber-wash text-ink-2",
  bad: "bg-danger-wash text-danger",
  none: "bg-tile text-muted",
};

function Row({ v, onOpen }: { v: AccountView; onOpen: () => void }) {
  const ago = v.lastActive;
  const agoCls = ago.tone === "dead" ? "text-danger" : ago.tone === "recent" ? "text-ink" : "text-muted-2";
  const total = v.costSplit.credits + v.costSplit.indexing + v.costSplit.failures;
  const seg = (x: number, cls: string) =>
    x > 0 && total > 0 ? <i className={`block h-full rounded ${cls}`} style={{ width: `${(x / total) * 100}%` }} /> : null;
  const readinessCls = v.readiness === 100 ? "bg-green-ink" : v.readiness >= 75 ? "bg-accent" : "bg-faint-2";
  return (
    <tr onClick={onOpen} className="cursor-pointer hover:bg-tile-2 border-b border-rule last:border-b-0">
      <td className="px-3 py-3 text-[13px]">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`w-[30px] h-[30px] rounded-lg flex-none grid place-items-center text-[11px] font-extrabold text-white ${TIER_CHIP[v.tier].dot}`}>
            {v.initials}
          </span>
          <span className="min-w-0 max-w-[150px]">
            <Link prefetch={false} href={`/hq/accounts/${encodeURIComponent(v.brandId)}`} onClick={(e) => e.stopPropagation()} className="font-extrabold leading-tight block truncate">
              {v.name}
            </Link>
            <span className="text-[11.5px] text-muted-2 leading-tight block truncate">{v.email || "no owner email"}</span>
          </span>
        </div>
      </td>
      <td className="px-3 py-3 text-[13px] whitespace-nowrap">
        <TierChip tier={v.tier} />
        {v.status !== "active" && (
          <span className="block w-fit mt-1 text-[10px] font-extrabold rounded px-[5px] py-0.5 bg-amber-wash text-ink-2">
            {v.trialDaysLeft !== null ? `Trial ends ${v.trialDaysLeft}d` : v.statusLabel}
          </span>
        )}
      </td>
      <td className="px-3 py-3 text-[13px] text-muted font-semibold whitespace-nowrap">
        {v.signedUpAt ? shortDate(v.signedUpAt) : "—"}
      </td>
      <td className="px-3 py-3 text-[13px]">
        <div className="flex items-center gap-[9px]">
          <Spark days={v.activity14} />
          <span className={`text-[12.5px] font-bold whitespace-nowrap ${agoCls}`}>{ago.label}</span>
        </div>
      </td>
      <td className="px-3 py-3"><Meter pct={v.readiness} cls={readinessCls} label={`${v.readiness}%`} /></td>
      <td className="px-3 py-3 text-right">
        {v.storagePct !== null
          ? <Meter pct={v.storagePct} cls="bg-tier-ent" label={`${v.storagePct}%`} />
          : <div className="text-[11px] font-extrabold text-ink-2">agreed</div>}
        <div className="text-[11px] font-semibold text-muted-2 mt-[3px] whitespace-nowrap">
          {bytes(v.storageBytes)}{v.storageCapBytes ? ` / ${bytes(v.storageCapBytes)}` : ""}
        </div>
      </td>
      <td className="px-3 py-3 text-right">
        <Meter pct={v.creditsPct} cls={v.creditsCapped ? "bg-amber" : "bg-violet"} label={`${v.creditsPct}%`} />
        <div className="text-[11px] font-semibold text-muted-2 mt-[3px] whitespace-nowrap">
          {v.creditsUsed} / {v.creditsCap}{v.creditsCapped ? " · capped" : ""}
        </div>
      </td>
      <td className="px-3 py-3 text-right">
        <div className="inline-flex flex-col items-end gap-[5px]">
          <b className="text-[13px] font-extrabold tabular-nums">{euros(v.costCents)}</b>
          <div className="flex gap-0.5 w-[64px] h-[5px] rounded overflow-hidden bg-rule" aria-hidden="true">
            {seg(v.costSplit.credits, "bg-violet")}
            {seg(v.costSplit.indexing, "bg-tier-ent")}
            {seg(v.costSplit.failures, "bg-danger")}
          </div>
          <span className="sr-only">
            credits {euros(v.costSplit.credits)}, indexing {euros(v.costSplit.indexing)}, failures {euros(v.costSplit.failures)}
          </span>
        </div>
      </td>
      <td className="px-3 py-3 text-right">
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-extrabold tabular-nums whitespace-nowrap ${RATIO_CLS[v.ratio.tone]}`}>
          {v.ratio.tone === "ok" ? "✓" : "!"} {v.ratio.label}
        </span>
        {v.ratio.why && <div className="text-[10.5px] font-semibold text-muted-2 mt-1 ml-auto max-w-[120px] leading-snug">{v.ratio.why}</div>}
      </td>
    </tr>
  );
}

/** "12 Mar", with the year only when it is not this one. */
function shortDate(iso: string): string {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-GB", sameYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "2-digit" });
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <i className={`w-[9px] h-[9px] rounded-full flex-none ${cls}`} aria-hidden="true" />
      {label}
    </span>
  );
}
