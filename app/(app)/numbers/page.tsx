"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useBrand } from "@/lib/useBrand";
import Icon, { type IconName } from "@/components/icon";
import { formatMoney, fromRow, margin, type Product, DEFAULT_CURRENCY } from "@/lib/products";
import {
  breakEvenUnits, contribution, costCalculatorTitle, costLines, DEFAULT_PROFILE,
  EMPTY_RUNNING_COSTS, operatingProfit, profileSentence, RUNNING_COST_LINES,
  runningCostsUnset, totalRunningCosts, unitNoun,
  type BusinessProfile, type Channel, type RunningCosts,
} from "@/lib/numbers";
import { authedFetch } from "@/lib/authed-fetch";
import { useT } from "@/lib/i18n/use-t.tsx";
import type { StringKey, Vars } from "@/lib/i18n/index.ts";

/**
 * Copy is a dictionary key, or English that has no key yet. `{ en }` renders
 * as written in every language and the gap scan lists it.
 */
type Copy = StringKey | { en: string };
type T = (key: StringKey, vars?: Vars) => string;
const tx = (t: T, c: Copy) => (typeof c === "string" ? t(c) : c.en);

/**
 * Each calculator owns a colour. It is not decoration: it is what lets someone
 * glance at the running-costs panel and know it is a different altitude from
 * the three per-sale cards above it.
 */
const TONES = {
  green: {
    tile: "bg-green-wash text-green-ink", num: "bg-good",
    promise: "text-green-ink",
    go: "bg-green-wash text-green-ink border border-green-line hover:bg-[#ddf0e5]",
  },
  lavender: {
    tile: "bg-lavender text-lav-ink", num: "bg-[#7b5ea7]",
    promise: "text-lav-ink",
    go: "bg-grad-mark text-white drop-shadow-[0_5px_10px_rgba(232,73,32,.3)] hover:brightness-[1.03]",
  },
  orange: {
    tile: "bg-tint-2 text-accent-dark", num: "bg-accent",
    promise: "text-accent-dark",
    go: "bg-tint-1 text-accent-dark border border-accent-line hover:bg-tint-2",
  },
  blue: {
    tile: "bg-blue-wash text-blue-ink", num: "bg-[#4a72b8]",
    promise: "text-blue-ink",
    go: "bg-blue-wash text-blue-ink border border-blue-line hover:bg-[#dde8fb]",
  },
} as const;

const CALCULATORS: {
  n: number; key: string; icon: IconName; href: string; tone: keyof typeof TONES;
  title?: StringKey; promise: StringKey; desc: Copy;
  /** Always needed, whatever the profile. */
  needs: StringKey[];
  /** Needed only because of a channel — highlighted so the profile visibly
   *  builds the cost model rather than silently changing it. */
  addedBy?: Partial<Record<Channel | "recurring", StringKey[]>>;
  recurringOnly?: boolean;
}[] = [
  {
    n: 1, key: "cost", icon: "bag", href: "/numbers/cost", tone: "green",
    promise: "num.costLede",
    desc: "num.costSub",
    needs: ["num.productionCost", "num.freightDuty", "num.packaging"],
    addedBy: {
      direct: ["num.shipping", "num.returnsRate", "num.paymentFees", "num.adCostPerSale"],
      trade: ["num.cartonPallet", "num.paymentTerms"],
      store: ["num.storeCommission"],
    },
  },
  {
    n: 2, key: "pricing", icon: "target", href: "/numbers/pricing", tone: "lavender",
    title: "numbers.pricingAndMargin", promise: "num.priceLede",
    desc: "num.priceSub",
    needs: ["num.targetMargin", "num.taxRate", "num.costPerUnit"],
  },
  {
    n: 3, key: "offers", icon: "numbers", href: "/numbers/offers", tone: "orange",
    title: "numbers.offers", promise: "num.offersLede",
    desc: "num.offersSub",
    needs: ["num.discountCeiling", "numbers.expectedVolume"],
    addedBy: { direct: ["num.freeShipThreshold", "num.averageBasket"] },
  },
  {
    n: 4, key: "recurring", icon: "numbers", href: "/numbers/recurring", tone: "blue",
    title: "numbers.recurring", promise: "num.recurringLede",
    desc: "num.recurringSub",
    needs: ["num.monthlyPrice", "num.churnRate", "num.costToAcquire"],
    recurringOnly: true,
  },
];

