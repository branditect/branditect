import type { IconName } from "@/components/icon";

/**
 * The navigation. Six primary items, max depth 3, no dead entries.
 *
 * Read it top to bottom and you get the pitch: Define → Feed → Make.
 * Adding a seventh primary item means something else merges or leaves.
 */

export interface NavChild {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  children?: NavChild[];
}

export const NAV: NavItem[] = [
  { label: "Home", href: "/home", icon: "home" },
  {
    label: "Brand",
    href: "/brand",
    icon: "brand",
    children: [
      { label: "Strategy", href: "/brand/strategy" },
      { label: "Tone of voice", href: "/brand/tone-of-voice" },
      { label: "Visual identity", href: "/brand/visual-identity" },
      { label: "Channels", href: "/brand/channels" },
    ],
  },
  {
    label: "Knowledge",
    href: "/knowledge",
    icon: "know",
    children: [
      { label: "Products", href: "/knowledge/products" },
      { label: "Documents", href: "/knowledge/documents" },
      { label: "Images", href: "/knowledge/images" },
      { label: "Presentations", href: "/knowledge/presentations" },
      { label: "Links", href: "/knowledge/links" },
    ],
  },
  {
    label: "Studio",
    href: "/studio",
    icon: "studio",
    children: [
      { label: "Write", href: "/studio/write" },
      { label: "Create images", href: "/studio/create-images" },
    ],
  },
  // No children: /numbers is a real landing page that already lists every
  // calculator as a card, so a sub-menu would be the same links twice.
  { label: "Numbers", href: "/numbers", icon: "numbers" },
  { label: "AI Chat", href: "/chat", icon: "chat" },
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
