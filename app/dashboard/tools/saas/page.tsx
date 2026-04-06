"use client";

import { useState } from "react";
import Link from "next/link";

function Slider({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[0.58rem] tracking-wider uppercase text-muted">{label}</span>
        <span className="font-mono text-[0.7rem] text-ink font-medium">
          {unit === "%" ? `${value}%` : `€${value.toLocaleString()}`}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step || 1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-light rounded-full appearance-none cursor-pointer accent-brand-orange" />
    </div>
  );
}

function MetricCard({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${warn ? "border-red-300 bg-red-50" : "border-light bg-white"}`}>
      <div className="font-mono text-[0.52rem] tracking-wider uppercase text-muted mb-1">{label}</div>
      <div className={`font-semibold text-xl ${warn ? "text-red-600" : "text-ink"}`}>{value}</div>
    </div>
  );
}

/* ================================================================== */
/*  Break-even SVG chart                                               */
/* ================================================================== */

function BreakEvenChart({ fixedCosts, pricePerUser, variableCost, vatRate, currentUsers, maxUsers }: {
  fixedCosts: number; pricePerUser: number; variableCost: number; vatRate: number; currentUsers: number; maxUsers: number;
}) {
  const W = 600, H = 280, P = 40;
  const chartW = W - P * 2, chartH = H - P * 2;

  const revenueExVat = pricePerUser / (1 + vatRate / 100);
  const contributionPerUser = revenueExVat - variableCost;
  const breakEvenUsers = contributionPerUser > 0 ? Math.ceil(fixedCosts / contributionPerUser) : maxUsers;

  const xMax = Math.max(maxUsers, breakEvenUsers * 1.5, currentUsers * 1.5, 50);
  const yMaxRevenue = xMax * revenueExVat;
  const yMaxCost = fixedCosts + xMax * variableCost;
  const yMax = Math.max(yMaxRevenue, yMaxCost, 1) * 1.1;

  const toX = (users: number) => P + (users / xMax) * chartW;
  const toY = (val: number) => P + chartH - (val / yMax) * chartH;

  const beX = toX(breakEvenUsers);
  const curX = toX(currentUsers);

  // Revenue line points
  const revPoints = Array.from({ length: 50 }, (_, i) => {
    const u = (i / 49) * xMax;
    return `${toX(u)},${toY(u * revenueExVat)}`;
  }).join(" ");

  // Cost line points
  const costPoints = Array.from({ length: 50 }, (_, i) => {
    const u = (i / 49) * xMax;
    return `${toX(u)},${toY(fixedCosts + u * variableCost)}`;
  }).join(" ");

  // Fill area: green above break-even (revenue > cost)
  const greenFill = Array.from({ length: 50 }, (_, i) => {
    const u = (i / 49) * xMax;
    if (u < breakEvenUsers) return null;
    return { x: toX(u), yRev: toY(u * revenueExVat), yCost: toY(fixedCosts + u * variableCost) };
  }).filter(Boolean) as { x: number; yRev: number; yCost: number }[];

  const greenPath = greenFill.length > 1
    ? `M${greenFill[0].x},${greenFill[0].yRev} ${greenFill.map((p) => `L${p.x},${p.yRev}`).join(" ")} ${[...greenFill].reverse().map((p) => `L${p.x},${p.yCost}`).join(" ")} Z`
    : "";

  // Red fill: loss zone (cost > revenue before break-even)
  const redFill = Array.from({ length: 50 }, (_, i) => {
    const u = (i / 49) * Math.min(breakEvenUsers, xMax);
    return { x: toX(u), yRev: toY(u * revenueExVat), yCost: toY(fixedCosts + u * variableCost) };
  });

  const redPath = redFill.length > 1
    ? `M${redFill[0].x},${redFill[0].yRev} ${redFill.map((p) => `L${p.x},${p.yRev}`).join(" ")} ${[...redFill].reverse().map((p) => `L${p.x},${p.yCost}`).join(" ")} Z`
    : "";

  const currentRevenue = currentUsers * revenueExVat;
  const curY = toY(currentRevenue);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 280 }}>
      {/* Axis */}
      <line x1={P} y1={P} x2={P} y2={P + chartH} stroke="#E5E5E5" strokeWidth={1} />
      <line x1={P} y1={P + chartH} x2={P + chartW} y2={P + chartH} stroke="#E5E5E5" strokeWidth={1} />

      {/* Red loss zone */}
      {redPath && <path d={redPath} fill="rgba(239,68,68,0.1)" />}

      {/* Green profit zone */}
      {greenPath && <path d={greenPath} fill="rgba(34,197,94,0.1)" />}

      {/* Cost line */}
      <polyline points={costPoints} fill="none" stroke="#9CA3AF" strokeWidth={2} strokeDasharray="4,4" />

      {/* Revenue line */}
      <polyline points={revPoints} fill="none" stroke="#E8562A" strokeWidth={2} />

      {/* Break-even line */}
      <line x1={beX} y1={P} x2={beX} y2={P + chartH} stroke="#E8562A" strokeWidth={1.5} strokeDasharray="6,4" />
      <text x={beX} y={P - 6} textAnchor="middle" className="font-mono" fontSize={9} fill="#E8562A">
        BE: {breakEvenUsers} users
      </text>

      {/* Current users dot */}
      <circle cx={curX} cy={curY} r={5} fill="#E8562A" />
      <text x={curX} y={curY - 10} textAnchor="middle" className="font-mono" fontSize={8} fill="#1A1A1A">
        {currentUsers} users
      </text>

      {/* Labels */}
      <text x={P + chartW} y={P + chartH + 16} textAnchor="end" className="font-mono" fontSize={9} fill="#9A9A9A">Users →</text>
      <text x={P - 4} y={P + 4} textAnchor="end" className="font-mono" fontSize={9} fill="#9A9A9A">€</text>

      {/* Legend */}
      <line x1={P + 10} y1={H - 8} x2={P + 24} y2={H - 8} stroke="#E8562A" strokeWidth={2} />
      <text x={P + 28} y={H - 4} className="font-mono" fontSize={8} fill="#6B6B6B">Revenue</text>
      <line x1={P + 80} y1={H - 8} x2={P + 94} y2={H - 8} stroke="#9CA3AF" strokeWidth={2} strokeDasharray="4,4" />
      <text x={P + 98} y={H - 4} className="font-mono" fontSize={8} fill="#6B6B6B">Costs</text>
    </svg>
  );
}

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

export default function SaaSPage() {
  const [price, setPrice] = useState(49);
  const [users, setUsers] = useState(120);
  const [vat, setVat] = useState(24);
  const [churn, setChurn] = useState(5);
  const [fixed, setFixed] = useState(8000);
  const [variable, setVariable] = useState(8);

  const grossMRR = price * users;
  const revenueExVatPerUser = price / (1 + vat / 100);
  const totalRevenueExVat = revenueExVatPerUser * users;
  const vatAmount = grossMRR - totalRevenueExVat;
  const totalVariable = variable * users;
  const contributionMargin = totalRevenueExVat - totalVariable;
  const monthlyProfit = contributionMargin - fixed;
  const arr = totalRevenueExVat * 12;

  const contributionPerUser = revenueExVatPerUser - variable;
  const breakEvenUsers = contributionPerUser > 0 ? Math.ceil(fixed / contributionPerUser) : 0;

  const mrrAtRisk = grossMRR * (churn / 100);
  const usersChurned = Math.round(users * (churn / 100));
  const ltv = churn > 0 ? revenueExVatPerUser / (churn / 100) : revenueExVatPerUser * 100;

  const churnLabel = churn <= 3 ? "Healthy" : churn <= 7 ? "Watch" : "Critical";
  const churnColor = churn <= 3 ? "bg-green-50 border-green-200 text-green-700" : churn <= 7 ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-red-50 border-red-200 text-red-700";

  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="px-8 pt-7 pb-4 border-b border-light shrink-0">
        <Link href="/dashboard/tools" className="text-muted hover:text-ink text-[0.75rem]">← Business Tools</Link>
        <h1 className="font-semibold text-[1.5rem] text-ink tracking-tight mt-1 mb-1">SaaS Metrics</h1>
        <p className="text-[0.78rem] text-muted">Model your subscription business — MRR, churn, break-even, and P&L.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Left: sliders */}
          <div>
            <Slider label="Price per seat / month" value={price} min={10} max={2000} onChange={setPrice} />
            <Slider label="Active users" value={users} min={0} max={500} unit="%" onChange={setUsers} />
            <Slider label="VAT rate" value={vat} min={0} max={27} unit="%" onChange={setVat} />
            <Slider label="Monthly churn" value={churn} min={0} max={20} step={0.5} unit="%" onChange={setChurn} />
            <Slider label="Monthly fixed costs" value={fixed} min={0} max={200000} step={500} onChange={setFixed} />
            <Slider label="Variable cost per user / month" value={variable} min={0} max={200} onChange={setVariable} />
          </div>

          {/* Right: metrics */}
          <div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <MetricCard label="Gross MRR" value={`€${grossMRR.toLocaleString()}`} />
              <MetricCard label="ARR (ex VAT)" value={`€${Math.round(arr).toLocaleString()}`} />
              <MetricCard label="Monthly profit/loss" value={`€${Math.round(monthlyProfit).toLocaleString()}`} warn={monthlyProfit < 0} />
              <MetricCard label="Break-even users" value={contributionPerUser > 0 ? `${breakEvenUsers}` : "N/A"} />
            </div>

            {/* Churn badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-[0.62rem] tracking-wide mb-4 ${churnColor}`}>
              <span className="font-medium">{churnLabel}</span> — {churn}% monthly churn = {usersChurned} users lost/month
            </div>
          </div>
        </div>

        {/* Break-even chart */}
        <div className="mt-6 mb-6 bg-white border border-light rounded-lg p-4">
          <div className="font-mono text-[0.52rem] tracking-wider uppercase text-muted mb-3">Break-Even Analysis</div>
          <BreakEvenChart
            fixedCosts={fixed}
            pricePerUser={price}
            variableCost={variable}
            vatRate={vat}
            currentUsers={users}
            maxUsers={500}
          />
        </div>

        {/* Monthly P&L */}
        <div className="border border-light rounded-lg overflow-hidden mb-6">
          <div className="font-mono text-[0.52rem] tracking-wider uppercase text-muted px-4 py-2 bg-pale">Monthly P&L</div>
          {[
            ["Gross MRR", `€${grossMRR.toLocaleString()}`, false],
            ["VAT", `−€${Math.round(vatAmount).toLocaleString()}`, false],
            ["Revenue (ex VAT)", `€${Math.round(totalRevenueExVat).toLocaleString()}`, false],
            ["Variable costs", `−€${Math.round(totalVariable).toLocaleString()}`, false],
            ["Contribution margin", `€${Math.round(contributionMargin).toLocaleString()}`, false],
            ["Fixed costs", `−€${fixed.toLocaleString()}`, false],
            ["Monthly profit/loss", `€${Math.round(monthlyProfit).toLocaleString()}`, true],
            ["MRR at risk (churn)", `€${Math.round(mrrAtRisk).toLocaleString()}`, false],
            ["Customer LTV", `€${Math.round(ltv).toLocaleString()}`, false],
          ].map(([label, value, bold], i) => (
            <div key={i} className={`flex justify-between px-4 py-2 text-[0.75rem] border-b border-light last:border-0 ${bold ? "font-medium bg-pale" : ""}`}>
              <span className="text-muted">{label as string}</span>
              <span className={`text-ink ${bold ? "font-medium" : ""}`}>{value as string}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
