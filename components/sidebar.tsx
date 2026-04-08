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
    <div className="px-2.5 pt-4 pb-1">
      {label && (
        <div className="text-[10px] font-semibold text-[#888888] tracking-widest uppercase px-2 mb-1.5">
          {label}
        </div>
      )}
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 py-[6px] px-2.5 rounded-md mb-px transition-colors ${
              isActive ? "bg-[#FFF1ED] text-[#E8562A] font-medium" : "text-[#3d3d3d] hover:bg-gray-50"
            }`}
          >
            <span className={`text-[12px] w-4 text-center shrink-0 ${isActive ? "text-[#E8562A]" : "text-[#888888]"}`}>
              {item.icon}
            </span>
            <span className="text-[12.5px]">
              {item.label}
            </span>
            {item.badge && (
              <span className={`ml-auto font-mono text-[10px] px-[5px] py-px rounded-lg border ${
                isActive
                  ? "bg-[#FEF0EB] border-[#F8C9B3] text-[#E8562A]"
                  : "bg-[#F2F1EE] border-[#D0D3DA] text-[#888888]"
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
    <aside className="w-sidebar bg-white border-r border-[#D0D3DA] flex flex-col shrink-0 overflow-y-auto">
      {/* Brand header */}
      <div className="p-4 pb-3 border-b border-[#D0D3DA] flex items-center gap-[9px]">
        {logoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={logoUrl} alt={brandName} className="w-[30px] h-[30px] rounded-md object-contain shrink-0" />
        ) : (
          <div className="w-[30px] h-[30px] bg-[#1f1f1f] rounded-md flex items-center justify-center shrink-0">
            <span className="text-white text-[0.65rem] font-bold font-mono">{initials}</span>
          </div>
        )}
        <div>
          <div className="font-mono text-[12px] font-medium tracking-wider text-[#1f1f1f] uppercase">{brandName || "Workspace"}</div>
          <div className="text-[11px] text-[#888888] mt-px">Branditect Workspace</div>
        </div>
      </div>

      <NavSection label="" items={dashboardItems} pathname={pathname} />

      <div className="h-px bg-[#D0D3DA] mx-3" />

      <NavSection label="Create" items={createItems} pathname={pathname} />

      <div className="h-px bg-[#D0D3DA] mx-3" />

      <NavSection label="Brand Library" items={libraryItems} pathname={pathname} />

      <div className="h-px bg-[#D0D3DA] mx-3" />

      <NavSection label="Brand Tools" items={toolItems} pathname={pathname} />

      {/* User */}
      <div className="mt-auto p-3 border-t border-[#D0D3DA]">
        <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="w-6 h-6 rounded-full bg-[#FEF0EB] border border-[#F8C9B3] flex items-center justify-center font-semibold text-[11px] text-[#E8562A] shrink-0">
            S
          </div>
          <div>
            <div className="text-[12px] font-medium text-[#1f1f1f]">Saara Muuari</div>
            <div className="text-[11px] text-[#888888]">Admin</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
