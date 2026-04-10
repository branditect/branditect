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
    <header className="h-topbar bg-surface-lowest flex items-center px-6 shrink-0 z-50 ambient-shadow-sm">
      <span className="font-headline font-bold text-[16px] text-primary tracking-tight shrink-0">
        Branditect
      </span>

      {brandName && (
        <>
          <span className="text-[12px] text-outline px-2.5 shrink-0">for</span>
          <div className="flex items-center gap-1.5 bg-surface-low rounded-lg px-2.5 py-1 shrink-0">
            {brand?.logo_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={brand.logo_url} alt="" className="w-4 h-4 object-contain" />
            )}
            <span className="font-headline text-[11px] font-bold tracking-wider text-on-surface uppercase">
              {brandName}
            </span>
          </div>
        </>
      )}

      <div className="w-px h-4 bg-surface-high mx-5 shrink-0" />

      <nav className="flex flex-1 gap-0">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`h-topbar flex items-center px-4 text-[13px] font-body border-b-2 -mb-px whitespace-nowrap transition-colors ${
                isActive
                  ? "text-primary border-primary font-semibold"
                  : "text-outline border-transparent hover:text-on-surface"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2.5 ml-auto">
        <button
          onClick={handleLogout}
          className="text-on-surface-variant font-body font-medium text-[13px] px-4 py-1.5 rounded-lg hover:bg-surface-low transition-colors bg-transparent border-0"
        >
          Log out
        </button>
        <Link
          href="/dashboard/create"
          className="signature-gradient text-white font-headline font-bold text-[13px] px-5 py-2 rounded-lg flex items-center border-0 no-underline ambient-shadow-sm"
        >
          + Create
        </Link>
        <div className="w-7 h-7 rounded-full signature-gradient flex items-center justify-center font-bold text-[10px] text-white cursor-pointer ml-0.5">
          SM
        </div>
      </div>
    </header>
  );
}
