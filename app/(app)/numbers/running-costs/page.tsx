"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useBrand } from "@/lib/useBrand";
import Icon from "@/components/icon";
import { formatMoney, fromRow, margin, type Product, DEFAULT_CURRENCY } from "@/lib/products";
import {
  breakEvenUnits, contribution, DEFAULT_PROFILE, floorPrice,
  floorPriceBasis, operatingProfit, RUNNING_COST_LINES, runningCostsUnset,
  totalRunningCosts, unitsPerMonth, type BusinessProfile, type RunningCosts,
} from "@/lib/numbers";
import { authedFetch } from "@/lib/authed-fetch";
import { useT } from "@/lib/i18n/use-t.tsx";

const toNum = (s: string): number | null => {
  const t = s.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isNaN(n) ? null : n;
};
const str = (n: number | null | undefined) => (n == null ? "" : String(n));

export default function RunningCostsPage() {
  const t = useT();
  const { brandId } = useBrand();
  const [costs, setCosts] = useState<Record<keyof RunningCosts, string>>({
    rent: "", salaries: "", software: "", marketing: "", other: "",
  });
  const [volume, setVolume] = useState("");
  const [profile, setProfile] = useState<BusinessProfile>(DEFAULT_PROFILE);
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!brandId) return;
    let cancelled = false;
    Promise.all([
      authedFetch(`/api/numbers?brand_id=${encodeURIComponent(brandId)}`).then((r) => r.json()),
      authedFetch(`/api/catalog?brand_id=${encodeURIComponent(brandId)}`).then((r) => r.json()),
    ]).then(([n, c]) => {
      if (cancelled) return;
      const r = n.rules;
      if (r) {
        setCosts({
          rent: str(r.opex_rent), salaries: str(r.opex_salaries), software: str(r.opex_software),
          marketing: str(r.opex_marketing), other: str(r.opex_other),
        });
        setVolume(str(r.expected_volume));
        setProfile({
          sells: r.sells ?? DEFAULT_PROFILE.sells,
          charges: r.charges ?? DEFAULT_PROFILE.charges,
          channels: r.channels?.length ? r.channels : DEFAULT_PROFILE.channels,
        });
      }
      const list: Product[] = (c.products ?? []).map(fromRow);
      setProducts(list);
      // Prefill from the product with the best contribution — the one whose
      // numbers are most likely already complete.
      const costed = list.filter((p) => margin(p) !== null);
      if (costed.length) setProductId(costed[0].id);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [brandId]);

  const parsed: RunningCosts = useMemo(() => ({
    rent: toNum(costs.rent), salaries: toNum(costs.salaries), software: toNum(costs.software),
    marketing: toNum(costs.marketing), other: toNum(costs.other),
  }), [costs]);

  const opEx = totalRunningCosts(parsed);
  const noCosts = runningCostsUnset(parsed);
  const vol = toNum(volume);
  const selected = products.find((p) => p.id === productId) ?? null;
  const currency = selected?.currency ?? products[0]?.currency ?? DEFAULT_CURRENCY;

  const variableCost = selected?.landedCost ?? selected?.factoryCost ?? null;
  const contrib =
    selected && selected.retailPrice != null && variableCost != null
      ? contribution(selected.retailPrice, selected.taxRatePct ?? 0, variableCost)
      : null;
  const be = contrib != null && !noCosts ? breakEvenUnits(opEx, contrib) : null;

  const floor =
    selected && variableCost != null && selected.minMarginPct != null
      ? floorPrice({
          variableCost, taxRatePct: selected.taxRatePct ?? 0,
          minMarginPct: selected.minMarginPct, monthlyOpEx: opEx,
          expectedVolume: vol ?? 0,
        })
      : null;
  const basis =
    selected && variableCost != null && selected.minMarginPct != null
      ? floorPriceBasis({
          variableCost, minMarginPct: selected.minMarginPct,
          monthlyOpEx: opEx, expectedVolume: vol ?? 0,
        })
      : null;

  async function save() {
    setSaving(true); setError(null); setSaved(false);
    try {
      const res = await authedFetch("/api/numbers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: brandId, runningCosts: parsed, expectedVolume: vol }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || t("num.run.couldNotSave"));
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("num.run.couldNotSave"));
    } finally {
      setSaving(false);
    }
  }

  const field = "w-full rounded-lg border border-rule-2 bg-white px-2.5 py-2 text-sm font-semibold tabular-nums text-ink-2 focus:border-accent-line focus:outline-none focus:ring-2 focus:ring-tint-1";

  return (
    <div className="mx-auto flex max-w-shell flex-col gap-[18px] px-4 pb-12 pt-[22px]">
      <header className="flex items-start gap-4">
        <div>
          <Link href="/numbers" className="mb-1 inline-flex items-center gap-1 text-2xs font-semibold text-accent">
            <Icon name="chevronLeft" size={11} /> {t("numbers.title")}
          </Link>
          <h1 className="text-display font-bold leading-[1.15]">{t("numbers.runningCostsAndBreakEven")}</h1>
          <p className="mt-[3px] text-base font-normal text-muted-2">
            {t("num.run.monthlyTotals")}
          </p>
        </div>
        <span className="ml-auto shrink-0 rounded-pill bg-green-wash px-2.5 py-1 text-micro font-bold uppercase tracking-[0.7px] text-green-ink">
          {t("common.perMonth")}
        </span>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3 stack:grid-cols-1">
        <section className="rounded-panel border border-rule bg-card p-[18px] drop-shadow-panel">
          <h2 className="text-h3 font-bold">{t("numbers.yourMonthlyCosts")}</h2>
          <p className="mt-1 text-xs font-medium text-muted">
            {t("num.run.onePerLine")}
          </p>
          <div className="mt-3.5 flex flex-col gap-2.5">
            {RUNNING_COST_LINES.map((l) => (
              <label key={l.key} className="grid grid-cols-[minmax(0,1fr)_120px] items-center gap-3">
                <span className="text-sm font-medium text-ink-2">{t(l.labelKey)}</span>
                <input
                  inputMode="decimal"
                  value={costs[l.key]}
                  onChange={(e) => {
                    setCosts({ ...costs, [l.key]: e.target.value.replace(/[^0-9.,-]/g, "") });
                    setSaved(false);
                  }}
                  placeholder="—"
                  className={field}
                />
              </label>
            ))}
            <div className="mt-1 flex items-center gap-2 border-t border-rule pt-3 text-sm font-bold">
              {t("numbers.total")}
              <b className="ml-auto tabular-nums">
                {noCosts ? "—" : t("num.perMonthValue", { value: formatMoney(opEx, currency) })}
              </b>
            </div>
          </div>

          <h2 className="mt-6 text-h3 font-bold">{t("numbers.expectedVolume")}</h2>
          <p className="mt-1 text-xs font-medium text-muted">
            {t(profile.sells === "digital" ? "num.run.volumeHelpCustomers" : "num.run.volumeHelpUnits")}
          </p>
          <label className="mt-2.5 grid grid-cols-[minmax(0,1fr)_120px] items-center gap-3">
            <span className="text-sm font-medium text-ink-2">
              {t(profile.sells === "digital" ? "num.run.customersPerMonth" : "num.run.unitsPerMonth")}
            </span>
            <input
              inputMode="decimal"
              value={volume}
              onChange={(e) => { setVolume(e.target.value.replace(/[^0-9.,-]/g, "")); setSaved(false); }}
              placeholder="—"
              className={field}
            />
          </label>

          {error && (
            <p role="alert" className="mt-3 rounded-lg bg-tint-2 px-3 py-2 text-2xs font-semibold text-accent-dark">
              {error}
            </p>
          )}

          <button type="button" onClick={save} disabled={saving}
            className="mt-4 w-full rounded-tile bg-grad-mark px-4 py-2.5 text-sm font-bold text-white drop-shadow-[0_4px_8px_rgba(232,73,32,.28)] disabled:opacity-60">
            {saving ? t("settings.saving") : saved ? t("common.saved") : t("num.run.save")}
          </button>
          <p className="mt-2 text-2xs font-medium leading-[1.5] text-muted">
            {t("num.run.onBusiness")}
          </p>
        </section>

        <section className="rounded-panel border border-rule bg-card p-[18px] drop-shadow-panel">
          <h2 className="text-h3 font-bold">{t("numbers.whatThatMeans")}</h2>

          {products.length === 0 ? (
            <p className="mt-2 text-xs font-medium leading-[1.6] text-muted">
              {t("num.run.noProductsYet")}
            </p>
          ) : (
            <>
              <label className="mt-3 block">
                <span className="text-2xs font-bold uppercase tracking-[0.7px] text-muted">{t("numbers.againstWhichProduct")}</span>
                <select value={productId} onChange={(e) => setProductId(e.target.value)} className={`${field} mt-1.5`}>
                  <option value="">{t("numbers.selectProduct")}</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>

              {selected && contrib == null && (
                <p className="mt-3 rounded-tile bg-amber-wash px-3 py-2.5 text-2xs font-medium leading-[1.5] text-amber">
                  {t("num.run.noPriceOrCost", { name: selected.name })}
                </p>
              )}

              {contrib != null && (
                <div className="mt-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-ink-2">
                    {t("numbers.contributionPerSale")}
                    <b className="ml-auto tabular-nums">{formatMoney(contrib, currency)}</b>
                  </div>

                  <div className="rounded-tile bg-tile px-3 py-2.5">
                    <div className="text-micro font-bold uppercase tracking-[0.7px] text-muted">{t("numbers.breakEven")}</div>
                    {noCosts ? (
                      <>
                        <div className="text-[22px] font-bold tracking-[-0.5px] text-faint">—</div>
                        <p className="mt-1 text-2xs font-medium leading-[1.5] text-muted">
                          {t("numbers.enterCosts")}
                        </p>
                      </>
                    ) : be === Infinity ? (
                      <>
                        <div className="text-[22px] font-bold tracking-[-0.5px] text-accent">
                          {t("numbers.neverAtThisPrice")}
                        </div>
                        <p className="mt-1 text-2xs font-medium leading-[1.5] text-muted">
                          {t("num.run.eachSaleLoses")}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-[22px] font-bold tracking-[-0.5px] tabular-nums">
                          {unitsPerMonth(profile, be ?? "", t)}
                        </div>
                        <p className="mt-1 text-2xs font-medium leading-[1.5] text-muted">
                          {t("num.belowThisLose")}
                          {vol != null && (() => {
                            const [pre, post = ""] = t("num.atVolumeProfit", { volume: vol }).split("{profit}");
                            return (
                              <>
                                {" "}{pre}
                                <b className={operatingProfit(vol, contrib, opEx) < 0 ? "text-accent" : "text-green-ink"}>
                                  {formatMoney(operatingProfit(vol, contrib, opEx), currency)}
                                </b>
                                {post}
                              </>
                            );
                          })()}
                        </p>
                      </>
                    )}
                  </div>

                  {floor != null && basis != null && (
                    <div className="rounded-tile border border-accent-line bg-tint-1 px-3 py-2.5">
                      <div className="text-micro font-bold uppercase tracking-[0.7px] text-accent">
                        {t("num.run.floorPriceFor", { name: selected!.name })}
                      </div>
                      <div className="text-[22px] font-bold tracking-[-0.5px] tabular-nums text-accent-dark">
                        {formatMoney(floor, currency)}
                      </div>
                      <p className="mt-1 text-2xs font-medium leading-[1.5] text-accent-dark">
                        {basis === "margin"
                          ? t("num.run.setByMinMargin", { minMarginPct: String(selected!.minMarginPct) })
                          : t("num.run.setByOverhead")}
                      </p>
                      <Link href={`/knowledge/products?product=${selected!.id}`}
                        className="mt-2.5 block rounded-lg bg-grad-mark px-3 py-2 text-center text-2xs font-bold text-white">
                        {t("num.run.applyTo", { name: selected!.name })}
                      </Link>
                      <p className="mt-1.5 text-micro font-medium leading-[1.5] text-accent-dark/80">
                        {t("numbers.opensProductCard")}
                      </p>
                    </div>
                  )}

                  {selected && selected.minMarginPct == null && (
                    <p className="rounded-tile bg-tile px-3 py-2.5 text-2xs font-medium leading-[1.5] text-muted">
                      {t("num.run.noMinMargin", { name: selected.name })}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          <p className="mt-4 border-t border-rule pt-3 text-2xs font-medium leading-[1.6] text-muted">
            {(() => {
              // One sentence; the bold word sits wherever the language puts it.
              const [pre, post = ""] = t("num.run.overheadNotDivided").split("{not}");
              return <>{pre}<b className="text-ink-2">{t("num.run.not")}</b>{post}</>;
            })()}
          </p>
        </section>
      </div>
    </div>
  );
}
