import Link from "next/link";
import Icon, { type IconName } from "@/components/icon";
import { readinessCopy, type Readiness } from "@/lib/readiness";
import type { KnowledgeCounts } from "@/lib/useReadiness";

const TILES: { key: keyof KnowledgeCounts; label: string; icon: IconName; href: string }[] = [
  { key: "documents", label: "Documents", icon: "doc", href: "/knowledge/documents" },
  { key: "images", label: "Images", icon: "img", href: "/knowledge/images" },
  { key: "products", label: "Products", icon: "bag", href: "/brand/products" },
  { key: "presentations", label: "Presentations", icon: "pres", href: "/knowledge/presentations" },
  { key: "links", label: "Links", icon: "link", href: "/knowledge/links" },
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
  return (
    <section
      aria-label="Brand Readiness"
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
          Apex Performance
        </div>
        <div className="mt-[11px] text-[17px] font-bold leading-[17.5px] tracking-[-.6px] text-ink">
          BUILT
          <br />
          FOR
          <br />
          MORE.
        </div>
      </div>

      <div className="relative z-10">
        <div className="text-sm font-bold tracking-[-.1px]">Brand Readiness</div>

        <div className="mt-2 flex items-center gap-3">
          <span className="text-score font-bold tabular-nums">{readiness.score}%</span>
          <span className="whitespace-nowrap rounded-pill border border-white/[.28] bg-white/[.22] px-3.5 py-[5px] text-sm font-bold backdrop-blur-[2px]">
            {readiness.band}
          </span>
        </div>

        {/* Right padding keeps the copy clear of the rotated tile above it. */}
        <p className="mt-2.5 max-w-[34em] pr-[136px] text-xs font-semibold leading-[1.5] text-white/[.94] stack:pr-0">
          {readinessCopy(readiness)}
        </p>

        <div className="mb-[9px] mt-[18px] text-sm font-bold tracking-[-.1px]">Brand Knowledge</div>
        <div className="grid grid-cols-5 gap-2 stack:grid-cols-3">
          {TILES.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              className="rounded-tile border-[1.2px] border-white/40 px-1.5 pb-2.5 pt-[9px] text-center hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span className="mx-auto block w-4 text-white">
                <Icon name={t.icon} size={16} />
              </span>
              <div className="mt-1.5 text-micro font-medium text-white/[.82]">{t.label}</div>
              <div className="text-[18px] font-bold leading-[1.25] tracking-[-.5px] tabular-nums">
                {knowledge[t.key]}
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/knowledge/documents"
          className="mt-3 inline-block text-micro font-bold tracking-[.4px] text-white underline underline-offset-[3px]"
        >
          Explore knowledge →
        </Link>
      </div>
    </section>
  );
}
