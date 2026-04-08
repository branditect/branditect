"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useBrand, clearBrandCache } from "@/lib/useBrand";

const tabs = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Create", href: "/dashboard/create" },
  { label: "Brand Library", href: "/dashboard/brand-library" },
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
    <header className="h-topbar bg-white border-b border-[#C8C9CC] flex items-center px-6 shrink-0 z-50">
      <span className="font-semibold text-[16px] text-[#E16C00] tracking-tight shrink-0">
        Branditect
      </span>

      {brandName && (
        <>
          <span className="text-[12px] text-[#888888] px-2 shrink-0">for</span>
          <div className="flex items-center gap-[5px] bg-[#FFF0E6] border border-[#FFCAA7] rounded px-2.5 py-[3px] shrink-0">
            {brand?.logo_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={brand.logo_url} alt="" className="w-4 h-4 object-contain" />
            )}
            <span className="text-[11px] font-semibold tracking-wider text-[#E16C00] uppercase">
              {brandName}
            </span>
          </div>
        </>
      )}

      <div className="w-px h-[18px] bg-[#E2E3E6] mx-5 shrink-0" />

      <nav className="flex flex-1 gap-0">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`h-topbar flex items-center px-4 text-[13px] border-b-2 -mb-px whitespace-nowrap transition-colors ${
                isActive
                  ? "text-[#E16C00] border-[#E16C00] font-medium"
                  : "text-[#888888] border-transparent hover:text-[#555555]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={handleLogout}
          className="bg-transparent text-[#555555] border border-[#C8C9CC] font-medium text-[13px] px-4 py-1.5 rounded-lg hover:bg-[#F5F4F0] transition-colors"
        >
          Log out
        </button>
        <Link
          href="/dashboard/create"
          className="bg-[#E16C00] text-white font-medium text-[13px] px-4 py-1.5 rounded-lg hover:bg-[#C45C00] transition-colors flex items-center border-0"
        >
          + Create
        </Link>
        <div className="w-7 h-7 rounded-full bg-[#FFF0E6] border border-[#FFCAA7] flex items-center justify-center font-semibold text-[11px] text-[#E16C00] cursor-pointer ml-0.5">
          SM
        </div>
      </div>
    </header>
  );
}
