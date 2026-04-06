"use client";

import { useState } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Slider component                                                   */
/* ------------------------------------------------------------------ */

function Slider({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[0.58rem] tracking-wider uppercase text-muted">{label}</span>
        <span className="font-mono text-[0.7rem] text-ink font-medium">{unit === "%" ? `${value}%` : `€${value.toFixed(2)}`}</span>
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
/*  Product Margin Calculator                                          */
/* ================================================================== */

function ProductMarginCalc() {
  const [retail, setRetail] = useState(79);
  const [discount, setDiscount] = useState(0);
  const [vat, setVat] = useState(24);
  const [cogs, setCogs] = useState(18);
  const [packaging, setPackaging] = useState(3);
  const [shipping, setShipping] = useState(5);
  const [cac, setCac] = useState(12);

  const salePrice = retail * (1 - discount / 100);
  const vatAmount = salePrice - salePrice / (1 + vat / 100);
  const revenueExVat = salePrice - vatAmount;
  const totalCosts = cogs + packaging + shipping + cac;
  const netProfit = revenueExVat - totalCosts;
  const netMargin = revenueExVat > 0 ? (netProfit / revenueExVat) * 100 : 0;
  const warn = netMargin < 15;

  const segments = [
    { label: "VAT", value: vatAmount, color: "#9CA3AF" },
    { label: "COGS", value: cogs, color: "#6B7280" },
    { label: "Packaging", value: packaging, color: "#D1D5DB" },
    { label: "Shipping", value: shipping, color: "#93C5FD" },
    { label: "CAC", value: cac, color: "#FCD34D" },
    { label: "Profit", value: Math.max(netProfit, 0), color: "#E8562A" },
  ];
  const segTotal = segments.reduce((s, x) => s + Math.max(x.value, 0), 0);

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <Slider label="Retail price" value={retail} min={1} max={500} onChange={setRetail} />
          <Slider label="Discount" value={discount} min={0} max={70} unit="%" onChange={setDiscount} />
          <Slider label="VAT rate" value={vat} min={0} max={27} unit="%" onChange={setVat} />
          <Slider label="COGS" value={cogs} min={0} max={300} onChange={setCogs} />
          <Slider label="Packaging" value={packaging} min={0} max={50} onChange={setPackaging} />
          <Slider label="Shipping" value={shipping} min={0} max={50} onChange={setShipping} />
          <Slider label="CAC" value={cac} min={0} max={150} onChange={setCac} />
        </div>

        <div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <MetricCard label="Revenue ex VAT" value={`€${revenueExVat.toFixed(2)}`} />
            <MetricCard label="Total costs" value={`€${totalCosts.toFixed(2)}`} />
            <MetricCard label="Net profit" value={`€${netProfit.toFixed(2)}`} warn={netProfit < 0} />
            <MetricCard label="Net margin" value={`${netMargin.toFixed(1)}%`} warn={warn} />
          </div>

          {warn && (
            <div className={`px-3 py-2 rounded-lg mb-4 text-[0.72rem] ${netProfit < 0 ? "bg-red-50 border border-red-200 text-red-700" : "bg-amber-50 border border-amber-200 text-amber-700"}`}>
              {netProfit < 0 ? "⚠ Negative margin — you're losing money on every sale." : "⚠ Margin below 15% — limited room for growth and unexpected costs."}
            </div>
          )}

          {/* Stacked bar */}
          <div className="font-mono text-[0.52rem] tracking-wider uppercase text-muted mb-2">Price Breakdown</div>
          <div className="flex h-8 rounded-md overflow-hidden mb-2">
            {segments.map((s) => {
              const pct = segTotal > 0 ? (Math.max(s.value, 0) / segTotal) * 100 : 0;
              return pct > 0 ? (
                <div key={s.label} style={{ width: `${pct}%`, background: s.color }} className="flex items-center justify-center">
                  {pct > 8 && <span className="text-[0.45rem] font-mono text-white font-medium">{s.label}</span>}
                </div>
              ) : null;
            })}
          </div>
          <div className="flex flex-wrap gap-3">
            {segments.map((s) => (
              <div key={s.label} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm" style={{ background: s.color }} />
                <span className="font-mono text-[0.5rem] text-muted">{s.label}: €{Math.max(s.value, 0).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Breakdown table */}
          <div className="mt-4 border border-light rounded-lg overflow-hidden">
            <div className="font-mono text-[0.52rem] tracking-wider uppercase text-muted px-3 py-2 bg-pale">Full Breakdown</div>
            {[
              ["Retail price", `€${retail.toFixed(2)}`],
              ["Discount", `−${discount}%`],
              ["Sale price", `€${salePrice.toFixed(2)}`],
              ["VAT", `−€${vatAmount.toFixed(2)}`],
              ["Revenue ex VAT", `€${revenueExVat.toFixed(2)}`],
              ["COGS", `−€${cogs.toFixed(2)}`],
              ["Packaging", `−€${packaging.toFixed(2)}`],
              ["Shipping", `−€${shipping.toFixed(2)}`],
              ["CAC", `−€${cac.toFixed(2)}`],
              ["Net profit", `€${netProfit.toFixed(2)}`],
              ["Net margin", `${netMargin.toFixed(1)}%`],
            ].map(([l, v], i) => (
              <div key={i} className={`flex justify-between px-3 py-1.5 text-[0.72rem] ${i >= 9 ? "font-medium bg-pale" : ""} ${i < 10 ? "border-b border-light" : ""}`}>
                <span className="text-muted">{l}</span>
                <span className="text-ink">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Wholesale & Retail Calculator                                      */
/* ================================================================== */

function WholesaleCalc() {
  const [cogsUnit, setCogsUnit] = useState(12);
  const [packUnit, setPackUnit] = useState(2.5);
  const [wholesale, setWholesale] = useState(28);
  const [qty, setQty] = useState(200);
  const [orderShipping, setOrderShipping] = useState(120);
  const [retailerMarkup, setRetailerMarkup] = useState(100);

  const shippingPerUnit = qty > 0 ? orderShipping / qty : 0;
  const costPerUnit = cogsUnit + packUnit + shippingPerUnit;
  const profitPerUnit = wholesale - costPerUnit;
  const yourMargin = wholesale > 0 ? (profitPerUnit / wholesale) * 100 : 0;
  const orderRevenue = wholesale * qty;
  const orderProfit = profitPerUnit * qty;
  const suggestedRetail = wholesale * (1 + retailerMarkup / 100);
  const retailerProfit = suggestedRetail - wholesale;
  const retailerMargin = suggestedRetail > 0 ? (retailerProfit / suggestedRetail) * 100 : 0;

  // Direct comparison
  const directProfit = suggestedRetail - costPerUnit;
  const directMargin = suggestedRetail > 0 ? (directProfit / suggestedRetail) * 100 : 0;

  return (
    <div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <Slider label="COGS per unit" value={cogsUnit} min={0} max={300} step={0.5} onChange={setCogsUnit} />
          <Slider label="Packaging per unit" value={packUnit} min={0} max={50} step={0.5} onChange={setPackUnit} />
          <Slider label="Wholesale price per unit" value={wholesale} min={1} max={500} onChange={setWholesale} />
          <Slider label="Order quantity" value={qty} min={1} max={2000} unit="%" onChange={setQty} />
          <Slider label="Total order shipping" value={orderShipping} min={0} max={2000} onChange={setOrderShipping} />
          <Slider label="Retailer markup" value={retailerMarkup} min={0} max={300} unit="%" onChange={setRetailerMarkup} />
        </div>

        <div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <MetricCard label="Order revenue" value={`€${orderRevenue.toFixed(0)}`} />
            <MetricCard label="Order profit" value={`€${orderProfit.toFixed(0)}`} warn={orderProfit < 0} />
            <MetricCard label="Your margin" value={`${yourMargin.toFixed(1)}%`} warn={yourMargin < 15} />
            <MetricCard label="Suggested retail" value={`€${suggestedRetail.toFixed(2)}`} />
          </div>

          {/* Side by side panels */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="border border-light rounded-lg p-3">
              <div className="font-mono text-[0.52rem] tracking-wider uppercase text-brand-orange mb-2">Your Economics</div>
              {[
                ["Wholesale price", `€${wholesale.toFixed(2)}`],
                ["COGS", `€${cogsUnit.toFixed(2)}`],
                ["Packaging", `€${packUnit.toFixed(2)}`],
                ["Shipping/unit", `€${shippingPerUnit.toFixed(2)}`],
                ["Profit/unit", `€${profitPerUnit.toFixed(2)}`],
                ["Margin", `${yourMargin.toFixed(1)}%`],
              ].map(([l, v], i) => (
                <div key={i} className="flex justify-between text-[0.68rem] py-0.5">
                  <span className="text-muted">{l}</span>
                  <span className="text-ink font-medium">{v}</span>
                </div>
              ))}
            </div>
            <div className="border border-light rounded-lg p-3">
              <div className="font-mono text-[0.52rem] tracking-wider uppercase text-blue-600 mb-2">Retailer Economics</div>
              {[
                ["Suggested retail", `€${suggestedRetail.toFixed(2)}`],
                ["Their cost (wholesale)", `€${wholesale.toFixed(2)}`],
                ["Their profit/unit", `€${retailerProfit.toFixed(2)}`],
                ["Their margin", `${retailerMargin.toFixed(1)}%`],
              ].map(([l, v], i) => (
                <div key={i} className="flex justify-between text-[0.68rem] py-0.5">
                  <span className="text-muted">{l}</span>
                  <span className="text-ink font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Insight box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="font-mono text-[0.52rem] tracking-wider uppercase text-blue-600 mb-1">💡 Wholesale vs Direct</div>
            <p className="text-[0.72rem] text-blue-800 leading-relaxed">
              At wholesale you earn <strong>€{profitPerUnit.toFixed(2)}</strong> per unit ({yourMargin.toFixed(1)}% margin).
              Selling direct at €{suggestedRetail.toFixed(2)} you&apos;d earn <strong>€{directProfit.toFixed(2)}</strong> per unit ({directMargin.toFixed(1)}% margin)
              — that&apos;s <strong>€{(directProfit - profitPerUnit).toFixed(2)} more</strong> per unit, but you take on marketing and fulfilment.
            </p>
          </div>

          {/* Order summary */}
          <div className="border border-light rounded-lg overflow-hidden">
            <div className="font-mono text-[0.52rem] tracking-wider uppercase text-muted px-3 py-2 bg-pale">Order Summary — {qty} units</div>
            {[
              ["Order revenue", `€${orderRevenue.toFixed(2)}`],
              ["Total COGS", `−€${(cogsUnit * qty).toFixed(2)}`],
              ["Total packaging", `−€${(packUnit * qty).toFixed(2)}`],
              ["Shipping", `−€${orderShipping.toFixed(2)}`],
              ["Order profit", `€${orderProfit.toFixed(2)}`],
            ].map(([l, v], i) => (
              <div key={i} className={`flex justify-between px-3 py-1.5 text-[0.72rem] border-b border-light last:border-0 ${i === 4 ? "font-medium bg-pale" : ""}`}>
                <span className="text-muted">{l}</span>
                <span className="text-ink">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

export default function UnitEconomicsPage() {
  const [tab, setTab] = useState<"product" | "wholesale">("product");

  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="px-8 pt-7 pb-4 border-b border-light shrink-0">
        <Link href="/dashboard/tools" className="text-muted hover:text-ink text-[0.75rem]">← Business Tools</Link>
        <h1 className="font-semibold text-[1.5rem] text-ink tracking-tight mt-1 mb-1">Unit Economics</h1>
        <p className="text-[0.78rem] text-muted">Model your product margins and wholesale pricing in real time.</p>

        <div className="flex gap-0 mt-4">
          <button onClick={() => setTab("product")} className={`px-5 py-2 font-mono text-[0.62rem] tracking-wide uppercase border-b-2 transition-all ${tab === "product" ? "text-brand-orange border-brand-orange" : "text-muted border-transparent hover:text-ink"}`}>
            Product Margin
          </button>
          <button onClick={() => setTab("wholesale")} className={`px-5 py-2 font-mono text-[0.62rem] tracking-wide uppercase border-b-2 transition-all ${tab === "wholesale" ? "text-brand-orange border-brand-orange" : "text-muted border-transparent hover:text-ink"}`}>
            Wholesale & Retail
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {tab === "product" ? <ProductMarginCalc /> : <WholesaleCalc />}
      </div>
    </div>
  );
}
