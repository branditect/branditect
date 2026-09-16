"use client";

import { useBrand } from "@/lib/useBrand";
import { useT } from "@/lib/i18n/use-t.tsx";
import type { StringKey } from "@/lib/i18n/index.ts";

// `title` stays English: it is the React key. `titleKey` and `descKey` are
// what renders; the description takes the brand name as {name}.
const basesTemplate: { icon: string; title: string; titleKey: StringKey; descKey: StringKey; progress: number }[] = [
  { icon: "☰", title: "Brand Strategy", titleKey: "channels.brandStrategy", descKey: "bases.strategyDesc", progress: 100 },
  { icon: "◷", title: "Tone of Voice", titleKey: "channels.toneOfVoice", descKey: "bases.toneDesc", progress: 100 },
  { icon: "◈", title: "Visual Identity", titleKey: "bases.visualIdentity", descKey: "bases.visualDesc", progress: 80 },
  { icon: "⚡", title: "Business Pulse", titleKey: "bases.businessPulse", descKey: "bases.pulseDesc", progress: 60 },
];

export default function BrandBasesPage() {
  const t = useT();
  const { brandName } = useBrand();

  const bases = basesTemplate.map((b) => ({
    ...b,
    desc: t(b.descKey, { name: brandName }),
  }));

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 text-center">
      {/* Icon */}
      <div className="w-16 h-16 bg-brand-orange-pale rounded-full flex items-center justify-center text-[1.75rem] mb-6">
        ◉
      </div>

      <h1 className="font-semibold text-[1.75rem] text-ink tracking-tight mb-2">
        {t("bases.title")}
      </h1>
      <p className="text-[0.84rem] text-muted max-w-[420px] leading-relaxed mb-10">
        {t("bases.intro", { brandName })}
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
            <div className="font-semibold text-[0.95rem] text-ink mb-1">{t(base.titleKey)}</div>
            <div className="text-[0.73rem] text-muted leading-relaxed mb-3.5">{base.desc}</div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.58rem] text-muted">{t("bases.progress")}</span>
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
        {t("bases.continue")}
      </button>
    </div>
  );
}
