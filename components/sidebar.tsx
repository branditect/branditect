"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBrand } from "@/lib/useBrand";

interface NavItem {
  icon: string;
  label: string;
  href: string;
}

const dashboardItems: NavItem[] = [
  { icon: "⌂", label: "Dashboard", href: "/dashboard" },
  { icon: "◎", label: "Mission Board", href: "/dashboard/mission-board" },
  { icon: "◩", label: "Notes", href: "/dashboard/draft-pad" },
];

const createItems: NavItem[] = [
  { icon: "◻", label: "Image Architect", href: "/dashboard/brand-library/image-architect" },
  { icon: "¶", label: "Copy Architect", href: "/dashboard/copy-architect" },
  { icon: "⟨⟩", label: "Code Architect", href: "/dashboard/brand-code-architect" },
];

const libraryItems: NavItem[] = [
  { icon: "◇", label: "Brand Strategy", href: "/dashboard/brand-strategy" },
  { icon: "◇", label: "Social Strategy", href: "/dashboard/brand-strategy/social" },
  { icon: "◷", label: "Tone of Voice", href: "/dashboard/brand-library/tone-of-voice" },
  { icon: "◈", label: "Visual Identity", href: "/dashboard/brand-library" },
  { icon: "▣", label: "Products & Services", href: "/dashboard/catalog" },
  { icon: "◎", label: "Asset Library", href: "/dashboard/assets" },
  { icon: "⊞", label: "Knowledge Vault", href: "/dashboard/brand-library/knowledge-vault" },
  { icon: "⊟", label: "Templates", href: "/dashboard/brand-library/templates" },
];

const toolItems: NavItem[] = [
  { icon: "▤", label: "Calculators", href: "/dashboard/tools" },
  { icon: "◉", label: "Productivity", href: "/dashboard/tools" },
  { icon: "↗", label: "Growth", href: "/dashboard/growth" },
  { icon: "$", label: "Finance Rules", href: "/dashboard/finance" },
];

function NavSection({ label, items, pathname }: { label: string; items: NavItem[]; pathname: string }) {
  return (
    <div className="px-3 pt-5 pb-1">
      {label && (
        <div className="font-label text-[10px] font-semibold text-outline tracking-[0.12em] uppercase mb-2 px-3">
          {label}
        </div>
      )}
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 py-[7px] px-3 rounded-lg mb-0.5 transition-all duration-200 ${
              isActive
                ? "bg-surface-lowest text-primary font-medium ambient-shadow-sm"
                : "text-on-surface-variant hover:bg-surface-lowest/60"
            }`}
          >
            <span className={`text-[11px] w-4 text-center shrink-0 ${isActive ? "text-primary" : "text-outline-variant"}`}>
              {item.icon}
            </span>
            <span className="text-[13px] font-body">
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { brand, brandName } = useBrand();

  const initials = brandName ? brandName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "B";
  const logoUrl = brand?.logo_url;

  return (
    <aside className="w-sidebar bg-surface-low flex flex-col shrink-0 overflow-y-auto">
      {/* Branditect logo */}
      <div className="p-5 pb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/branditect-logo.svg" alt="Branditect" className="h-5" />
      </div>

      <NavSection label="" items={dashboardItems} pathname={pathname} />
      <div className="h-px bg-surface-high mx-5 my-1" />
      <NavSection label="Create" items={createItems} pathname={pathname} />
      <div className="h-px bg-surface-high mx-5 my-1" />
      <NavSection label="Brand Library" items={libraryItems} pathname={pathname} />
      <div className="h-px bg-surface-high mx-5 my-1" />
      <NavSection label="Tools" items={toolItems} pathname={pathname} />

      {/* Client brand + User */}
      <div className="mt-auto p-4">
        {/* Client brand logo + name */}
        <div className="flex items-center gap-2.5 p-2.5 mb-2">
          {logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={logoUrl} alt={brandName} className="w-7 h-7 rounded-lg object-contain shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold font-headline text-on-surface-variant">{initials}</span>
            </div>
          )}
          <div className="font-headline text-[12px] font-bold text-on-surface">{brandName || "Workspace"}</div>
        </div>

        {/* User */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-surface-lowest/60 transition-all cursor-pointer">
          <div className="w-7 h-7 rounded-full overflow-hidden bg-surface-container-high flex items-center justify-center shrink-0">
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={logoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-[10px] text-on-surface-variant">S</span>
            )}
          </div>
          <div>
            <div className="text-[12px] font-semibold text-on-surface font-body">Saara Muuari</div>
            <div className="text-[10px] text-outline">Admin</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
