import Link from "next/link";
import IconTile from "@/components/icon-tile";
import type { IconName } from "@/components/icon";

interface NotBuiltYetProps {
  icon: IconName;
  title: string;
  /** What this surface will do. Say the diagnosis, not a promise. */
  description: string;
  /** Where the user can go that is useful today. */
  cta: { label: string; href: string };
}

/**
 * A nav item that 404s is worse than a missing feature. These pages exist so
 * every entry in the sidebar lands somewhere that tells the truth about what
 * is and isn't built.
 */
export default function NotBuiltYet({ icon, title, description, cta }: NotBuiltYetProps) {
  return (
    <div className="mx-auto flex max-w-shell flex-col px-4 pb-12 pt-[22px]">
      <h1 className="text-display font-bold leading-[1.15]">{title}</h1>

      <div className="mt-[18px] rounded-panel border border-rule bg-card p-6 drop-shadow-panel">
        <IconTile icon={icon} size={36} tint={1} />
        <p className="mt-3.5 max-w-[46em] text-base font-medium leading-[1.55] text-ink-2">
          {description}
        </p>
        <Link
          href={cta.href}
          className="mt-4 inline-flex items-center gap-1.5 rounded-tile bg-accent px-3.5 py-2.5 text-xs font-bold text-white hover:bg-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {cta.label} →
        </Link>
      </div>
    </div>
  );
}
