"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="h-topbar bg-white border-b border-light flex items-center px-6 shrink-0 z-50">
      {/* Branditect wordmark */}
      <span className="font-display text-[1.15rem] text-brand-orange tracking-tight shrink-0">
        Branditect
      </span>

      {/* "for" */}
      <span className="text-[0.72rem] text-muted font-light px-2 shrink-0">
        for
      </span>

      {/* Vetra co-brand pill */}
      <div className="flex items-center gap-[5px] bg-vetra-black rounded px-2 py-[3px] shrink-0">
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
          <path d="M1 1L7 9L13 1" stroke="#C8F135" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="font-mono text-[0.68rem] font-medium tracking-wider text-vetra-lime">
          VETRA
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-[18px] bg-light mx-5 shrink-0" />

      {/* Nav tabs */}
      <nav className="flex flex-1 gap-0">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`h-topbar flex items-center px-4 text-[0.8rem] border-b-2 -mb-px whitespace-nowrap transition-all ${
                isActive
                  ? "text-brand-orange border-brand-orange font-medium"
                  : "text-muted border-transparent hover:text-ink"
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
          className="h-[30px] px-3.5 rounded border border-light bg-transparent text-[0.78rem] text-mid hover:border-muted hover:text-ink transition-all"
        >
          Log out
        </button>
        <Link
          href="/dashboard/create"
          className="h-[30px] px-3.5 rounded bg-brand-orange text-white text-[0.78rem] font-medium hover:bg-brand-orange-hover transition-all flex items-center"
        >
          + Create
        </Link>
        <div className="w-7 h-7 rounded-full bg-brand-orange-pale border border-brand-orange-mid flex items-center justify-center font-display text-[0.75rem] text-brand-orange cursor-pointer ml-0.5">
          SM
        </div>
      </div>
    </header>
  );
}
