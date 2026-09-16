import Link from "next/link";
import Icon, { type IconName } from "@/components/icon";
import { readinessCopy, BAND_KEY, type Readiness } from "@/lib/readiness";
import type { KnowledgeCounts } from "@/lib/useReadiness";
import { useT } from "@/lib/i18n/use-t.tsx";
import type { StringKey } from "@/lib/i18n/index.ts";

const TILES: { key: keyof KnowledgeCounts; label: StringKey; icon: IconName; href: string }[] = [
  { key: "documents", label: "nav.knowledge.documents", icon: "doc", href: "/knowledge/documents" },
  { key: "images", label: "nav.knowledge.images", icon: "img", href: "/knowledge/images" },
  { key: "products", label: "nav.knowledge.products", icon: "bag", href: "/knowledge/products" },
  { key: "presentations", label: "nav.knowledge.presentations", icon: "pres", href: "/knowledge/presentations" },
  { key: "links", label: "nav.knowledge.links", icon: "link", href: "/knowledge/links" },
];

interface ReadinessCardProps {
  readiness: Readiness;
  knowledge: KnowledgeCounts;
}

/**
 * The most important element on the screen. Everything except the counts is
 * derived from `readiness` — nothing here is hand-written per state.
 */
export default function ReadinessCard({ readiness, knowledge }: ReadinessCardProps) {
  const t = useT();
  return (
    <section
      aria-label={t("readiness.brandReadiness")}
      className="relative overflow-hidden rounded-panel bg-grad-hero px-[22px] pb-5 pt-[22px] text-white drop-shadow-hero"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -top-8 h-[100px] w-[150px] rounded-full border-[1.2px] border-white/25"
      />
      <div
        aria-hidden="true"
        className="absolute right-6 top-6 w-28 -rotate-6 rounded-card bg-white p-3 shadow-[0_14px_26px_-14px_rgba(60,12,0,.55)] stack:hidden"
      >
        <div className="text-[5.5px] font-normal uppercase tracking-[.85px] text-faint-2">
          {t("readiness.yourData")}
        </div>
        {/* FOUNDATION is twice the length of the word this replaced. At 13.5px
            it measured 87px inside an 89px tile, which is under 2px of
            clearance and would spill on a machine that renders wider. */}
        <div className="mt-[11px] text-[12px] font-bold leading-[13.5px] tracking-[-.4px] text-ink">
          {t("readiness.tile").split("\n").map((line, i) => (
            <span key={i}>{i > 0 && <br />}{line}</span>
          ))}
        </div>
      </div>

      <div className="relative z-10">
        <div className="text-sm font-bold tracking-[-.1px]">{t("readiness.brandReadiness")}</div>

        <div className="mt-2 flex items-center gap-3">
          <span className="text-score font-bold tabular-nums">{readiness.score}%</span>
          <span className="whitespace-nowrap rounded-pill border border-white/[.28] bg-white/[.22] px-3.5 py-[5px] text-sm font-bold backdrop-blur-[2px]">
            {t(BAND_KEY[readiness.band])}
          </span>
        </div>

        {/* Right padding keeps the copy clear of the rotated tile above it. */}
        <p className="mt-2.5 max-w-[34em] pr-[136px] text-xs font-semibold leading-[1.5] text-white/[.94] stack:pr-0">
          {readinessCopy(readiness).map((m) => t(m.key, m.vars)).join(" ")}
        </p>

        <div className="mb-[9px] mt-[18px] text-sm font-bold tracking-[-.1px]">{t("readiness.brandKnowledge")}</div>
        <div className="grid grid-cols-5 gap-2 stack:grid-cols-3">
          {TILES.map((tile) => (
            <Link
              key={tile.key}
              href={tile.href}
              className="rounded-tile border-[1.2px] border-white/40 px-1.5 pb-2.5 pt-[9px] text-center hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span className="mx-auto block w-4 text-white">
                <Icon name={tile.icon} size={16} />
              </span>
              <div className="mt-1.5 text-micro font-medium text-white/[.82]">{t(tile.label)}</div>
              <div className="text-[18px] font-bold leading-[1.25] tracking-[-.5px] tabular-nums">
                {knowledge[tile.key]}
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/knowledge/documents"
          className="mt-3 inline-block text-micro font-bold tracking-[.4px] text-white underline underline-offset-[3px]"
        >
          {t("readiness.explore")}
        </Link>
      </div>
    </section>
  );
}
