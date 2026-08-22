"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/products";
import { recurring } from "@/lib/numbers";
import { CalcShell, Field, Panel, Readout, toNum } from "@/components/numbers/calc-shell";

export default function RecurringCalculator() {
  const [arpu, setArpu] = useState("");
  const [churn, setChurn] = useState("");
  const [cac, setCac] = useState("");
  const [gm, setGm] = useState("80");
  const currency = "GBP";

  const a = toNum(arpu);
  const ch = toNum(churn);
  const cc = toNum(cac);
  const g = toNum(gm);
  const r = a != null && ch != null && cc != null && g != null
    ? recurring({ arpu: a, churnPct: ch, cac: cc, grossMarginPct: g })
    : null;

  const unhealthy = r != null && r.ltvToCac < 1;

  return (
    <CalcShell n={4} tone="blue" title="Recurring revenue"
      promise="See what a customer is worth over time.">
      <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] items-start gap-3 stack:grid-cols-1">
        <Panel title="Your subscription numbers">
          <p className="mt-1 text-xs font-medium leading-[1.55] text-muted">
            One-off pricing asks what a sale is worth. Recurring asks what a customer is worth, and
            how long it takes to earn back what you spent getting them.
          </p>
          <div className="mt-4 flex flex-col gap-2.5">
            <Field label="Revenue per customer" hint="per month, net of tax" value={arpu} onChange={setArpu} suffix={currency} />
            <Field label="Gross margin" hint="on that revenue, after cost to serve" value={gm} onChange={setGm} suffix="%" />
            <Field label="Monthly churn" hint="share who leave each month" value={churn} onChange={setChurn} suffix="%" />
            <Field label="Cost to acquire" hint="marketing and sales, per customer" value={cac} onChange={setCac} suffix={currency} />
          </div>
        </Panel>

        <div className="flex flex-col gap-3">
          <Readout tone="blue" label="Lifetime value" warn={unhealthy}
            value={r == null ? "—" : formatMoney(r.ltv, currency)}
            sub={r == null
              ? ch === 0
                ? "At zero churn nobody ever leaves, so lifetime is infinite — not a number worth showing."
                : "Fill in all four fields."
              : <>{r.lifetimeMonths.toFixed(1)} months at {formatMoney((a ?? 0) * ((g ?? 0) / 100), currency)} gross profit a month. Computed on gross profit, not revenue — revenue ignores what serving them costs.</>}
          />
          <Readout tone="blue" label="Payback"
            value={r == null ? "—" : r.paybackMonths === Infinity ? "Never" : `${r.paybackMonths.toFixed(1)} months`}
            sub={r == null ? undefined
              : r.paybackMonths === Infinity
                ? "There is no margin to pay back the acquisition cost."
                : `How long before a customer has repaid what you spent acquiring them. LTV is ${r.ltvToCac.toFixed(1)}× acquisition cost.`}
          />
          {unhealthy && (
            <p className="rounded-card border border-accent-line bg-tint-1 px-3.5 py-3 text-2xs font-medium leading-[1.6] text-accent-dark">
              Each customer is worth less than they cost to acquire. Growing faster makes this worse,
              not better — the fix is churn, margin or acquisition cost, not volume.
            </p>
          )}
        </div>
      </div>
    </CalcShell>
  );
}
