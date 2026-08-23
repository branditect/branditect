"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBrand } from "@/lib/useBrand";
import { useUser } from "@/lib/useUser";
import Icon from "@/components/icon";
import Logo from "@/components/logo";
import { NAV, sectionFor, type NavItem } from "@/lib/nav";

function NavRow({
  item,
  pathname,
  expanded,
  onToggle,
}: {
  item: NavItem;
  pathname: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isActive = item.children
    ? pathname.startsWith(item.href)
    : pathname === item.href;

  // The icon stays orange in both states — only the label colour changes.
  const rowClass = `flex h-9 w-full items-center gap-[9px] rounded-nav px-[9px] text-base font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${
    isActive ? "bg-tint-1 text-accent" : "text-ink-2 hover:bg-tile"
  }`;

  if (!item.children) {
    return (
      <Link
        href={item.href}
        className={rowClass}
        aria-current={isActive ? "page" : undefined}
      >
        <span className="shrink-0 text-accent">
          <Icon name={item.icon} size={20} />
        </span>
        {item.label}
      </Link>
    );
  }

  return (
    <>
      <button type="button" onClick={onToggle} className={rowClass} aria-expanded={expanded}>
        <span className="shrink-0 text-accent">
          <Icon name={item.icon} size={20} />
        </span>
        {item.label}
        <span
          className={`ml-auto text-[8px] text-faint transition-transform duration-200 ${
            expanded ? "rotate-90" : ""
          }`}
          aria-hidden="true"
        >
          ▶
        </span>
      </button>

      {expanded && (
        <div className="flex flex-col pb-[5px] pl-[38px] pt-px">
          {item.children.map((child) => {
            const childActive = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                aria-current={childActive ? "page" : undefined}
                className={`flex items-center justify-between gap-2 rounded-lg px-[9px] py-[5px] text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${
                  childActive ? "bg-tile text-ink" : "text-muted hover:bg-tile hover:text-ink"
                }`}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { brandName } = useBrand();
  const { user } = useUser();

  // The active section is expanded on load; expansion is UI-only state.
  const [open, setOpen] = useState<string | null>(() => sectionFor(pathname));

  return (
    <nav
      aria-label="Primary"
      className="m-3 mr-0 flex w-sidebar shrink-0 flex-col self-start rounded-panel border border-rule bg-card min-h-[860px] px-3 pb-4 pt-[18px] drop-shadow-panel stack:min-h-0 stack:m-0 stack:w-full stack:rounded-none"
    >
      <Link href="/home" className="flex items-center gap-2 px-1.5 pb-5">
        <Logo height={26} />
      </Link>

      <div className="flex flex-col gap-px">
        {NAV.map((item) => (
          <NavRow
            key={item.href}
            item={item}
            pathname={pathname}
            expanded={open === item.label}
            onToggle={() => setOpen(open === item.label ? null : item.label)}
          />
        ))}
      </div>

      <div className="mt-auto pt-[18px]">
        <div className="rounded-card bg-tint-1 p-[13px]">
          <div className="text-xs font-semibold text-ink">Your plan</div>
          <div className="text-[19px] font-bold leading-[1.35] tracking-[-0.5px] text-accent">Pro</div>
          <Link
            href="/settings/plan"
            className="mt-[9px] block rounded-[9px] bg-white p-[7px] text-center text-xs font-semibold text-accent drop-shadow-btn"
          >
            View plan
          </Link>
        </div>

        <div className="mt-3 flex items-center gap-2.5 px-[3px]">
          <Logo variant="mark" height={32} className="shrink-0" />
          <div className="min-w-0">
            <div className="truncate text-sm font-bold tracking-[-0.1px]">
              {user?.fullName ?? user?.email ?? brandName}
            </div>
            {/* Only show the brand underneath when it isn't already the line above. */}
            <div className="truncate text-2xs font-normal text-faint">
              {user ? brandName : "Workspace"}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
