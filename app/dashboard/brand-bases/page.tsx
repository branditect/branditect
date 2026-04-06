"use client";

import { useBrand } from "@/lib/useBrand";

const basesTemplate = [
  {
    icon: "☰",
    title: "Brand Strategy",
    descTemplate: (name: string) => `Define ${name}'s purpose, positioning, values, and competitive landscape`,
    progress: 100,
  },
  {
    icon: "◷",
    title: "Tone of Voice",
    descTemplate: (name: string) => `Establish how ${name} communicates — the BrandTone™ Architect output`,
    progress: 100,
  },
  {
    icon: "◈",
    title: "Visual Identity",
    descTemplate: (name: string) => `Upload ${name}'s brand assets and visual guidelines`,
    progress: 80,
  },
  {
    icon: "⚡",
    title: "Business Pulse",
    descTemplate: () => "Goals, upcoming launches, sensitivities, financial rules",
    progress: 60,
  },
];

export default function BrandBasesPage() {
  const { brandName } = useBrand();

  const bases = basesTemplate.map((b) => ({
    ...b,
    desc: b.descTemplate(brandName),
  }));

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 text-center">
      {/* Icon */}
      <div className="w-16 h-16 bg-brand-orange-pale rounded-full flex items-center justify-center text-[1.75rem] mb-6">
        ◉
      </div>

      <h1 className="font-semibold text-[1.75rem] text-ink tracking-tight mb-2">
        Build Your Brand Foundation
      </h1>
      <p className="text-[0.84rem] text-muted max-w-[420px] leading-relaxed mb-10">
        Complete the following steps to set up {brandName}&apos;s brand foundation. This powers all AI-assisted content creation tailored to {brandName}&apos;s voice, strategy, and identity.
      </p>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-4 max-w-[620px] w-full mb-8 text-left">
        {bases.map((base) => (
          <div
            key={base.title}
            className="bg-white border border-light rounded-lg p-5 cursor-pointer hover:border-brand-orange hover:shadow-[0_1px_8px_rgba(232,86,42,0.08)] transition-all"
          >
            <div className="w-8 h-8 bg-brand-orange-pale rounded-md flex items-center justify-center text-[0.9rem] mb-3">
              {base.icon}
            </div>
            <div className="font-semibold text-[0.95rem] text-ink mb-1">{base.title}</div>
            <div className="text-[0.73rem] text-muted leading-relaxed mb-3.5">{base.desc}</div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.58rem] text-muted">Progress</span>
              <span className="font-mono text-[0.6rem] text-brand-orange">{base.progress}%</span>
            </div>
            <div className="h-[3px] bg-light rounded-sm mt-1.5 overflow-hidden">
              <div
                className="h-full bg-brand-orange rounded-sm"
                style={{ width: `${base.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <button className="px-10 py-3.5 bg-brand-orange text-white rounded-md font-medium text-[0.88rem] hover:bg-brand-orange-hover transition-all">
        Continue Setup →
      </button>
    </div>
  );
}
