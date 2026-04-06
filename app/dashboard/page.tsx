"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useBrand } from "@/lib/useBrand";

const quickChips = [
  "Weekly newsletter",
  "3 Instagram posts",
  "StreamerX launch page",
  "Sales deck for partnership",
  "Anti-corporate ad copy",
  "Creator onboarding copy",
];

const outputCards = [
  { icon: "✉", label: "HTML", title: "Newsletter", desc: "Written in your brand voice, built as ready-to-send HTML for Klaviyo" },
  { icon: "🌐", label: "HTML", title: "Campaign Page", desc: "Landing page in your brand style — deploy in an hour" },
  { icon: "◈", label: "Deck", title: "Presentation", desc: "Bespoke pitch in your brand for any room or meeting" },
  { icon: "⊡", label: "Posts", title: "Social Content", desc: "On-brand posts for Instagram, Twitter, LinkedIn" },
];

const recentOutputs = [
  { icon: "✉", title: "April Newsletter — StreamerX Partnership Announcement", meta: "Today, 09:14", tag: "Newsletter" },
  { icon: "⊡", title: "5 Instagram Posts — Anti-Corporate Campaign Week 3", meta: "Yesterday, 16:32", tag: "Social" },
  { icon: "◈", title: "Creator Partner Deck — Series A Investor Overview", meta: "29 Mar", tag: "Deck" },
  { icon: "🌐", title: "StreamerX Creator Partner Landing Page", meta: "27 Mar", tag: "HTML Page" },
];

const pulseItems = [
  { color: "bg-green-500", text: "Phase 2 — YouTube & Podcasts expansion", date: "Q3 2026 launch" },
  { color: "bg-brand-orange", text: "StreamerX creator partnership going live", date: "April 5, 2026" },
  { color: "bg-amber-500", text: "Free Twitch sub mechanic — NDA, do not publish", date: "Hold until Apr 1" },
];

const coherenceRows = [
  { label: "Voice", value: 96 },
  { label: "Visual", value: 88 },
  { label: "Messaging", value: 94 },
  { label: "Financial", value: 82 },
];