type Portfolio = {
  priced: number; total: number;
  lowest: { p: Product; m: NonNullable<ReturnType<typeof margin>> } | null;
  best: { p: Product; m: NonNullable<ReturnType<typeof margin>> } | null;
};

/**
 * The line above each calculator's button. Reports what the product cards
 * already hold, so the card says whether there is anything to work from.
 */
const CARD_STATE: Record<
  string,
  (p: Portfolio, currency: string) => { label: Copy; done: boolean }
> = {
  cost: (p, currency) =>
    p.best?.p.landedCost != null
      ? { label: { en: `${p.best.p.name} currently ${formatMoney(p.best.p.landedCost, currency)}` }, done: true }
      : { label: "num.noLandedCost", done: false },
  pricing: (p, currency) =>
    p.best?.p.retailPrice != null
      ? { label: { en: `${p.best.p.name} currently ${formatMoney(p.best.p.retailPrice, currency)}` }, done: true }
      : { label: "num.noPrice", done: false },
  offers: () => ({ label: "num.usesPriceHere", done: false }),
  recurring: () => ({ label: "num.shownBecauseSubscription", done: false }),
};

function Badge({ tone, children }: { tone: "sale" | "month" | "sandbox"; children: React.ReactNode }) {
  const styles = {
    sale: "bg-tint-1 text-accent",
    month: "bg-blue-wash text-blue-ink",
    sandbox: "bg-lavender text-lav-ink",
  } as const;
  return (
    <span className={`rounded-pill px-2.5 py-[3px] text-micro font-extrabold uppercase tracking-[0.9px] ${styles[tone]}`}>
      {children}
    </span>
  );
}

