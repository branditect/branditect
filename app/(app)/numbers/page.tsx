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
  title?: string; promise: string; desc: string;
  /** Always needed, whatever the profile. */
  needs: string[];
  /** Needed only because of a channel — highlighted so the profile visibly
   *  builds the cost model rather than silently changing it. */
  addedBy?: Partial<Record<Channel | "recurring", string[]>>;
  recurringOnly?: boolean;
}[] = [
  {
    n: 1, key: "cost", icon: "bag", href: "/numbers/cost", tone: "green",
    promise: "Know what every sale really costs.",
    desc: "Everything it takes to put one unit in a customer's hands, and what happens when a cost moves.",
    needs: ["Production cost", "Freight & duty", "Packaging"],
    addedBy: {
      direct: ["Shipping", "Returns rate", "Payment fees", "Ad cost per sale"],
      trade: ["Carton / pallet", "Payment terms"],
      store: ["Store commission %"],
    },
  },
  {
    n: 2, key: "pricing", icon: "target", href: "/numbers/pricing", tone: "lavender",
    title: "Pricing & margin", promise: "Find the price that gives you the margin you want.",
    desc: "Set a target margin and get the price to hit it — or type a price and see what you'd actually keep after tax and fees.",
    needs: ["Target margin", "Tax rate", "Cost per unit"],
  },
  {
    n: 3, key: "offers", icon: "numbers", href: "/numbers/offers", tone: "orange",
    title: "Offers & discounts", promise: "Know what you can give away before it hurts.",
    desc: "Model the offers you actually run, and find where each one stops being worth it.",
    needs: ["Discount ceiling", "Expected volume"],
    addedBy: { direct: ["Free-ship threshold", "Average basket"] },
  },
  {
    n: 4, key: "recurring", icon: "numbers", href: "/numbers/recurring", tone: "blue",
    title: "Recurring revenue", promise: "See what a customer is worth over time.",
    desc: "MRR, churn and lifetime value, and how long it takes to earn back what you spent acquiring someone.",
    needs: ["Monthly price", "Churn rate", "Cost to acquire"],
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
  (p: Portfolio, currency: string) => { label: string; done: boolean }
> = {
  cost: (p, currency) =>
    p.best?.p.landedCost != null
      ? { label: `${p.best.p.name} currently ${formatMoney(p.best.p.landedCost, currency)}`, done: true }
      : { label: "No landed cost recorded yet", done: false },
  pricing: (p, currency) =>
    p.best?.p.retailPrice != null
      ? { label: `${p.best.p.name} currently ${formatMoney(p.best.p.retailPrice, currency)}`, done: true }
      : { label: "No price recorded yet", done: false },
  offers: () => ({ label: "Uses the price you set in here", done: false }),
  recurring: () => ({ label: "Shown because you charge a subscription", done: false }),
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
      fetch(`/api/numbers?brand_id=${encodeURIComponent(brandId)}`).then((r) => r.json()),
      fetch(`/api/catalog?brand_id=${encodeURIComponent(brandId)}`).then((r) => r.json()),
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
      fetch("/api/numbers", {
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
        <h1 className="text-display font-bold leading-[1.15]">Numbers</h1>
        <p className="mt-[3px] text-base font-normal text-muted-2">
          Your product cards hold the real figures.{" "}
          {loaded && portfolio.total > 0 && missing > 0 && (
            <b className="font-semibold text-ink-2">
              {missing} of {portfolio.total} still need costs.
            </b>
          )}
          {loaded && portfolio.total === 0 && (
            <b className="font-semibold text-ink-2">
              No products yet — the calculators still work.
            </b>
          )}
        </p>
      </header>

      <div className="grid grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] items-stretch gap-3 stack:grid-cols-1">
        <section
          aria-label="What Numbers does"
          className="relative flex flex-col overflow-hidden rounded-panel bg-grad-hero px-[22px] pb-5 pt-[22px] text-white drop-shadow-hero"
        >
          <span aria-hidden="true" className="pointer-events-none absolute -right-6 -top-8 h-[100px] w-[150px] rounded-full border-[1.2px] border-white/25" />
          <div className="relative z-10 flex flex-1 flex-col">
            <div className="text-sm font-bold tracking-[-0.1px]">What Numbers does</div>
            <p className="mt-2.5 max-w-[40ch] text-base font-semibold leading-[1.5] text-white/[.94]">
              Work out what you really make on every sale, set prices that hit your target margin,
              and build offers that don&apos;t quietly cost you money — then{" "}
              <b>Studio writes inside those limits.</b>
            </p>

            <div className="mt-auto grid grid-cols-3 gap-2 pt-[18px] stack:grid-cols-1">
              <div className="rounded-tile border-[1.2px] border-white/40 px-[11px] pb-[11px] pt-2.5">
                <div className="text-micro font-medium text-white/[.82]">Products priced</div>
                <div className="text-[18px] font-bold tabular-nums">
                  {portfolio.priced} / {portfolio.total}
                </div>
                <div className="text-micro font-medium text-white/70">
                  {missing > 0 ? `${missing} missing costs` : "all costed"}
                </div>
              </div>
              <div className="rounded-tile border-[1.2px] border-white/40 px-[11px] pb-[11px] pt-2.5">
                <div className="text-micro font-medium text-white/[.82]">Lowest margin</div>
                <div className="text-[18px] font-bold tabular-nums">
                  {portfolio.lowest ? `${portfolio.lowest.m.pct.toFixed(0)}%` : "—"}
                </div>
                <div className="truncate text-micro font-medium text-white/70">
                  {portfolio.lowest?.p.name ?? "no costed products"}
                </div>
              </div>
              <div className="rounded-tile border-[1.2px] border-white/40 px-[11px] pb-[11px] pt-2.5">
                <div className="text-micro font-medium text-white/[.82]">Break-even</div>
                <div className="text-[18px] font-bold tabular-nums">
                  {be === null ? "—" : be === Infinity ? "never" : `${be} / mo`}
                </div>
                <div className="text-micro font-medium text-white/70">
                  {noCosts ? "add running costs" : "at your best margin"}
                </div>
              </div>
            </div>

            <Link href="/knowledge/products" className="mt-3 inline-block text-micro font-bold tracking-[0.4px] text-white underline underline-offset-[3px]">
              See all live numbers →
            </Link>
          </div>
        </section>

        <section aria-label="How you sell" className="flex flex-col rounded-panel border border-lav-line bg-grad-setup drop-shadow-panel">
          <div className="flex items-baseline justify-between gap-2.5 px-[15px] pt-4">
            <h3 className="text-h3 font-bold text-[#2f2545]">How you sell</h3>
            <span className="text-2xs font-semibold text-[#8b7bab]">Set once</span>
          </div>
          <div className="flex flex-col gap-3.5 px-[15px] pb-4 pt-3">
            <div>
              <div className="mb-1.5 text-micro font-bold uppercase tracking-[0.7px] text-[#6b5b91]">What you sell</div>
              <div role="radiogroup" aria-label="What you sell" className="flex flex-wrap gap-1.5">
                {([["physical", "Physical goods", "box"], ["digital", "Digital & access", "cloud"]] as const).map(([v, label, icon]) => (
                  <button key={v} type="button" role="radio" aria-checked={profile.sells === v}
                    onClick={() => setSells(v)}
                    className={`inline-flex items-center gap-[7px] rounded-pill border px-3 py-1.5 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      profile.sells === v ? "border-accent bg-tint-1 text-accent" : "border-[#ded0f4] bg-white/[.92] text-[#3f3560] hover:border-accent-line hover:bg-white hover:text-accent"
                    }`}>
                    <Icon name={icon} size={13} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1.5 text-micro font-bold uppercase tracking-[0.7px] text-[#6b5b91]">How you charge</div>
              <div role="radiogroup" aria-label="How you charge" className="flex flex-wrap gap-1.5">
                {([["oneoff", "One-off", "once"], ["recurring", "Subscription", "repeat"]] as const).map(([v, label, icon]) => (
                  <button key={v} type="button" role="radio" aria-checked={profile.charges === v}
                    onClick={() => setCharges(v)}
                    className={`inline-flex items-center gap-[7px] rounded-pill border px-3 py-1.5 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      profile.charges === v ? "border-accent bg-tint-1 text-accent" : "border-[#ded0f4] bg-white/[.92] text-[#3f3560] hover:border-accent-line hover:bg-white hover:text-accent"
                    }`}>
                    <Icon name={icon} size={13} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1.5 text-micro font-bold uppercase tracking-[0.7px] text-[#6b5b91]">
                Where you sell <span className="font-medium normal-case tracking-normal">— all that apply</span>
              </div>
              <div role="group" aria-label="Where you sell" className="flex flex-wrap gap-1.5">
                {([["direct", "Own site"], ["trade", "Wholesale"], ["store", "App store"]] as const).map(([v, label]) => {
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
                      {label}
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
        <h2 className="text-h2 font-bold">Calculators</h2>
        <Badge tone="sale">Per sale</Badge>
        <Badge tone="sandbox">Sandbox</Badge>
        <small className="text-sm font-medium text-muted-2">Costs that move with volume.</small>
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
                  <h3 className="text-h3 font-bold">{c.title ?? costCalculatorTitle(profile)}</h3>
                  <div className={`mt-1 text-xs font-bold leading-[1.35] ${tone.promise}`}>{c.promise}</div>
                </div>
              </div>

              <p className="mt-[11px] text-xs font-medium leading-[1.5] text-muted">{c.desc}</p>

              <div className="mt-[11px] border-t border-rule pt-[11px]">
                <h4 className="text-micro font-extrabold uppercase tracking-[0.8px] text-muted-2">
                  What you&apos;ll need
                </h4>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {c.needs.map((n) => (
                    <span key={n} className="rounded-pill border border-rule bg-tile px-2 py-0.5 text-micro font-semibold text-ink-2">
                      {n}
                    </span>
                  ))}
                  {added.map((n) => (
                    <span key={n} className="rounded-pill border border-accent-line bg-tint-1 px-2 py-0.5 text-micro font-semibold text-accent-dark">
                      {n}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-3">
                <div className={`flex min-h-4 items-center gap-1.5 text-micro font-bold ${state?.done ? "text-green-ink" : "text-muted-2"}`}>
                  {state?.done && <Icon name="check" size={12} />}
                  {state?.label ?? ""}
                </div>
                <Link href={c.href}
                  className={`mt-[9px] flex items-center justify-center gap-[7px] rounded-tile p-2.5 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${tone.go}`}>
                  Open calculator
                  <Icon name="arrow" size={14} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-baseline gap-2.5">
        <h2 className="text-h2 font-bold">Running costs</h2>
        <Badge tone="month">Per month</Badge>
        <small className="text-sm font-medium text-muted-2">
          What you pay whether you sell one or a thousand.
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
              <h3 className="text-h3 font-bold">Running costs &amp; break-even</h3>
              <div className="mt-1 text-xs font-bold leading-[1.35] text-blue-ink">
                What you must sell each month to keep the lights on.
              </div>
            </div>
          </div>
          <p className="mt-[11px] max-w-[54ch] text-xs font-medium leading-[1.5] text-muted">
            Rent, salaries, software and marketing don&apos;t care how much you sell. Add them up
            once — shared across every product — and Branditect works out the volume that covers
            them, and what your real floor price is.
          </p>
          <h4 className="mt-[11px] border-t border-rule pt-[11px] text-micro font-extrabold uppercase tracking-[0.8px] text-muted-2">
            What you&apos;ll need — monthly totals, not receipts
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
            Running costs
            <b className="ml-auto font-extrabold tabular-nums">
              {noCosts ? "—" : `${formatMoney(opEx, currency)} / mo`}
            </b>
          </div>
          <div className="flex items-baseline gap-2.5 text-xs font-semibold text-blue-ink">
            Best contribution per sale
            <b className="ml-auto font-extrabold tabular-nums">
              {bestContribution == null ? "—" : formatMoney(bestContribution, currency)}
            </b>
          </div>
          <div className="mt-0.5 border-t border-blue-line pt-2.5">
            <div className="text-micro font-extrabold uppercase tracking-[0.8px] text-blue-ink opacity-75">Break-even</div>
            {be === null ? (
              <>
                <div className="text-[24px] font-bold tracking-[-0.7px] text-blue-ink opacity-50">—</div>
                <p className="mt-1 text-micro font-medium leading-[1.45] text-blue-ink opacity-80">
                  {noCosts
                    ? "Add your running costs and this becomes a real number. Without them the floor price is only half a floor."
                    : "No product has both a price and a cost yet."}
                </p>
              </>
            ) : be === Infinity ? (
              <>
                <div className="text-[24px] font-bold tracking-[-0.7px] text-accent">Never</div>
                <p className="mt-1 text-micro font-medium leading-[1.45] text-blue-ink opacity-80">
                  Every sale loses money at these prices, so no volume covers the overhead. Fix the
                  price or the cost first.
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
            {noCosts ? "Add running costs" : "Open calculator"}
            <Icon name="arrow" size={14} />
          </Link>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-[7px] px-0.5 text-xs font-semibold text-muted">
        <em className="rounded-pill border border-rule bg-white px-[11px] py-[5px] not-italic text-ink-2">Revenue</em>
        <span className="text-faint">−</span>
        <em className="rounded-pill border border-rule bg-white px-[11px] py-[5px] not-italic text-ink-2">cost of each sale</em>
        <span className="text-faint">=</span>
        <em className="rounded-pill border border-green-line bg-green-wash px-[11px] py-[5px] not-italic text-green-ink">gross profit</em>
        <span className="px-1 text-faint">·</span>
        <em className="rounded-pill border border-green-line bg-green-wash px-[11px] py-[5px] not-italic text-green-ink">gross profit</em>
        <span className="text-faint">−</span>
        <em className="rounded-pill border border-rule bg-white px-[11px] py-[5px] not-italic text-ink-2">running costs</em>
        <span className="text-faint">=</span>
        <em className="rounded-pill border border-blue-line bg-blue-wash px-[11px] py-[5px] not-italic text-blue-ink">operating profit</em>
      </div>

      {/* Says plainly what these numbers are, and are not. */}
      <p className="flex items-start gap-2.5 rounded-panel border border-rule bg-card px-4 py-3.5 text-xs font-medium leading-[1.55] text-muted drop-shadow-panel">
        <span className="mt-px shrink-0 text-faint">
          <Icon name="check" size={14} />
        </span>
        These are calculations from the figures you enter, not advice. Check them against your own
        accounts before you change a price — tax treatment and platform fees vary by market and can
        move a margin by several points.
      </p>
    </div>
  );
}
