"use client";

import { useState } from "react";
import ImageLibrary from "@/components/image-library";
import FileLibrary from "@/components/file-library";
import { useBrand } from "@/lib/useBrand";
import { TYPE_TABS } from "@/lib/media-categories";

/* The tabs and the category each one writes come from one list. They used to
   be two: a list for the buttons and a category= prop per panel, which could
   disagree without anything noticing — and a tab writing a value the CHECK
   constraint refuses fails at the database, which reads to the person as the
   file simply not appearing. */
const assetTypes = TYPE_TABS;

export default function AssetsPage() {
  const [activeType, setActiveType] = useState("images");
  const { brandId, brandName } = useBrand();

  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Header */}
      <div className="px-8 pt-8 pb-5 border-b border-light">
        <h1 className="font-semibold text-[1.75rem] text-ink tracking-tight mb-1">Brand Assets</h1>
        <p className="text-[0.78rem] text-muted">Access and manage all of {brandName}&apos;s brand assets in one place.</p>
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
        {activeType === "images" && <ImageLibrary brandId={brandId} />}

        {/* Every panel is driven by the same row that drew its button, so the
            category a tab WRITES cannot drift from the category it claims. It
            could before: the buttons came from this list and each panel passed
            its own hardcoded category= prop, which is how a tab ends up
            writing a value the CHECK constraint refuses. */}
        {assetTypes
          .filter((t) => t.key !== "images" && t.key === activeType)
          .map((t) => (
            <FileLibrary
              key={t.key}
              brandId={brandId}
              category={t.category}
              accept={t.accept}
              acceptLabel={t.acceptLabel}
              maxSize={t.maxSize}
              icon={t.icon}
              emptyMessage={t.emptyMessage}
              previewType={t.previewType}
            />
          ))}
      </div>
    </div>
  );
}