export default function NumbersPage() {
  const t = useT();
  const { brandId } = useBrand();
  const [profile, setProfile] = useState<BusinessProfile>(DEFAULT_PROFILE);
  const [costs, setCosts] = useState<RunningCosts>(EMPTY_RUNNING_COSTS);
  const [volume, setVolume] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!brandId) return;
    let cancelled = false;
    Promise.all([
      authedFetch(`/api/numbers?brand_id=${encodeURIComponent(brandId)}`).then((r) => r.json()),
      authedFetch(`/api/catalog?brand_id=${encodeURIComponent(brandId)}`).then((r) => r.json()),
    ])
      .then(([n, c]) => {
        if (cancelled) return;
        const r = n.rules;
        if (r) {
          setProfile({
            sells: r.sells ?? DEFAULT_PROFILE.sells,
            charges: r.charges ?? DEFAULT_PROFILE.charges,
            channels: (r.channels?.length ? r.channels : DEFAULT_PROFILE.channels) as Channel[],
          });
          setCosts({
            rent: r.opex_rent, salaries: r.opex_salaries, software: r.opex_software,
            marketing: r.opex_marketing, other: r.opex_other,
          });
          setVolume(r.expected_volume ?? null);
        }
        setProducts((c.products ?? []).map(fromRow));
        setLoaded(true);
      })
      .catch(() => !cancelled && setLoaded(true));
    return () => { cancelled = true; };
  }, [brandId]);

  const save = useCallback(
    (patch: Record<string, unknown>) => {
      if (!brandId) return;
      authedFetch("/api/numbers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: brandId, ...patch }),
      }).catch(() => {});
    },
    [brandId],
  );

  function setSells(sells: BusinessProfile["sells"]) {
    const next = { ...profile, sells };
    setProfile(next); save({ profile: next });
  }
  function setCharges(charges: BusinessProfile["charges"]) {
    const next = { ...profile, charges };
    setProfile(next); save({ profile: next });
  }
  function toggleChannel(ch: Channel) {
    const channels = profile.channels.includes(ch)
      ? profile.channels.filter((c) => c !== ch)
      : [...profile.channels, ch];
    const next = { ...profile, channels };
    setProfile(next); save({ profile: next });
  }

  // Portfolio state, not one number. With 18 products the useful question is
  // which one is dragging, not what the average is.
  const portfolio = useMemo(() => {
    const withMargin = products
      .map((p) => ({ p, m: margin(p) }))
      .filter((x): x is { p: Product; m: NonNullable<ReturnType<typeof margin>> } => x.m !== null);
    const priced = withMargin.length;
    const lowest = withMargin.slice().sort((a, b) => a.m.pct - b.m.pct)[0] ?? null;
    const best = withMargin.slice().sort((a, b) => b.m.pct - a.m.pct)[0] ?? null;
    return { priced, total: products.length, lowest, best };
  }, [products]);

  const opEx = totalRunningCosts(costs);
  const noCosts = runningCostsUnset(costs);
  const currency = products[0]?.currency ?? DEFAULT_CURRENCY;

  // Break-even uses the strongest product's contribution — the optimistic
  // case. Stated as such rather than presented as the whole truth.
  const bestContribution =
    portfolio.best && portfolio.best.p.retailPrice != null
      ? contribution(
          portfolio.best.p.retailPrice,
          portfolio.best.p.taxRatePct ?? 0,
          portfolio.best.p.landedCost ?? portfolio.best.p.factoryCost ?? 0,
        )
      : null;
  const be = bestContribution != null && !noCosts ? breakEvenUnits(opEx, bestContribution) : null;
  const cards = CALCULATORS.filter((c) => !c.recurringOnly || profile.charges === "recurring");
  const missing = portfolio.total - portfolio.priced;

  return (
    <div className="mx-auto flex max-w-shell flex-col gap-[18px] px-4 pb-12 pt-[22px]">
      <header>
        <h1 className="text-display font-bold leading-[1.15]">{t("numbers.title")}</h1>
        <p className="mt-[3px] text-base font-normal text-muted-2">
          Your product cards hold the real figures.{" "}
          {loaded && portfolio.total > 0 && missing > 0 && (
            <b className="font-semibold text-ink-2">
              {missing} of {portfolio.total} still need costs.
            </b>
          )}
          {loaded && portfolio.total === 0 && (
            <b className="font-semibold text-ink-2">
              {t("numbers.noProducts")}
            </b>
          )}
        </p>
      </header>

      <div className="grid grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] items-stretch gap-3 stack:grid-cols-1">
        <section
          aria-label={t("numbers.whatItDoes")}
          className="relative flex flex-col overflow-hidden rounded-panel bg-grad-hero px-[22px] pb-5 pt-[22px] text-white drop-shadow-hero"
        >
          <span aria-hidden="true" className="pointer-events-none absolute -right-6 -top-8 h-[100px] w-[150px] rounded-full border-[1.2px] border-white/25" />
          <div className="relative z-10 flex flex-1 flex-col">
            <div className="text-sm font-bold tracking-[-0.1px]">{t("numbers.whatItDoes")}</div>
            <p className="mt-2.5 max-w-[40ch] text-base font-semibold leading-[1.5] text-white/[.94]">
              {t("num.indexLede")}{" "}
              <b>{t("numbers.studioObeys")}</b>
            </p>

            <div className="mt-auto grid grid-cols-3 gap-2 pt-[18px] stack:grid-cols-1">
              <div className="rounded-tile border-[1.2px] border-white/40 px-[11px] pb-[11px] pt-2.5">
                <div className="text-micro font-medium text-white/[.82]">{t("numbers.productsPriced")}</div>
                <div className="text-[18px] font-bold tabular-nums">
                  {portfolio.priced} / {portfolio.total}
                </div>
                <div className="text-micro font-medium text-white/70">
                  {missing > 0 ? t("num.missingCosts", { missing }) : t("num.allCosted")}
                </div>
              </div>
              <div className="rounded-tile border-[1.2px] border-white/40 px-[11px] pb-[11px] pt-2.5">
                <div className="text-micro font-medium text-white/[.82]">{t("numbers.lowestMargin")}</div>
                <div className="text-[18px] font-bold tabular-nums">
                  {portfolio.lowest ? `${portfolio.lowest.m.pct.toFixed(0)}%` : "—"}
                </div>
                <div className="truncate text-micro font-medium text-white/70">
                  {portfolio.lowest?.p.name ?? t("num.noCostedProducts")}
                </div>
              </div>
              <div className="rounded-tile border-[1.2px] border-white/40 px-[11px] pb-[11px] pt-2.5">
                <div className="text-micro font-medium text-white/[.82]">{t("numbers.breakEven")}</div>
                <div className="text-[18px] font-bold tabular-nums">
                  {be === null ? "—" : be === Infinity ? "never" : `${be} / mo`}
                </div>
                <div className="text-micro font-medium text-white/70">
                  {noCosts ? t("num.addRunningCostsInline") : t("num.atYourBestMargin")}
                </div>
              </div>
            </div>

            <Link href="/knowledge/products" className="mt-3 inline-block text-micro font-bold tracking-[0.4px] text-white underline underline-offset-[3px]">
              {t("numbers.seeAll")}
            </Link>
          </div>
        </section>

        <section aria-label={t("numbers.howYouSell")} className="flex flex-col rounded-panel border border-lav-line bg-grad-setup drop-shadow-panel">
          <div className="flex items-baseline justify-between gap-2.5 px-[15px] pt-4">
            <h3 className="text-h3 font-bold text-[#2f2545]">{t("numbers.howYouSell")}</h3>
            <span className="text-2xs font-semibold text-[#8b7bab]">{t("numbers.setOnce")}</span>
          </div>
          <div className="flex flex-col gap-3.5 px-[15px] pb-4 pt-3">
            <div>
              <div className="mb-1.5 text-micro font-bold uppercase tracking-[0.7px] text-[#6b5b91]">{t("numbers.whatYouSell")}</div>
              <div role="radiogroup" aria-label={t("numbers.whatYouSell")} className="flex flex-wrap gap-1.5">
                {([["physical", "num.physicalGoods", "box"], ["digital", "num.digitalAccess", "cloud"]] as const).map(([v, label, icon]) => (
                  <button key={v} type="button" role="radio" aria-checked={profile.sells === v}
                    onClick={() => setSells(v)}
                    className={`inline-flex items-center gap-[7px] rounded-pill border px-3 py-1.5 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      profile.sells === v ? "border-accent bg-tint-1 text-accent" : "border-[#ded0f4] bg-white/[.92] text-[#3f3560] hover:border-accent-line hover:bg-white hover:text-accent"
                    }`}>
                    <Icon name={icon} size={13} />
                    {tx(t, label)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1.5 text-micro font-bold uppercase tracking-[0.7px] text-[#6b5b91]">{t("numbers.howYouCharge")}</div>
              <div role="radiogroup" aria-label={t("numbers.howYouCharge")} className="flex flex-wrap gap-1.5">
                {([["oneoff", { en: "One-off" }, "once"], ["recurring", "num.subscription", "repeat"]] as const).map(([v, label, icon]) => (
                  <button key={v} type="button" role="radio" aria-checked={profile.charges === v}
                    onClick={() => setCharges(v)}
                    className={`inline-flex items-center gap-[7px] rounded-pill border px-3 py-1.5 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      profile.charges === v ? "border-accent bg-tint-1 text-accent" : "border-[#ded0f4] bg-white/[.92] text-[#3f3560] hover:border-accent-line hover:bg-white hover:text-accent"
                    }`}>
                    <Icon name={icon} size={13} />
                    {tx(t, label)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1.5 text-micro font-bold uppercase tracking-[0.7px] text-[#6b5b91]">
                {t("numbers.whereYouSell")} <span className="font-medium normal-case tracking-normal">— {t("num.allThatApply")}</span>
              </div>
              <div role="group" aria-label={t("numbers.whereYouSell")} className="flex flex-wrap gap-1.5">
                {([["direct", "num.ownSite"], ["trade", "num.wholesale"], ["store", "num.appStore"]] as const).map(([v, label]) => {
                  const on = profile.channels.includes(v);
                  return (
                    <button key={v} type="button" aria-pressed={on}
                      onClick={() => toggleChannel(v)}
                      className={`inline-flex items-center gap-[7px] rounded-pill border px-3 py-1.5 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                        on ? "border-accent bg-tint-1 text-accent" : "border-[#ded0f4] bg-white/[.92] text-[#3f3560] hover:border-accent-line hover:bg-white hover:text-accent"
                      }`}>
                      {/* A real tick box, so "all that apply" is legible as multi-select. */}
                      <span className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-[4px] border ${
                        on ? "border-accent bg-accent text-white" : "border-[#cfc0ea]"
                      }`}>
                        {on && <Icon name="tick" size={9} />}
                      </span>
                      {t(label)}
                    </button>
                  );
                })}
              </div>
            </div>

            <p aria-live="polite" className="mt-auto rounded-tile border border-[#ded0f4] bg-white/75 px-3 py-2.5 text-2xs font-medium leading-[1.5] text-[#5d5080]">
              {profileSentence(profile)}{" "}
              <span className="opacity-75">
                That means {costLines(profile).length} cost lines per sale.
              </span>
            </p>
          </div>
        </section>
      </div>

      <div className="flex flex-wrap items-baseline gap-2.5">
        <h2 className="text-h2 font-bold">{t("numbers.calculators")}</h2>
        <Badge tone="sale">{t("numbers.perSale")}</Badge>
        <Badge tone="sandbox">{t("numbers.sandbox")}</Badge>
        <small className="text-sm font-medium text-muted-2">{t("numbers.variableCosts")}</small>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] items-stretch gap-3">
        {cards.map((c) => {
          const tone = TONES[c.tone];
          // Chips the chosen channels added, so the profile visibly builds the
          // cost model instead of silently changing it.
          const added = Object.entries(c.addedBy ?? {})
            .filter(([k]) => k === "recurring"
              ? profile.charges === "recurring"
              : profile.channels.includes(k as Channel))
            .flatMap(([, v]) => v ?? []);
          const state = CARD_STATE[c.key]?.(portfolio, currency) ?? null;

          return (
            <div key={c.key} className="flex flex-col rounded-card border border-rule-2 bg-card p-4">
              <div className="flex items-start gap-[11px]">
                <span className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-tile ${tone.tile}`}>
                  <Icon name={c.icon} size={18} />
                  <span className={`absolute -left-1.5 -top-1.5 grid h-[18px] w-[18px] place-items-center rounded-full text-micro font-bold text-white ${tone.num}`}>
                    {c.n}
                  </span>
                </span>
                <div className="min-w-0">
                  <h3 className="text-h3 font-bold">{c.title ? t(c.title) : costCalculatorTitle(profile)}</h3>
                  <div className={`mt-1 text-xs font-bold leading-[1.35] ${tone.promise}`}>{t(c.promise)}</div>
                </div>
              </div>

              <p className="mt-[11px] text-xs font-medium leading-[1.5] text-muted">{tx(t, c.desc)}</p>

              <div className="mt-[11px] border-t border-rule pt-[11px]">
                <h4 className="text-micro font-extrabold uppercase tracking-[0.8px] text-muted-2">
                  {t("numbers.whatYoullNeed")}
                </h4>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {c.needs.map((n) => (
                    <span key={n} className="rounded-pill border border-rule bg-tile px-2 py-0.5 text-micro font-semibold text-ink-2">
                      {t(n)}
                    </span>
                  ))}
                  {added.map((n) => (
                    <span key={n} className="rounded-pill border border-accent-line bg-tint-1 px-2 py-0.5 text-micro font-semibold text-accent-dark">
                      {t(n)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-3">
                <div className={`flex min-h-4 items-center gap-1.5 text-micro font-bold ${state?.done ? "text-green-ink" : "text-muted-2"}`}>
                  {state?.done && <Icon name="check" size={12} />}
                  {state ? tx(t, state.label) : ""}
                </div>
                <Link href={c.href}
                  className={`mt-[9px] flex items-center justify-center gap-[7px] rounded-tile p-2.5 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${tone.go}`}>
                  {t("numbers.openCalculator")}
                  <Icon name="arrow" size={14} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-baseline gap-2.5">
        <h2 className="text-h2 font-bold">{t("numbers.runningCosts")}</h2>
        <Badge tone="month">{t("common.perMonth")}</Badge>
        <small className="text-sm font-medium text-muted-2">
          {t("numbers.runningCostsHelp")}
        </small>
      </div>

      <section className="grid grid-cols-[minmax(0,1fr)_minmax(220px,280px)] gap-[18px] rounded-panel border border-rule bg-card px-[18px] pb-[18px] pt-4 drop-shadow-panel stack:grid-cols-1">
        <div>
          <div className="flex items-start gap-[11px]">
            <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-tile bg-blue-wash text-blue-ink">
              <Icon name="numbers" size={18} />
              <span className="absolute -left-1.5 -top-1.5 grid h-[18px] w-[18px] place-items-center rounded-full bg-[#4a72b8] text-micro font-bold text-white">5</span>
            </span>
            <div>
              <h3 className="text-h3 font-bold">{t("numbers.runningCostsAndBreakEven")}</h3>
              <div className="mt-1 text-xs font-bold leading-[1.35] text-blue-ink">
                {t("numbers.breakEvenHelp")}
              </div>
            </div>
          </div>
          <p className="mt-[11px] max-w-[54ch] text-xs font-medium leading-[1.5] text-muted">
            {t("num.overheadExplainer")}
          </p>
          <h4 className="mt-[11px] border-t border-rule pt-[11px] text-micro font-extrabold uppercase tracking-[0.8px] text-muted-2">
            {t("numbers.monthlyTotals")}
          </h4>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {RUNNING_COST_LINES.map((l) => (
              <span key={l.key} className="rounded-pill border border-rule bg-tile px-2 py-0.5 text-micro font-semibold text-ink-2">
                {l.label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 self-start rounded-tile border border-blue-line bg-blue-wash p-3.5">
          <div className="flex items-baseline gap-2.5 text-xs font-semibold text-blue-ink">
            {t("numbers.runningCosts")}
            <b className="ml-auto font-extrabold tabular-nums">
              {noCosts ? "—" : `${formatMoney(opEx, currency)} / mo`}
            </b>
          </div>
          <div className="flex items-baseline gap-2.5 text-xs font-semibold text-blue-ink">
            {t("numbers.bestContribution")}
            <b className="ml-auto font-extrabold tabular-nums">
              {bestContribution == null ? "—" : formatMoney(bestContribution, currency)}
            </b>
          </div>
          <div className="mt-0.5 border-t border-blue-line pt-2.5">
            <div className="text-micro font-extrabold uppercase tracking-[0.8px] text-blue-ink opacity-75">{t("numbers.breakEven")}</div>
            {be === null ? (
              <>
                <div className="text-[24px] font-bold tracking-[-0.7px] text-blue-ink opacity-50">—</div>
                <p className="mt-1 text-micro font-medium leading-[1.45] text-blue-ink opacity-80">
                  {noCosts
                    ? t("num.addRunningCostsNote")
                    : t("num.noPricedProduct")}
                </p>
              </>
            ) : be === Infinity ? (
              <>
                <div className="text-[24px] font-bold tracking-[-0.7px] text-accent">{t("common.never")}</div>
                <p className="mt-1 text-micro font-medium leading-[1.45] text-blue-ink opacity-80">
                  {t("num.everySaleLoses")}
                </p>
              </>
            ) : (
              <>
                <div className="text-[24px] font-bold leading-[1.15] tracking-[-0.7px] tabular-nums text-blue-ink">
                  {be} {unitNoun(profile)} / mo
                </div>
                <p className="mt-1 text-micro font-medium leading-[1.45] text-blue-ink opacity-80">
                  Below this you lose money however healthy the margin looks.
                  {volume != null && bestContribution != null && (
                    <>
                      {" "}At {volume} a month, operating profit is{" "}
                      <b className="font-extrabold">
                        {formatMoney(operatingProfit(volume, bestContribution, opEx), currency)}
                      </b>
                      .
                    </>
                  )}
                </p>
              </>
            )}
          </div>
          <Link href="/numbers/running-costs"
            className="mt-1.5 flex items-center justify-center gap-[7px] rounded-tile border border-blue-line bg-white px-4 py-2.5 text-sm font-bold text-blue-ink hover:bg-[#eef4fe] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            {noCosts ? t("num.addRunningCosts") : t("numbers.openCalculator")}
            <Icon name="arrow" size={14} />
          </Link>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-[7px] px-0.5 text-xs font-semibold text-muted">
        <em className="rounded-pill border border-rule bg-white px-[11px] py-[5px] not-italic text-ink-2">{t("numbers.revenue")}</em>
        <span className="text-faint">−</span>
        <em className="rounded-pill border border-rule bg-white px-[11px] py-[5px] not-italic text-ink-2">{t("num.costOfEachSale")}</em>
        <span className="text-faint">=</span>
        <em className="rounded-pill border border-green-line bg-green-wash px-[11px] py-[5px] not-italic text-green-ink">{t("num.grossProfit")}</em>
        <span className="px-1 text-faint">·</span>
        <em className="rounded-pill border border-green-line bg-green-wash px-[11px] py-[5px] not-italic text-green-ink">{t("num.grossProfit")}</em>
        <span className="text-faint">−</span>
        <em className="rounded-pill border border-rule bg-white px-[11px] py-[5px] not-italic text-ink-2">{t("num.runningCosts")}</em>
        <span className="text-faint">=</span>
        <em className="rounded-pill border border-blue-line bg-blue-wash px-[11px] py-[5px] not-italic text-blue-ink">{t("num.operatingProfit")}</em>
      </div>

      {/* Says plainly what these numbers are, and are not. */}
      <p className="flex items-start gap-2.5 rounded-panel border border-rule bg-card px-4 py-3.5 text-xs font-medium leading-[1.55] text-muted drop-shadow-panel">
        <span className="mt-px shrink-0 text-faint">
          <Icon name="check" size={14} />
        </span>
        {t("num.notAdvice")}
      </p>
    </div>
  );
}
