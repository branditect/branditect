"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { IMAGE_SEARCH_COLUMNS, imageMatches } from "@/lib/product-attachments";
import Icon from "@/components/icon";

interface BrandImage {
  id: string;
  file_url: string;
  file_name: string;
  category: string;
  /* Without these the search box could not match a tag, while the box two
     screens away could. Same-looking control, different behaviour. */
  tags: string[] | null;
  campaign_name: string | null;
}

/**
 * Pick a product shot from the brand's image library.
 *
 * Reads brand_images directly rather than duplicating an uploader — Knowledge
 * ▸ Images is the one home for images, and this is a chooser, not a second
 * place to put files.
 */
export default function ImagePicker({
  brandId,
  currentUrl,
  onPick,
  onClose,
}: {
  brandId: string;
  currentUrl: string | null;
  onPick: (url: string | null) => void;
  onClose: () => void;
}) {
  const [images, setImages] = useState<BrandImage[] | null>(null);
  const [query, setQuery] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab" && dialogRef.current) {
        const f = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
        );
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("brand_images")
      .select(IMAGE_SEARCH_COLUMNS)
      .eq("brand_id", brandId)
      .order("uploaded_at", { ascending: false })
      .then(({ data }) => {
        if (!cancelled) setImages((data as BrandImage[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [brandId]);

  // The same match the library uses, from one place, so the two boxes cannot
  // drift apart again.
  const shown = (images ?? []).filter((i) => imageMatches(i, query));

  return (
    <div
      className="fixed inset-0 z-[1200] grid place-items-center bg-ink/25 p-8 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Choose a product image"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-[720px] flex-col overflow-hidden rounded-panel border border-rule bg-card shadow-[0_24px_60px_-20px_rgba(20,20,26,.35)]"
      >
        <div className="flex items-center gap-3 border-b border-rule px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-h3 font-bold">Choose a product image</h2>
            <p className="mt-0.5 text-xs font-normal text-muted-2">
              From your image library. This is the shot the image creator reads as a reference.
            </p>
          </div>
          <label className="ml-auto flex h-9 w-[190px] items-center gap-2 rounded-tile border border-rule-2 px-3 focus-within:border-accent-line">
            <span className="shrink-0 text-faint">
              <Icon name="search" size={14} />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search images…"
              aria-label="Search images"
              className="w-full border-0 bg-transparent p-0 text-sm text-ink placeholder:text-faint focus:outline-none"
            />
          </label>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-tile hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Icon name="close" size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {images === null && <p className="text-sm text-muted">Loading your images…</p>}

          {images !== null && images.length === 0 && (
            <div className="rounded-card border border-rule bg-tile p-6 text-center">
              <p className="text-sm font-semibold text-ink">No images in your library yet</p>
              <p className="mx-auto mt-1.5 max-w-[46ch] text-xs font-medium leading-[1.6] text-muted">
                Product shots live in Knowledge ▸ Images so the image creator can read them. Upload
                some there and they&apos;ll appear here.
              </p>
              <Link
                href="/knowledge/images"
                className="mt-4 inline-block rounded-tile bg-grad-mark px-4 py-2.5 text-sm font-bold text-white"
              >
                Go to Images
              </Link>
            </div>
          )}

          {images !== null && images.length > 0 && shown.length === 0 && (
            <p className="text-sm text-muted">
              No images match “{query}”.{" "}
              <button type="button" onClick={() => setQuery("")} className="text-accent underline">
                Clear
              </button>
            </p>
          )}

          {shown.length > 0 && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-3">
              {shown.map((img) => {
                const active = img.file_url === currentUrl;
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => {
                      onPick(img.file_url);
                      onClose();
                    }}
                    aria-pressed={active}
                    className={`group overflow-hidden rounded-card border text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      active ? "border-accent ring-2 ring-accent-line" : "border-rule hover:border-accent-line"
                    }`}
                  >
                    <span className="block aspect-square overflow-hidden bg-tile">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.file_url}
                        alt={img.file_name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-[1.03] motion-reduce:transition-none"
                      />
                    </span>
                    <span className="block truncate px-2.5 py-2 text-2xs font-semibold text-ink-2">
                      {img.file_name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 border-t border-rule px-5 py-3.5">
          {currentUrl && (
            <button
              type="button"
              onClick={() => {
                onPick(null);
                onClose();
              }}
              className="rounded-tile border border-rule-2 px-3.5 py-2.5 text-sm font-semibold text-ink-2 hover:bg-tile"
            >
              Remove image
            </button>
          )}
          <Link
            href="/knowledge/images"
            className="ml-auto text-xs font-semibold text-accent underline underline-offset-2"
          >
            Manage images in Knowledge →
          </Link>
        </div>
      </div>
    </div>
  );
}
