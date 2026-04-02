"use client";

import { useState } from "react";
import ImageLibrary from "@/components/image-library";

const assetTypes = [
  { key: "images", label: "Images", icon: "🖼", desc: "Photos, screenshots, brand imagery" },
  { key: "videos", label: "Videos", icon: "🎬", desc: "Brand videos, reels, ads" },
  { key: "sounds", label: "Sounds", icon: "🎵", desc: "Audio logos, jingles, podcasts" },
  { key: "graphics", label: "Graphics", icon: "✦", desc: "Logos, icons, illustrations, vectors" },
  { key: "web", label: "Website / App", icon: "🌐", desc: "Screenshots, wireframes, UI components" },
];

export default function AssetsPage() {
  const [activeType, setActiveType] = useState("images");

  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Header */}
      <div className="px-8 pt-8 pb-5 border-b border-light">
        <h1 className="font-display text-[1.75rem] text-ink tracking-tight mb-1">
          Brand Assets
        </h1>
        <p className="text-[0.78rem] text-muted">
          Access and manage all of Vetra&apos;s brand assets in one place.
        </p>
      </div>

      {/* Asset type cards */}
      <div className="px-8 py-5 border-b border-light">
        <div className="grid grid-cols-5 gap-3">
          {assetTypes.map((type) => (
            <button
              key={type.key}
              onClick={() => setActiveType(type.key)}
              className={`text-left rounded-lg border p-4 transition-all ${
                activeType === type.key
                  ? "border-brand-orange bg-brand-orange-pale/50"
                  : "border-light bg-white hover:border-brand-orange/30 hover:bg-brand-orange-pale/20"
              }`}
            >
              <span className="text-xl block mb-2">{type.icon}</span>
              <div className={`font-medium text-[0.82rem] mb-0.5 ${
                activeType === type.key ? "text-brand-orange" : "text-ink"
              }`}>
                {type.label}
              </div>
              <div className="font-mono text-[0.55rem] text-muted leading-relaxed">
                {type.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {activeType === "images" && <ImageLibrary />}

        {activeType === "videos" && (
          <div className="text-center py-16">
            <span className="text-4xl block mb-3">🎬</span>
            <h3 className="font-display text-lg text-ink mb-1">Videos</h3>
            <p className="text-[0.78rem] text-muted max-w-sm mx-auto">
              Upload and manage brand videos, social reels, and ad content. Coming soon.
            </p>
          </div>
        )}

        {activeType === "sounds" && (
          <div className="text-center py-16">
            <span className="text-4xl block mb-3">🎵</span>
            <h3 className="font-display text-lg text-ink mb-1">Sounds</h3>
            <p className="text-[0.78rem] text-muted max-w-sm mx-auto">
              Store audio logos, jingles, podcast intros, and sound assets. Coming soon.
            </p>
          </div>
        )}

        {activeType === "graphics" && (
          <div className="text-center py-16">
            <span className="text-4xl block mb-3">✦</span>
            <h3 className="font-display text-lg text-ink mb-1">Graphics</h3>
            <p className="text-[0.78rem] text-muted max-w-sm mx-auto">
              Manage logos, icons, illustrations, and vector assets. Coming soon.
            </p>
          </div>
        )}

        {activeType === "web" && (
          <div className="text-center py-16">
            <span className="text-4xl block mb-3">🌐</span>
            <h3 className="font-display text-lg text-ink mb-1">Website / App</h3>
            <p className="text-[0.78rem] text-muted max-w-sm mx-auto">
              Store website screenshots, app UI screenshots, wireframes, and UI component references. Coming soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
