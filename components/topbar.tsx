"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useBrand, clearBrandCache } from "@/lib/useBrand";

const tabs = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Create", href: "/dashboard/create" },
  { label: "Brand Library", href: "/dashboard/brand-library" },
  { label: "Brand Bases", href: "/dashboard/brand-bases" },
  { label: "Meta Insights", href: "/dashboard/meta-insights" },
];

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { brand, brandName } = useBrand();

  async function handleLogout() {
    clearBrandCache();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="h-topbar bg-white border-b border-[#D0D3DA] flex items-center px-6 shrink-0 z-50">
      {/* Branditect wordmark */}
      <span className="font-semibold text-[1.15rem] text-[#E8562A] tracking-tight shrink-0">
        Branditect
      </span>

      {/* "for" + brand name */}
      {brandName && (
        <>
          <span className="text-[12px] text-[#888888] font-light px-2 shrink-0">
            for
          </span>
          <div className="flex items-center gap-[5px] bg-[#F2F1EE] border border-[#D0D3DA] rounded px-2.5 py-[3px] shrink-0">
            {brand?.logo_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={brand.logo_url} alt="" className="w-4 h-4 object-contain" />
            )}
            <span className="font-mono text-[11px] font-medium tracking-wider text-[#1f1f1f] uppercase">
              {brandName}
            </span>
          </div>
        </>
      )}

      {/* Divider */}
      <div className="w-px h-[18px] bg-[#D0D3DA] mx-5 shrink-0" />

      {/* Nav tabs */}
      <nav className="flex flex-1 gap-0">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`h-topbar flex items-center px-4 text-[13px] border-b-2 -mb-px whitespace-nowrap transition-colors ${
                isActive
                  ? "text-[#E8562A] border-[#E8562A] font-medium"
                  : "text-[#666666] border-transparent hover:text-[#1f1f1f]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* Right */}
      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={handleLogout}
          className="bg-transparent text-[#444444] border border-[#D0D3DA] font-medium text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Log out
        </button>
        <Link
          href="/dashboard/create"
          className="bg-[#E8562A] text-white font-medium text-sm px-4 py-2 rounded-lg hover:bg-[#d14a22] transition-colors flex items-center border-none"
        >
          + Create
        </Link>
        <div className="w-7 h-7 rounded-full bg-[#FEF0EB] border border-[#F8C9B3] flex items-center justify-center font-semibold text-[12px] text-[#E8562A] cursor-pointer ml-0.5">
          SM
        </div>
      </div>
    </header>
  );
}
