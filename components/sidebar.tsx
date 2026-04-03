"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  icon: string;
  label: string;
  href: string;
  badge?: string;
}

const homeItems: NavItem[] = [
  { icon: "⌂", label: "Dashboard", href: "/dashboard" },
  { icon: "✦", label: "Create", href: "/dashboard/create" },
  { icon: "◫", label: "Brand Library", href: "/dashboard/brand-library" },
  { icon: "◎", label: "Asset Library", href: "/dashboard/assets", badge: "18" },
];

const libraryItems: NavItem[] = [
  { icon: "◉", label: "Brand Bases", href: "/dashboard/brand-bases" },
  { icon: "☰", label: "Brand Strategy", href: "/dashboard/brand-strategy" },
  { icon: "◷", label: "Voice Guidelines", href: "/dashboard/voice" },
  { icon: "◈", label: "Visual Identity", href: "/dashboard/visual" },
];

const toolItems: NavItem[] = [
  { icon: "⟨⟩", label: "Brand Code Architect", href: "/dashboard/brand-code-architect" },
  { icon: "📊", label: "Business Tools", href: "/dashboard/tools" },
  { icon: "↗", label: "Growth Expert", href: "/dashboard/growth" },
  { icon: "⚑", label: "Brand Monitor", href: "/dashboard/monitor", badge: "2" },
  { icon: "$", label: "Finance Rules", href: "/dashboard/finance" },
];

function NavSection({ label, items, pathname }: { label: string; items: NavItem[]; pathname: string }) {
  return (
    <div className="px-2.5 pt-4 pb-1">
      <div className="font-mono text-[0.56rem] tracking-[0.14em] uppercase text-muted px-2 mb-1.5">
        {label}
      </div>
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 py-[7px] px-2.5 rounded-[5px] mb-px transition-all ${
              isActive ? "bg-brand-orange-pale" : "hover:bg-pale"
            }`}
          >
            <span className={`text-[0.82rem] w-4 text-center shrink-0 ${isActive ? "text-brand-orange" : "text-muted"}`}>
              {item.icon}
            </span>
            <span className={`text-[0.8rem] ${isActive ? "text-brand-orange font-medium" : "text-mid"}`}>
              {item.label}
            </span>
            {item.badge && (
              <span className={`ml-auto font-mono text-[0.55rem] px-[5px] py-px rounded-lg border ${
                isActive
                  ? "bg-brand-orange-pale border-brand-orange-mid text-brand-orange"
                  : "bg-pale border-light text-muted"
              }`}>
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-sidebar bg-[#FAFAFA] border-r border-light flex flex-col shrink-0 overflow-y-auto">
      {/* Brand header */}
      <div className="p-4 pb-3 border-b border-light flex items-center gap-[9px]">
        <div className="w-[30px] h-[30px] bg-vetra-black rounded-md flex items-center justify-center shrink-0">
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <path d="M2 2L8 10L14 2" stroke="#C8F135" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <div className="font-mono text-[0.75rem] font-medium tracking-wider text-ink">VETRA MOBILE</div>
          <div className="text-[0.65rem] text-muted mt-px">Branditect Workspace</div>
        </div>
      </div>

      <NavSection label="Home" items={homeItems} pathname={pathname} />

      <div className="h-px bg-light mx-3" />

      <NavSection label="My Brand Library" items={libraryItems} pathname={pathname} />

      <div className="h-px bg-light mx-3" />

      <NavSection label="Tools" items={toolItems} pathname={pathname} />

      {/* User */}
      <div className="mt-auto p-3 border-t border-light">
        <div className="flex items-center gap-2 p-2 rounded-[5px] hover:bg-pale transition-all cursor-pointer">
          <div className="w-6 h-6 rounded-full bg-brand-orange-pale border border-brand-orange-mid flex items-center justify-center font-display text-[0.65rem] text-brand-orange shrink-0">
            S
          </div>
          <div>
            <div className="text-[0.75rem] font-medium text-ink">Saara Muuari</div>
            <div className="text-[0.65rem] text-muted">Admin</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
