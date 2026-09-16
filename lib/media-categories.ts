/**
 * The values `brand_images.category` accepts, in one place.
 *
 * Step 1 of branditect-ui/spec/knowledge-images.md. The spec expected four of
 * the five type tabs to reject every upload: the page passes `video`, `audio`,
 * `graphic` and `web` into `brand_images.category`, and no migration in
 * `supabase/` widens the six-value CHECK constraint to include them.
 *
 * Probed against the live database on 2026-09-03 before writing anything. All
 * ten values insert, and a nonsense value is still rejected by
 * `brand_images_category_check` — so the constraint exists and had already been
 * widened by hand, outside the migration files. The bug does not reproduce and
 * no migration was run. See supabase/brand-images-categories.sql.
 *
 * What remains is that nothing stopped it, and nothing would stop the next one:
 * a sixth tab added with a value the constraint does not know would fail the
 * same way, silently, at the database. That is what the test on this file is
 * for.
 */

import type { StringKey } from "./i18n/index.ts";

/** The six the original table declared. Live rows use these. */
export const ORIGINAL_CATEGORIES = [
  "social", "event", "product", "campaign", "brand", "ai-generated",
] as const;

/** The four the media type tabs added. Confirmed live, not assumed. */
export const MEDIA_CATEGORIES = ["video", "audio", "graphic", "web"] as const;

export const ALLOWED_CATEGORIES: readonly string[] = [
  ...ORIGINAL_CATEGORIES, ...MEDIA_CATEGORIES,
];

/**
 * Every type tab on Knowledge, and the category each one writes. The page held
 * these as loose strings in two places — a list for the buttons and a
 * `category=` prop per panel — so the two could disagree without anything
 * noticing.
 */
export const TYPE_TABS = [
  // Copy is keys: `labelKey`, `descKey`, and `emptyMessage`, which names a key
  // too (the images tab has its own empty state in ImageLibrary). Everything
  // else is identity or technical and stays as it is.
  { key: "images", labelKey: "nav.knowledge.images", icon: "IMG", category: "product",
    descKey: "mediaTabs.imagesDesc",
    accept: "", acceptLabel: "", maxSize: 0, previewType: "image", emptyMessage: null },
  { key: "videos", labelKey: "mediaTabs.videos", icon: "VID", category: "video",
    descKey: "mediaTabs.videosDesc",
    accept: ".mp4,.mov,.webm,.avi", acceptLabel: "MP4, MOV, WEBM, AVI", maxSize: 100,
    previewType: "video",
    emptyMessage: "mediaTabs.videosEmpty" },
  { key: "sounds", labelKey: "mediaTabs.sounds", icon: "SND", category: "audio",
    descKey: "mediaTabs.soundsDesc",
    accept: ".mp3,.wav,.aac,.ogg,.m4a", acceptLabel: "MP3, WAV, AAC, OGG, M4A", maxSize: 50,
    previewType: "audio",
    emptyMessage: "mediaTabs.soundsEmpty" },
  { key: "graphics", labelKey: "mediaTabs.graphics", icon: "GFX", category: "graphic",
    descKey: "mediaTabs.graphicsDesc",
    accept: ".svg,.png,.ai,.eps,.pdf,.psd", acceptLabel: "SVG, PNG, AI, EPS, PDF, PSD", maxSize: 50,
    previewType: "image",
    emptyMessage: "mediaTabs.graphicsEmpty" },
  { key: "web", labelKey: "mediaTabs.web", icon: "WEB", category: "web",
    descKey: "mediaTabs.webDesc",
    accept: ".png,.jpg,.jpeg,.webp,.svg,.pdf,.fig", acceptLabel: "PNG, JPG, WEBP, SVG, PDF, FIG",
    maxSize: 20, previewType: "image",
    emptyMessage: "mediaTabs.webEmpty" },
] as const satisfies readonly {
  key: string; labelKey: StringKey; descKey: StringKey; emptyMessage: StringKey | null;
  icon: string; category: string; accept: string; acceptLabel: string; maxSize: number; previewType: string;
}[];

export function isAllowedCategory(category: string): boolean {
  return ALLOWED_CATEGORIES.includes(category);
}

/**
 * The categories a tab can write that the database would refuse. Empty is the
 * only acceptable answer; anything else is an upload that fails at the
 * constraint, which reads to the person as the file simply not appearing.
 */
export function unwritableTabs(): { key: string; category: string }[] {
  return TYPE_TABS
    .filter((t) => !isAllowedCategory(t.category))
    .map((t) => ({ key: t.key, category: t.category }));
}
