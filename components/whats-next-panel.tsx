import Link from "next/link";
import Icon, { type IconName } from "@/components/icon";
import IconTile from "@/components/icon-tile";
import type { Check, CheckId } from "@/lib/readiness";
import { useT } from "@/lib/i18n/use-t.tsx";

const ICONS: Record<CheckId, IconName> = {
  questionnaire: "target",
  knowledgeFiles: "doc",
  brandImages: "img",
  brandGuideline: "upload",
};

// Step down the tint ladder in order so the rows read as a set.
const TINTS = [1, 2, 3, 4] as const;

interface WhatsNextPanelProps {
  checks: Check[];
  score: number;
  passedCount: number;
  totalCount: number;
}

/**
 * This panel renders the readiness checks and nothing else. It is the
 * score's breakdown, not a second to-do list.
 */
export default function WhatsNextPanel({
  checks,
  score,
  passedCount,
  totalCount,
}: WhatsNextPanelProps) {
  const t = useT();
  return (
    <section
      aria-label={t("whatsNext.title")}
      className="flex flex-col rounded-panel border border-rule bg-card drop-shadow-panel"
    >
      <div className="flex items-baseline justify-between gap-2.5 px-[15px] pt-4">
        <h3 className="text-h3 font-bold">{t("whatsNext.title")}</h3>
        <Link
          href="/brand/strategy"
          className="text-xs font-semibold text-accent underline underline-offset-2"
        >
          {t("activity.viewAll")}
        </Link>
      </div>

      <div className="flex flex-1 flex-col px-[15px] pb-3.5 pt-1">
        {checks.map((check, i) => (
          <div
            key={check.id}
            className="flex items-center gap-2.5 border-b border-rule py-2.5 last-of-type:border-b-0"
          >
            <IconTile icon={ICONS[check.id]} size={30} tint={TINTS[i] ?? 4} />
            <div className="min-w-0">
              <div className="text-sm font-bold tracking-[-.1px]">{check.label}</div>
              <div className="mt-px text-2xs font-medium text-muted">{check.detail}</div>
            </div>
            {check.passed ? (
              <span className="ml-auto inline-flex items-center gap-1 whitespace-nowrap text-xs font-bold text-good">
                <Icon name="check" size={13} />
                {t("whatsNext.done")}
              </span>
            ) : (
              <Link
                href={check.href!}
                className="ml-auto whitespace-nowrap text-xs font-bold text-accent hover:underline"
              >
                {check.action} →
              </Link>
            )}
          </div>
        ))}

        {/* Not a check. Carries no points — a permanent escape hatch. */}
        <div className="flex items-center gap-2.5 border-b border-rule py-2.5 last-of-type:border-b-0">
          <IconTile icon="plus" size={30} tint="neutral" />
          <div className="min-w-0">
            <div className="text-sm font-bold tracking-[-.1px]">{t("whatsNext.addMore")}</div>
            <div className="mt-px text-2xs font-medium text-muted">{t("whatsNext.exploreMore")}</div>
          </div>
          <Link
            href="/studio/write"
            className="ml-auto whitespace-nowrap text-xs font-bold text-accent hover:underline"
          >
            →
          </Link>
        </div>

        <div className="mt-auto flex items-center gap-2 rounded-tile bg-tint-1 px-3 py-2.5 text-xs font-semibold text-accent-dark">
          <span>
            {t("whatsNext.eachCheckWorth")} <b className="font-extrabold">25%</b>
          </span>
          <span className="ml-auto text-2xs font-bold tabular-nums text-accent">
            {passedCount} / {totalCount} · {score}%
          </span>
        </div>
      </div>
    </section>
  );
}
