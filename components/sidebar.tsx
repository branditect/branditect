"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBrand } from "@/lib/useBrand";

interface NavItem {
  icon: string;
  label: string;
  href: string;
  badge?: string;
}

const dashboardItems: NavItem[] = [
  { icon: "⌂", label: "Dashboard", href: "/dashboard" },
  { icon: "◎", label: "Mission Board", href: "/dashboard/mission-board" },
  { icon: "◩", label: "Draft Pad", href: "/dashboard/draft-pad" },
];

const createItems: NavItem[] = [
  { icon: "◻", label: "Image Architect", href: "/dashboard/brand-library/image-architect" },
  { icon: "¶", label: "Copy Architect", href: "/dashboard/copy-architect" },
  { icon: "⟨⟩", label: "Code Architect", href: "/dashboard/brand-code-architect" },
];

const libraryItems: NavItem[] = [
  { icon: "◇", label: "Brand Strategy", href: "/dashboard/brand-strategy" },
  { icon: "◷", label: "Tone of Voice", href: "/dashboard/brand-library/tone-of-voice" },
  { icon: "◈", label: "Visual Identity", href: "/dashboard/brand-library" },
  { icon: "▣", label: "Products & Services", href: "/dashboard/catalog" },
  { icon: "◎", label: "Asset Library", href: "/dashboard/assets" },
  { icon: "⊞", label: "Knowledge Vault", href: "/dashboard/brand-library/knowledge-vault" },
  { icon: "◫", label: "Brand Book", href: "/dashboard/brand-book" },
  { icon: "◆", label: "Brand Assets", href: "/dashboard/brand-assets" },
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
        <div className="text-[10px] font-semibold text-[#888888] tracking-[0.1em] uppercase mb-1 px-3">
          {label}
        </div>
      )}
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 py-[6px] px-3 rounded-md mb-px transition-colors ${
              isActive
                ? "bg-[#FFF0E6] text-[#E16C00] font-medium"
                : "text-[#1A1A1A] hover:bg-[#F5F5F5]"
            }`}
          >
            <span className={`text-[12px] w-4 text-center shrink-0 ${isActive ? "text-[#E16C00]" : "text-[#888888]"}`}>
              {item.icon}
            </span>
            <span className="text-[13px]">
              {item.label}
            </span>
            {item.badge && (
              <span className={`ml-auto text-[10px] font-semibold px-[5px] py-px rounded border ${
                isActive
                  ? "bg-[#FFF0E6] border-[#FFCAA7] text-[#E16C00]"
                  : "bg-[#F5F4F0] border-[#C8C9CC] text-[#888888]"
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
  const { brand, brandName } = useBrand();

  const initials = brandName ? brandName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "B";
  const logoUrl = brand?.logo_url;

  return (
    <aside className="w-sidebar bg-white border-r border-[#C8C9CC] flex flex-col shrink-0 overflow-y-auto">
      {/* Brand header */}
      <div className="p-4 pb-3 border-b border-[#E2E3E6] flex items-center gap-[9px]">
        {logoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={logoUrl} alt={brandName} className="w-[30px] h-[30px] rounded-md object-contain shrink-0" />
        ) : (
          <div className="w-[30px] h-[30px] bg-[#315A72] rounded-md flex items-center justify-center shrink-0">
            <span className="text-white text-[11px] font-bold font-mono">{initials}</span>
          </div>
        )}
        <div>
          <div className="text-[13px] font-semibold text-[#1A1A1A]">{brandName || "Workspace"}</div>
          <div className="text-[11px] text-[#888888]">Branditect Workspace</div>
        </div>
      </div>

      <NavSection label="" items={dashboardItems} pathname={pathname} />
      <div className="h-px bg-[#E2E3E6] mx-3" />
      <NavSection label="Create" items={createItems} pathname={pathname} />
      <div className="h-px bg-[#E2E3E6] mx-3" />
      <NavSection label="Brand Library" items={libraryItems} pathname={pathname} />
      <div className="h-px bg-[#E2E3E6] mx-3" />
      <NavSection label="Brand Tools" items={toolItems} pathname={pathname} />

      {/* User */}
      <div className="mt-auto p-3 border-t border-[#E2E3E6]">
        <div className="flex items-center gap-2 p-2 rounded-md hover:bg-[#F5F5F5] transition-colors cursor-pointer">
          <div className="w-6 h-6 rounded-full bg-[#FFF0E6] border border-[#FFCAA7] flex items-center justify-center font-semibold text-[11px] text-[#E16C00] shrink-0">
            S
          </div>
          <div>
            <div className="text-[12px] font-medium text-[#1A1A1A]">Saara Muuari</div>
            <div className="text-[11px] text-[#888888]">Admin</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
