"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useBrand } from "@/lib/useBrand";
import Icon, { type IconName } from "@/components/icon";
import { formatMoney, fromRow, margin, type Product } from "@/lib/products";
import {
  breakEvenUnits, contribution, costCalculatorTitle, costLines, DEFAULT_PROFILE,
  EMPTY_RUNNING_COSTS, operatingProfit, profileSentence, RUNNING_COST_LINES,
  runningCostsUnset, totalRunningCosts, unitNoun,
  type BusinessProfile, type Channel, type RunningCosts,
} from "@/lib/numbers";

const CALCULATORS: {
  n: number; key: string; icon: IconName; href: string;
  title?: string; promise: string; desc: string; needs: string[];
  recurringOnly?: boolean;
}[] = [
  {
    n: 1, key: "cost", icon: "bag", href: "/numbers/cost",
    promise: "Everything one sale actually costs you.",
    desc: "Production, freight, packaging, fees and the cost of a return — added up once so every other number here has something honest to stand on.",
    needs: ["Factory cost", "Freight & duty", "Packaging", "Payment fees"],
  },
  {
    n: 2, key: "pricing", icon: "target", href: "/numbers/pricing",
    title: "Pricing & margin", promise: "Work it from either end.",
    desc: "Set a price and see the margin, or set a margin and see the price. Always net of tax, always against landed cost.",
    needs: ["Cost per sale", "Target margin", "Tax rate"],
  },
  {
    n: 3, key: "offers", icon: "pct" as IconName, href: "/numbers/offers",
    title: "Offers & discounts", promise: "What you can give away before it hurts.",
    desc: "The deepest discount that still clears your floor — which becomes the limit Studio writes inside.",
    needs: ["Price", "Cost per sale", "Minimum margin"],
  },
  {
    n: 4, key: "recurring", icon: "numbers", href: "/numbers/recurring",
    title: "Recurring revenue", promise: "See what a customer is worth over time.",
    desc: "MRR, churn and lifetime value, and how long it takes to earn back what you spent acquiring someone.",
    needs: ["Monthly price", "Churn rate", "Cost to acquire"],
    recurringOnly: true,
  },
];

