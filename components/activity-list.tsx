import Link from "next/link";
import IconTile from "@/components/icon-tile";
import type { IconName } from "@/components/icon";

export type ActivityType = "strategy" | "upload" | "created" | "chat";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  at: Date;
}

const ICONS: Record<ActivityType, IconName> = {
  strategy: "target",
  upload: "doc",
  created: "studio",
  chat: "chat",
};

function relative(at: Date, now: Date): string {
  const mins = Math.max(0, Math.round((now.getTime() - at.getTime()) / 60000));
  if (mins < 60) return mins <= 1 ? "Just now" : `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  return weeks === 1 ? "Last week" : `${weeks} weeks ago`;
}

/**
 * Every activity title must name a surface that exists in the nav. The old
 * app credited outputs to "Content Architect" and "Financial Tools", neither
 * of which was reachable — that's how a user learns not to trust the list.
 */
export default function ActivityList({
  items,
  now,
}: {
  items: ActivityItem[];
  now: Date;
}) {
  return (
    <section className="rounded-panel border border-rule bg-card drop-shadow-panel">
      <div className="flex items-baseline justify-between gap-2.5 px-[15px] pt-4">
        <h3 className="text-h3 font-bold">Recent activity</h3>
        <Link
          href="/knowledge/documents"
          className="text-xs font-semibold text-accent underline underline-offset-2"
        >
          View all
        </Link>
      </div>

      <div className="px-[15px] pb-3 pt-1">
        {items.length === 0 ? (
          <p className="py-4 text-xs font-normal text-muted-2">
            Nothing yet. Anything you add to Brand, Knowledge or Studio shows up here.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2.5 border-b border-rule py-2.5 last:border-b-0"
            >
              <IconTile icon={ICONS[item.type]} size={28} tint={1} />
              <span className="text-sm font-semibold tracking-[-.05px]">{item.title}</span>
              <span className="ml-auto whitespace-nowrap text-xs font-normal text-faint">
                {relative(item.at, now)}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
