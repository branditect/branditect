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
  { key: "images", label: "Images", icon: "IMG", category: "product",
    desc: "Photos, screenshots, brand imagery" },
  { key: "videos", label: "Videos", icon: "VID", category: "video",
    desc: "Brand videos, reels, ads" },
  { key: "sounds", label: "Sounds", icon: "SND", category: "audio",
    desc: "Audio logos, jingles, podcasts" },
  { key: "graphics", label: "Graphics", icon: "GFX", category: "graphic",
    desc: "Logos, icons, illustrations, vectors" },
  { key: "web", label: "Website / App", icon: "WEB", category: "web",
    desc: "Screenshots, wireframes, UI components" },
] as const;

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
