import type { IconName } from "@/components/icon";
import type { StringKey } from "@/lib/i18n/en";

/**
 * The navigation. Six primary items, max depth 3, no dead entries.
 *
 * Read it top to bottom and you get the pitch: Define → Feed → Make.
 * Adding a seventh primary item means something else merges or leaves.
 */

/**
 * `label` is the English name and the item's identity — the sidebar keys its
 * open/closed state on it and the nav tests read it. `key` is what the screen
 * renders. They are kept apart on purpose: a translated label would make the
 * open-menu state depend on the interface language, and would make every nav
 * assertion in the suite locale-dependent.
 */
export interface NavChild {
  label: string;
  key: StringKey;
  href: string;
}

export interface NavItem {
  label: string;
  key: StringKey;
  href: string;
  icon: IconName;
  children?: NavChild[];
}

export const NAV: NavItem[] = [
  { label: "Home", key: "nav.home", href: "/home", icon: "home" },
  {
    label: "Brand",
    key: "nav.brand",
    href: "/brand",
    icon: "brand",
    children: [
      { label: "Strategy", key: "nav.brand.strategy", href: "/brand/strategy" },
      { label: "Tone of voice", key: "nav.brand.tone", href: "/brand/tone-of-voice" },
      { label: "Visual identity", key: "nav.brand.visual", href: "/brand/visual-identity" },
      { label: "Channels", key: "nav.brand.channels", href: "/brand/channels" },
    ],
  },
  {
    label: "Knowledge",
    key: "nav.knowledge",
    href: "/knowledge",
    icon: "know",
    children: [
      { label: "Products", key: "nav.knowledge.products", href: "/knowledge/products" },
      { label: "Documents", key: "nav.knowledge.documents", href: "/knowledge/documents" },
      { label: "Images", key: "nav.knowledge.images", href: "/knowledge/images" },
      { label: "Presentations", key: "nav.knowledge.presentations", href: "/knowledge/presentations" },
      { label: "Links", key: "nav.knowledge.links", href: "/knowledge/links" },
    ],
  },
  {
    label: "Studio",
    key: "nav.studio",
    href: "/studio",
    icon: "studio",
    children: [
      { label: "Write", key: "nav.studio.write", href: "/studio/write" },
      { label: "Create images", key: "nav.studio.createImages", href: "/studio/create-images" },
      { label: "Notes", key: "nav.studio.notes", href: "/studio/notes" },
    ],
  },
  // No children: /numbers is a real landing page that already lists every
  // calculator as a card, so a sub-menu would be the same links twice.
  { label: "Numbers", key: "nav.numbers", href: "/numbers", icon: "numbers" },
  { label: "AI Chat", key: "nav.chat", href: "/chat", icon: "chat" },
];

/** The nav section a path belongs to, so it can be expanded on load. */
export function sectionFor(pathname: string): string | null {
  const match = NAV.find(
    (item) =>
      item.children?.some((c) => pathname.startsWith(c.href)) ||
      (item.children && pathname.startsWith(item.href)),
  );
  return match?.label ?? null;
}