export default function DashboardPage() {
  const router = useRouter();
  const { brandName } = useBrand();

  // Check if user has completed onboarding
  useEffect(() => {
    async function checkOnboarding() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: brands } = await supabase
        .from('brands')
        .select('brand_id')
        .eq('user_id', user.id)
        .eq('onboarding_completed', true)
        .limit(1);

      if (!brands || brands.length === 0) {
        router.push('/onboarding');
        return;
      }
    }
    checkOnboarding();
  }, [router]);

  function handleQuickCreate(text: string) {
    router.push(`/dashboard/create?brief=${encodeURIComponent(text)}`);
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-light flex items-end justify-between">
        <div>
          <h1 className="font-semibold text-[clamp(1.5rem,3vw,2rem)] text-ink tracking-tight leading-tight mb-1">
            Good morning, <em className="text-brand-orange">Saara.</em>
          </h1>
          <p className="font-mono text-[0.62rem] text-muted tracking-wider">
            Tuesday, 1 April 2026 · {brandName} · Let&apos;s build your brand today
          </p>
        </div>
      </div>

      {/* Quick Create Bar */}
      <div className="mx-8 mt-6 bg-pale border border-light rounded-lg p-5">
        <div className="font-mono text-[0.58rem] tracking-[0.12em] uppercase text-muted mb-3">
          Quick Create — {brandName}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3.5">
          {quickChips.map((chip) => (
            <button
              key={chip}
              onClick={() => handleQuickCreate(chip)}
              className="px-3 py-[5px] bg-white border border-light rounded-full text-[0.75rem] text-mid hover:bg-brand-orange-pale hover:border-brand-orange-mid hover:text-brand-orange transition-all"
            >
              {chip}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            id="quickInput"
            type="text"
            placeholder={`What does ${brandName} need today?`}
            className="flex-1 bg-white border border-light rounded-[5px] py-[9px] px-3.5 text-ink font-light text-[0.84rem] outline-none focus:border-brand-orange placeholder:text-muted"
          />
          <button
            onClick={() => {
              const el = document.getElementById("quickInput") as HTMLInputElement;
              if (el?.value) handleQuickCreate(el.value);
            }}
            className="px-5 py-[9px] bg-brand-orange text-white rounded-[5px] font-medium text-[0.8rem] hover:bg-brand-orange-hover transition-all whitespace-nowrap"
          >
            Create →
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-8 py-6 grid grid-cols-[1fr_280px] gap-6 flex-1">
        {/* Left column */}
        <div>
          {/* Output type cards */}
          <div className="fade-in mb-6">
            <div className="flex items-center justify-between mb-3.5">
              <span className="font-mono text-[0.6rem] tracking-[0.12em] uppercase text-muted">Create</span>
              <span className="text-[0.72rem] text-brand-orange cursor-pointer">All outputs →</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {outputCards.map((card) => (
                <Link
                  key={card.title}
                  href="/dashboard/create"
                  className="group bg-white border border-light rounded-[7px] p-4 pb-3.5 relative hover:border-brand-orange hover:shadow-[0_1px_8px_rgba(232,86,42,0.08)] transition-all"
                >
                  <span className="font-mono text-[0.55rem] tracking-wider uppercase text-muted absolute top-2.5 right-2.5">
                    {card.label}
                  </span>
                  <span className="text-[1.1rem] block mb-2">{card.icon}</span>
                  <div className="font-semibold text-[0.95rem] text-ink mb-[3px] leading-tight">{card.title}</div>
                  <div className="text-[0.72rem] text-muted leading-relaxed">{card.desc}</div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Outputs */}
          <div className="fade-in">
            <div className="flex items-center justify-between mb-3.5">
              <span className="font-mono text-[0.6rem] tracking-[0.12em] uppercase text-muted">Recent Outputs</span>
              <span className="text-[0.72rem] text-brand-orange cursor-pointer">View all →</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {recentOutputs.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 py-[9px] px-3 bg-pale border border-light rounded-md cursor-pointer hover:bg-white hover:border-muted transition-all"
                >
                  <div className="w-[26px] h-[26px] bg-white border border-light rounded flex items-center justify-center text-[0.78rem] shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.78rem] text-ink truncate">{item.title}</div>
                    <div className="font-mono text-[0.57rem] text-muted tracking-wide mt-px">{item.meta}</div>
                  </div>
                  <span className="font-mono text-[0.54rem] tracking-wider uppercase text-brand-orange bg-brand-orange-pale border border-brand-orange-mid px-1.5 py-[2px] rounded-[3px] whitespace-nowrap shrink-0">
                    {item.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Financial Flag */}
          <div className="fade-in bg-brand-orange-pale border border-brand-orange-mid rounded-lg p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[0.85rem]">⚠</span>
              <span className="font-mono text-[0.58rem] tracking-wider uppercase text-brand-orange">Financial Flag</span>
            </div>
            <p className="text-[0.75rem] text-dark leading-relaxed mb-3">
              Proposed 35% off Starter Plan drops margin to 18% — below your 25% floor. Review before publishing.
            </p>
            <button className="px-3.5 py-[5px] bg-brand-orange text-white rounded font-medium text-[0.72rem]">
              Review
            </button>
          </div>

          {/* Business Pulse */}
          <div className="fade-in bg-white border border-light rounded-lg overflow-hidden">
            <div className="px-4 py-3.5 border-b border-light flex items-center justify-between">
              <span className="font-semibold text-[0.88rem] text-ink">Business Pulse</span>
              <span className="font-mono text-[0.58rem] text-brand-orange bg-brand-orange-pale border border-brand-orange-mid px-[7px] py-[2px] rounded-[3px]">
                3 Active
              </span>
            </div>
            <div className="p-4">
              {pulseItems.map((item, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${i < pulseItems.length - 1 ? "mb-3 pb-3 border-b border-pale" : ""}`}
                >
                  <div className={`w-[5px] h-[5px] rounded-full mt-1.5 shrink-0 ${item.color}`} />
                  <div>
                    <div className="text-[0.75rem] text-mid leading-relaxed">{item.text}</div>
                    <div className="font-mono text-[0.57rem] text-muted mt-[2px]">{item.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Brand Coherence */}
          <div className="fade-in bg-white border border-light rounded-lg overflow-hidden">
            <div className="px-4 py-3.5 border-b border-light flex items-center justify-between">
              <span className="font-semibold text-[0.88rem] text-ink">Brand Coherence</span>
              <span className="font-semibold text-[1.25rem] text-brand-orange">91%</span>
            </div>
            <div className="p-4">
              {coherenceRows.map((row) => (
                <div key={row.label} className="flex items-center gap-2.5 mb-2.5 last:mb-0">
                  <span className="text-[0.7rem] text-muted w-[72px] shrink-0">{row.label}</span>
                  <div className="flex-1 h-1 bg-light rounded-sm overflow-hidden">
                    <div className="h-full bg-brand-orange rounded-sm" style={{ width: `${row.value}%` }} />
                  </div>
                  <span className="font-mono text-[0.6rem] text-muted w-7 text-right shrink-0">{row.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
