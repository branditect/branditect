"use client";

import { useEffect, useMemo, useState } from "react";
import { useBrand } from "@/lib/useBrand";
import { formatMoney, fromRow, type Product, DEFAULT_CURRENCY } from "@/lib/products";
import { costCalculatorTitle, costLines, DEFAULT_PROFILE, type BusinessProfile } from "@/lib/numbers";
import {
  ApplyPanel, CalcShell, Field, Panel, ProductPicker, Readout, clean, numStr, toNum,
} from "@/components/numbers/calc-shell";
import { authedFetch } from "@/lib/authed-fetch";
import { useT } from "@/lib/i18n/use-t.tsx";

export default function CostCalculator() {
  const t = useT();
  const { brandId } = useBrand();
  const [profile, setProfile] = useState<BusinessProfile>(DEFAULT_PROFILE);
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [units, setUnits] = useState("1");

  useEffect(() => {
    if (!brandId) return;
    let cancelled = false;
    Promise.all([
      authedFetch(`/api/numbers?brand_id=${encodeURIComponent(brandId)}`).then((r) => r.json()),
      authedFetch(`/api/catalog?brand_id=${encodeURIComponent(brandId)}`).then((r) => r.json()),
    ]).then(([n, c]) => {
      if (cancelled) return;
      const r = n.rules;
      if (r) setProfile({
        sells: r.sells ?? DEFAULT_PROFILE.sells,
        charges: r.charges ?? DEFAULT_PROFILE.charges,
        channels: r.channels?.length ? r.channels : DEFAULT_PROFILE.channels,
      });
      setProducts((c.products ?? []).map(fromRow));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [brandId]);

  const selected = products.find((p) => p.id === productId) ?? null;
  const currency = selected?.currency ?? products[0]?.currency ?? DEFAULT_CURRENCY;

  // Prefilling reads from the product; it is not a write. The product's
  // existing landed cost seeds the first line so the total starts somewhere
  // honest rather than at zero.
  useEffect(() => {
    if (!selected) return;
    setValues((v) => ({
      ...v,
      "Production cost": numStr(selected.factoryCost ?? null),
    }));
  }, [selected]);

  // The lines themselves come from the business profile — physical costs land
  // per unit made, digital per customer served, and channels add their own.
  const lines = useMemo(() => costLines(profile), [profile]);

  // Non-cost lines are rates, not money, and must not be summed into a total.
  const RATE_LINES = new Set(["Returns rate", "Refund rate", "Churn rate", "Payment terms", "Billing period", "Store commission %", "Reseller commission"]);

  const total = lines
    .filter((l) => !RATE_LINES.has(l.label))
    .reduce((sum, l) => sum + (toNum(values[l.label] ?? "") ?? 0), 0);

  const perUnit = (() => {
    const n = toNum(units) ?? 1;
    return n > 0 ? total / n : total;
  })();

  const filled = lines.filter((l) => !RATE_LINES.has(l.label) && toNum(values[l.label] ?? "") != null).length;
  const costable = lines.filter((l) => !RATE_LINES.has(l.label)).length;

  return (
    <CalcShell n={1} tone="green" title={costCalculatorTitle(profile, t)}
      promise={t("num.costLede")}>
      <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] items-start gap-3 stack:grid-cols-1">
        <Panel title={t("numbers.yourCostLines")}>
          <p className="mt-1 text-xs font-medium leading-[1.55] text-muted">
            {t("num.cost.fromChannels")} <b className="text-ink-2">{t("numbers.howYouSell")}</b> {t("num.cost.onNumbers")}
          </p>

          <div className="mt-3.5">
            <ProductPicker products={products} value={productId} onChange={setProductId} />
          </div>

          <div className="mt-4 flex flex-col gap-2.5">
            {lines.map((l) => (
              <div key={l.label} className={l.from === "base" ? "" : "rounded-lg bg-tint-1/60 px-2 py-1.5"}>
                <Field
                  label={l.labelKey ? t(l.labelKey) : l.label}
                  hint={l.from === "base" ? undefined : t("num.cost.addedBy", { from: l.from === "direct" ? t("num.cost.sellingDirect") : l.from })}
                  value={values[l.label] ?? ""}
                  onChange={(v) => setValues({ ...values, [l.label]: v })}
                  suffix={RATE_LINES.has(l.label) ? "%" : currency}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-rule pt-3.5">
            <Field label={t("num.cost.spreadAcross")} hint={t("num.cost.unitsInBatch")}
              value={units} onChange={(v) => setUnits(clean(v))} suffix="×" />
          </div>
        </Panel>

        <div className="flex flex-col gap-3">
          <Readout tone="green" label={profile.sells === "physical" ? t("num.costPerUnit") : t("num.cost.costToServeOne")}
            value={filled === 0 ? "—" : formatMoney(perUnit, currency)}
            sub={filled === 0
              ? t("num.cost.fillLeft")
              : t("num.cost.entered", { filled, costable })}
          />

          <ApplyPanel tone="green" productId={productId || null}
            productName={selected?.name ?? null}
            fields={{ landed_cost: perUnit.toFixed(2) }}>
            <div className="text-micro font-extrabold uppercase tracking-[0.8px] text-green-ink opacity-75">
              {t("numbers.landedCost")}
            </div>
            <div className="text-[20px] font-bold tracking-[-0.5px] tabular-nums text-green-ink">
              {selected?.landedCost != null && filled > 0 ? (
                <>
                  <span className="text-green-ink/50 line-through">
                    {formatMoney(selected.landedCost, currency)}
                  </span>{" "}
                  → {formatMoney(perUnit, currency)}
                </>
              ) : filled > 0 ? (
                formatMoney(perUnit, currency)
              ) : (
                "—"
              )}
            </div>
          </ApplyPanel>

          <p className="rounded-card border border-rule bg-tile px-3.5 py-3 text-2xs font-medium leading-[1.6] text-muted">
            {t("num.cost.landedNotFactory")}
          </p>
        </div>
      </div>
    </CalcShell>
  );
}
