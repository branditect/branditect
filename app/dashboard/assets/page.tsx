"use client";

import { useState } from "react";
import ImageLibrary from "@/components/image-library";
import FileLibrary from "@/components/file-library";

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
        <h1 className="font-display text-[1.75rem] text-ink tracking-tight mb-1">Brand Assets</h1>
        <p className="text-[0.78rem] text-muted">Access and manage all of Vetra&apos;s brand assets in one place.</p>
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
              <div className={`font-medium text-[0.82rem] mb-0.5 ${activeType === type.key ? "text-brand-orange" : "text-ink"}`}>
                {type.label}
              </div>
              <div className="font-mono text-[0.55rem] text-muted leading-relaxed">{type.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {activeType === "images" && <ImageLibrary />}

        {activeType === "videos" && (
          <FileLibrary
            category="video"
            accept=".mp4,.mov,.webm,.avi"
            acceptLabel="MP4, MOV, WEBM, AVI"
            maxSize={100}
            icon="🎬"
            emptyMessage="No videos uploaded yet. Drop video files above to get started."
            previewType="video"
          />
        )}

        {activeType === "sounds" && (
          <FileLibrary
            category="audio"
            accept=".mp3,.wav,.aac,.ogg,.m4a"
            acceptLabel="MP3, WAV, AAC, OGG, M4A"
            maxSize={50}
            icon="🎵"
            emptyMessage="No audio files yet. Upload audio logos, jingles, or podcast clips."
            previewType="audio"
          />
        )}

        {activeType === "graphics" && (
          <FileLibrary
            category="graphic"
            accept=".svg,.png,.ai,.eps,.pdf,.psd"
            acceptLabel="SVG, PNG, AI, EPS, PDF, PSD"
            maxSize={50}
            icon="✦"
            emptyMessage="No graphics yet. Upload logos, icons, illustrations, and vectors."
            previewType="image"
          />
        )}

        {activeType === "web" && (
          <FileLibrary
            category="web"
            accept=".png,.jpg,.jpeg,.webp,.svg,.pdf,.fig"
            acceptLabel="PNG, JPG, WEBP, SVG, PDF, FIG"
            maxSize={20}
            icon="🌐"
            emptyMessage="No website or app assets yet. Upload screenshots, wireframes, and UI references."
            previewType="image"
          />
        )}
      </div>
    </div>
  );
}
