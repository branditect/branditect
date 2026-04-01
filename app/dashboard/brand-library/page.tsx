"use client";

import { useState } from "react";

const tabs = ["Visual", "Strategy", "Assets", "Voice & Tone", "Products", "Team"];

const colors = [
  { name: "Black", hex: "#0A0A0F", bg: "#0A0A0F" },
  { name: "Lime", hex: "#C8F135", bg: "#C8F135" },
  { name: "Purple", hex: "#7B5EA7", bg: "#7B5EA7" },
  { name: "Off White", hex: "#F2F0FA", bg: "#F2F0FA", border: true },
  { name: "Red", hex: "#FF4D6D", bg: "#FF4D6D" },
];

const fonts = [
  { sample: "Aa", sampleClass: "font-display italic", name: "Syne — Display", use: "Headings, hero text · Weight 700–800" },
  { sample: "Aa", sampleClass: "font-sans font-light", name: "DM Sans — Body", use: "Body copy, UI text · Weight 300–500" },
  { sample: "Aa", sampleClass: "font-mono", name: "DM Mono — Labels", use: "Tags, metadata, labels · Weight 300–500" },
];

const assets = [
  { icon: "🎨", name: "Logo — Primary", type: "SVG · PNG" },
  { icon: "◻", name: "Logo — White", type: "SVG · PNG" },
  { icon: "✉", name: "Newsletter Master", type: "HTML" },
  { icon: "◈", name: "Pitch Deck Master", type: "PPTX" },
  { icon: "🖼", name: "Brand Images", type: "12 images" },
  { icon: "✦", name: "AI Image Prompts", type: "8 prompts" },
  { icon: "⊡", name: "Social Templates", type: "IG · LinkedIn" },
];

export default function BrandLibraryPage() {
  const [activeTab, setActiveTab] = useState("Visual");

  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Header */}
      <div className="px-8 pt-7 pb-4 border-b border-light shrink-0">
        <h1 className="font-display text-2xl text-ink tracking-tight mb-1">Vetra Brand Library</h1>
        <p className="text-[0.78rem] text-muted">
          Everything Vetra knows about itself and everything it has created.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex px-8 border-b border-light bg-white">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2.5 mr-6 font-mono text-[0.6rem] tracking-[0.1em] uppercase border-b-2 -mb-px transition-all ${
              activeTab === tab
                ? "text-brand-orange border-brand-orange"
                : "text-muted border-transparent hover:text-ink"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 py-7">
        {/* Colors */}
        <div className="mb-9">
          <div className="font-mono text-[0.58rem] tracking-[0.12em] uppercase text-muted mb-3.5">
            Color Palette
          </div>
          <div className="flex gap-3.5 flex-wrap">
            {colors.map((c) => (
              <div key={c.hex} className="flex flex-col gap-[5px] cursor-pointer group">
                <div
                  className="w-[52px] h-[52px] rounded-[7px] group-hover:scale-105 transition-transform"
                  style={{
                    background: c.bg,
                    border: c.border ? "1px solid #E5E5E5" : "1px solid transparent",
                  }}
                />
                <div className="font-mono text-[0.55rem] text-muted">{c.name}</div>
                <div className="font-mono text-[0.58rem] text-ink font-medium">{c.hex}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Typography */}
        <div className="mb-9">
          <div className="font-mono text-[0.58rem] tracking-[0.12em] uppercase text-muted mb-3.5">
            Typography
          </div>
          {fonts.map((f) => (
            <div key={f.name} className="bg-white border border-light rounded-[7px] p-5 mb-2.5 flex items-center gap-6">
              <div className={`text-[2.2rem] leading-none text-ink min-w-[80px] ${f.sampleClass}`}>
                {f.sample}
              </div>
              <div>
                <div className="font-medium text-[0.82rem] text-ink mb-[2px]">{f.name}</div>
                <div className="font-mono text-[0.6rem] text-muted">{f.use}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Assets */}
        <div className="mb-9">
          <div className="font-mono text-[0.58rem] tracking-[0.12em] uppercase text-muted mb-3.5">
            Asset Library
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {assets.map((a) => (
              <div
                key={a.name}
                className="bg-white border border-light rounded-[7px] overflow-hidden cursor-pointer hover:border-brand-orange hover:shadow-[0_1px_8px_rgba(232,86,42,0.08)] transition-all"
              >
                <div className="h-[72px] bg-pale border-b border-light flex items-center justify-center text-2xl">
                  {a.icon}
                </div>
                <div className="p-2.5">
                  <div className="text-[0.73rem] text-ink mb-[2px] truncate">{a.name}</div>
                  <div className="font-mono text-[0.56rem] text-muted">{a.type}</div>
                </div>
              </div>
            ))}
            {/* Upload card */}
            <div className="border border-dashed border-light rounded-[7px] overflow-hidden opacity-50 cursor-pointer">
              <div className="h-[72px] flex items-center justify-center text-xl text-muted">+</div>
              <div className="p-2.5">
                <div className="text-[0.73rem] text-muted mb-[2px]">Upload asset</div>
                <div className="font-mono text-[0.56rem] text-muted">Any format</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