function Badge({ tone, children }: { tone: "sale" | "month" | "sandbox"; children: React.ReactNode }) {
  const styles = {
    sale: "bg-blue-wash text-blue-ink",
    month: "bg-green-wash text-green-ink",
    sandbox: "bg-tint-1 text-accent",
  } as const;
  return (
    <span className={`rounded-pill px-2.5 py-1 text-micro font-bold uppercase tracking-[0.7px] ${styles[tone]}`}>
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
  const currency = products[0]?.currency ?? "GBP";

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
          className="relative overflow-hidden rounded-panel bg-grad-hero px-[22px] pb-5 pt-[22px] text-white drop-shadow-hero"
        >
          <span aria-hidden="true" className="pointer-events-none absolute -right-6 -top-8 h-[100px] w-[150px] rounded-full border-[1.2px] border-white/25" />
          <div className="relative z-10">
            <div className="text-sm font-bold tracking-[-0.1px]">What Numbers does</div>
            <p className="mt-2 max-w-[46em] text-xs font-semibold leading-[1.5] text-white/[.94]">
              Work out what you really make on every sale, set prices that hit your target margin,
              and build offers that don&apos;t quietly cost you money — then{" "}
              <b>Studio writes inside those limits.</b>
            </p>

            <div className="mt-[18px] grid grid-cols-3 gap-2 stack:grid-cols-1">
              <div className="rounded-tile border-[1.2px] border-white/40 px-3 py-2.5">
                <div className="text-micro font-medium text-white/[.82]">Products priced</div>
                <div className="text-[18px] font-bold tabular-nums">
                  {portfolio.priced} / {portfolio.total}
                </div>
                <div className="text-micro font-medium text-white/70">
                  {missing > 0 ? `${missing} missing costs` : "all costed"}
                </div>
              </div>
              <div className="rounded-tile border-[1.2px] border-white/40 px-3 py-2.5">
                <div className="text-micro font-medium text-white/[.82]">Lowest margin</div>
                <div className="text-[18px] font-bold tabular-nums">
                  {portfolio.lowest ? `${portfolio.lowest.m.pct.toFixed(0)}%` : "—"}
                </div>
                <div className="truncate text-micro font-medium text-white/70">
                  {portfolio.lowest?.p.name ?? "no costed products"}
                </div>
              </div>
              <div className="rounded-tile border-[1.2px] border-white/40 px-3 py-2.5">
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

        <section aria-label="How you sell" className="flex flex-col rounded-panel border border-rule bg-card drop-shadow-panel">
          <div className="flex items-baseline justify-between gap-2.5 px-[15px] pt-4">
            <h3 className="text-h3 font-bold">How you sell</h3>
            <span className="text-2xs font-semibold text-muted-2">Set once</span>
          </div>
          <div className="flex flex-col gap-3.5 px-[15px] pb-4 pt-3">
            <div>
              <div className="mb-1.5 text-micro font-bold uppercase tracking-[0.7px] text-muted">What you sell</div>
              <div role="radiogroup" aria-label="What you sell" className="flex gap-1.5">
                {([["physical", "Physical goods"], ["digital", "Digital & access"]] as const).map(([v, label]) => (
                  <button key={v} type="button" role="radio" aria-checked={profile.sells === v}
                    onClick={() => setSells(v)}
                    className={`flex-1 rounded-tile border px-2 py-2 text-2xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      profile.sells === v ? "border-accent-line bg-tint-1 text-accent" : "border-rule-2 text-ink-2 hover:bg-tile"
                    }`}>{label}</button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1.5 text-micro font-bold uppercase tracking-[0.7px] text-muted">How you charge</div>
              <div role="radiogroup" aria-label="How you charge" className="flex gap-1.5">
                {([["oneoff", "One-off"], ["recurring", "Subscription"]] as const).map(([v, label]) => (
                  <button key={v} type="button" role="radio" aria-checked={profile.charges === v}
                    onClick={() => setCharges(v)}
                    className={`flex-1 rounded-tile border px-2 py-2 text-2xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      profile.charges === v ? "border-accent-line bg-tint-1 text-accent" : "border-rule-2 text-ink-2 hover:bg-tile"
                    }`}>{label}</button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1.5 text-micro font-bold uppercase tracking-[0.7px] text-muted">
                Where you sell <span className="font-medium normal-case tracking-normal">— all that apply</span>
              </div>
              <div role="group" aria-label="Where you sell" className="flex gap-1.5">
                {([["direct", "Own site"], ["trade", "Wholesale"], ["store", "App store"]] as const).map(([v, label]) => (
                  <button key={v} type="button" aria-pressed={profile.channels.includes(v)}
                    onClick={() => toggleChannel(v)}
                    className={`flex-1 rounded-tile border px-2 py-2 text-2xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      profile.channels.includes(v) ? "border-accent-line bg-tint-1 text-accent" : "border-rule-2 text-ink-2 hover:bg-tile"
                    }`}>{label}</button>
                ))}
              </div>
            </div>

            <p aria-live="polite" className="mt-auto rounded-tile bg-tile px-3 py-2.5 text-2xs font-medium leading-[1.5] text-ink-2">
              {profileSentence(profile)}{" "}
              <span className="text-muted">
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

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3">
        {cards.map((c) => (
          <Link key={c.key} href={c.href}
            className="group flex flex-col rounded-panel border border-rule bg-card p-[18px] drop-shadow-panel hover:border-accent-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            <div className="flex items-start gap-2.5">
              <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-tile bg-tint-1 text-accent">
                <Icon name={c.icon === ("pct" as IconName) ? "numbers" : c.icon} size={18} />
                <span className="absolute -left-1 -top-1 grid h-[18px] w-[18px] place-items-center rounded-full bg-accent text-micro font-bold text-white">
                  {c.n}
                </span>
              </span>
              <div className="min-w-0">
                <h3 className="text-h3 font-bold">{c.title ?? costCalculatorTitle(profile)}</h3>
                <div className="mt-0.5 text-2xs font-semibold text-accent">{c.promise}</div>
              </div>
            </div>
            <p className="mt-2.5 text-xs font-medium leading-[1.55] text-muted">{c.desc}</p>
            <div className="mt-3">
              <h4 className="text-micro font-bold uppercase tracking-[0.7px] text-muted-2">What you&apos;ll need</h4>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {c.needs.map((n) => (
                  <span key={n} className="rounded-pill border border-rule bg-tile px-2 py-0.5 text-micro font-semibold text-ink-2">{n}</span>
                ))}
              </div>
            </div>
            <div className="mt-auto flex items-center gap-2 pt-3.5 text-2xs font-bold text-accent">
              Open calculator
              <span className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none">
                <Icon name="arrow" size={14} />
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-baseline gap-2.5">
        <h2 className="text-h2 font-bold">Running costs</h2>
        <Badge tone="month">Per month</Badge>
        <small className="text-sm font-medium text-muted-2">
          What you pay whether you sell one or a thousand.
        </small>
      </div>

      <section className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 rounded-panel border border-rule bg-card p-[18px] drop-shadow-panel stack:grid-cols-1">
        <div>
          <div className="flex items-start gap-2.5">
            <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-tile bg-tint-1 text-accent">
              <Icon name="numbers" size={18} />
              <span className="absolute -left-1 -top-1 grid h-[18px] w-[18px] place-items-center rounded-full bg-accent text-micro font-bold text-white">5</span>
            </span>
            <div>
              <h3 className="text-h3 font-bold">Running costs &amp; break-even</h3>
              <div className="mt-0.5 text-2xs font-semibold text-accent">
                What you must sell each month to keep the lights on.
              </div>
            </div>
          </div>
          <p className="mt-2.5 text-xs font-medium leading-[1.55] text-muted">
            Rent, salaries, software and marketing don&apos;t care how much you sell. Add them up
            once — shared across every product — and Branditect works out the volume that covers
            them, and what your real floor price is.
          </p>
          <h4 className="mt-3 text-micro font-bold uppercase tracking-[0.7px] text-muted-2">
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

        <div className="flex flex-col gap-2 rounded-card bg-tile p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink-2">
            Running costs
            <b className="ml-auto tabular-nums">
              {noCosts ? "—" : `${formatMoney(opEx, currency)} / mo`}
            </b>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-ink-2">
            Best contribution per sale
            <b className="ml-auto tabular-nums">
              {bestContribution == null ? "—" : formatMoney(bestContribution, currency)}
            </b>
          </div>
          <div className="mt-1 rounded-tile bg-white px-3 py-2.5">
            <div className="text-micro font-bold uppercase tracking-[0.7px] text-muted">Break-even</div>
            {be === null ? (
              <>
                <div className="text-[22px] font-bold tracking-[-0.5px] text-faint">—</div>
                <p className="mt-1 text-2xs font-medium leading-[1.5] text-muted">
                  {noCosts
                    ? "Add your running costs and this becomes a real number. Without them the floor price is only half a floor."
                    : "No product has both a price and a cost yet."}
                </p>
              </>
            ) : be === Infinity ? (
              <>
                <div className="text-[22px] font-bold tracking-[-0.5px] text-accent">Never</div>
                <p className="mt-1 text-2xs font-medium leading-[1.5] text-muted">
                  Every sale loses money at these prices, so no volume covers the overhead. Fix the
                  price or the cost first.
                </p>
              </>
            ) : (
              <>
                <div className="text-[22px] font-bold tracking-[-0.5px] tabular-nums">
                  {be} {unitNoun(profile)} / mo
                </div>
                <p className="mt-1 text-2xs font-medium leading-[1.5] text-muted">
                  Below this you lose money however healthy the margin looks.
                  {volume != null && bestContribution != null && (
                    <>
                      {" "}At {volume} a month, operating profit is{" "}
                      <b className="text-ink-2">
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
            className="mt-1 rounded-tile bg-grad-mark px-4 py-2.5 text-center text-sm font-bold text-white drop-shadow-[0_4px_8px_rgba(232,73,32,.28)]">
            {noCosts ? "Add running costs" : "Open calculator"}
          </Link>
        </div>
      </section>

      <p className="flex flex-wrap items-center justify-center gap-2 rounded-panel border border-rule bg-card px-4 py-3.5 text-xs font-medium text-muted drop-shadow-panel">
        <em className="not-italic font-semibold text-ink-2">Revenue</em> −
        <em className="not-italic font-semibold text-ink-2">cost of each sale</em> =
        <em className="not-italic font-bold text-green-ink">gross profit</em>
        <span className="px-1 text-faint">·</span>
        <em className="not-italic font-bold text-green-ink">gross profit</em> −
        <em className="not-italic font-semibold text-ink-2">running costs</em> =
        <em className="not-italic font-bold text-blue-ink">operating profit</em>
      </p>
    </div>
  );
}
