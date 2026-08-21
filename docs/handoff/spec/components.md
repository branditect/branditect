# Component inventory

Eleven components cover the whole Home screen. Build them as components even where they appear once — the sidebar and the readiness card both get reused the moment a second screen exists.

Props are shown as TypeScript. Adapt naming to the project's conventions; keep the shapes.

---

## `<AppShell>`

Three-column grid: sidebar `228px` · main `1fr` · chat rail `296px`, gap `12px`, max width `1480px`.

At `≤1180px` the chat rail hides. At `≤900px` everything stacks to one column. The grid — not per-element margins — owns all spacing.

---

## `<Sidebar>`

```ts
interface SidebarProps {
  items: NavItem[];
  activeHref: string;
  workspace: { name: string };
  user: { name: string; org: string; initials: string };
  plan: { tier: string; renewsAt: Date };
}
interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  children?: { label: string; href: string; complete?: boolean }[];
}
```

Row `36px`, radius `10px`, label 14px/600, icon 20px `fill: var(--accent)`. Active row gets `background: var(--tint-1)` and `color: var(--accent)` — **the icon stays orange in both states**, only the label colour changes.

Children collapse by default and expand on click. Expand state is UI-only; the active section should be expanded on load. `aria-expanded` on the parent button, `aria-current="page"` on the active row.

The completion dot on a child (`--accent` filled, `--rule-3` empty) mirrors what Brand Readiness knows. Don't invent a second source for it.

---

## `<ReadinessCard>`

```ts
interface ReadinessCardProps {
  readiness: Readiness;         // from spec/readiness.ts
  knowledge: KnowledgeCounts;
}
interface KnowledgeCounts {
  documents: number; images: number; products: number;
  presentations: number; links: number;
}
```

The most important element on the screen. Gradient `--grad-hero`, radius `16px`, `filter: var(--shadow-hero)`.

Contains, in order: kicker → score (46px) + band pill → one line of copy naming the weakest link → Brand Knowledge tiles → `Explore knowledge →`.

Everything except the counts is derived from `readiness`. The band pill text is `readiness.band`; the copy is built from `readiness.nextAction`. Nothing here is hand-written per state.

Knowledge tiles: transparent with `1.2px solid rgba(255,255,255,.4)`, radius `10px`, white icons, value 18px/700 tabular-nums, label 10px/500. Five across, collapsing to three at `≤900px`.

---

## `<WhatsNextPanel>`

```ts
interface WhatsNextPanelProps {
  checks: Check[];              // readiness.checks
  score: number;
  passedCount: number;
  totalCount: number;
}
```

**This panel renders the readiness checks and nothing else.** It is the score's breakdown, not a second to-do list. That's the fix for the current app, where a hero claiming 87% sat beside a panel listing three unfinished things.

Each row: 30px icon tile (radius 9px, walking the tint ladder `--tint-1` → `--tint-4`, then `--tile` for the last), title 13px/700, sublabel 11px/500 `--muted` carrying the real count, and on the right either `Done` (12px/700 `--green` with check icon) or the action link (12px/700 `--accent`).

Footer strip pinned to the bottom with `margin-top:auto`: `Each check is worth 25%` and `{passed} / {total} · {score}%`.

An `Add more` row sits after the checks as a permanent escape hatch. It is not a check and carries no points.

---

## `<StudioCard>`

```ts
interface StudioCardProps {
  title: string;
  description: string;
  href: string;
  variant: 'write' | 'images' | 'numbers' | 'assets' | 'more';
  art?: ReactNode;
}
```

Height `148px`, radius `12px`, title 16px/700, body 12px/500. Each variant maps to a gradient token and its own text colour — see `design/tokens.css`.

The artwork is decorative and `aria-hidden`. In the reference it's CSS shapes; swap for the Figma PNG exports.

Laid out with `repeat(auto-fit, minmax(158px, 1fr))` so five cards become four then three as the window narrows rather than crushing.

---

## `<ActivityList>`

```ts
interface ActivityItem {
  id: string;
  type: 'strategy' | 'upload' | 'created' | 'chat';
  title: string;
  at: Date;
}
```

Row: 28px icon tile on `--tint-1`, title 13px/600, relative timestamp 12px/400 `--faint` pushed right. Divider between rows, none after the last.

**Every activity title must name a surface that exists in the nav.** The current app credits outputs to "Content Architect" and "Financial Tools", neither of which is reachable — that's how a user learns not to trust the list.

---

## `<ChatRail>`

```ts
interface ChatRailProps {
  indexedFileCount: number;
  suggestions: string[];        // exactly 3
  lastExchange?: { question: string; answer: string; at: Date; source?: SourceChip };
}
interface SourceChip { filename: string; href: string }
```

Gradient `--grad-chat`, plus a lavender radial bloom bottom-left (decorative, `pointer-events:none`, behind content).

The `TRAINED` badge and `41 files indexed` are the point of the panel — they're what makes the brain feel real. Keep the source chip on every answer: naming the file it read is the difference between an assistant and a chatbot.

The first suggestion is visually promoted (`--accent-line` border, `--accent` text).

---

## `<IconTile>`

```ts
interface IconTileProps {
  icon: IconName;
  size?: 28 | 30 | 36;
  tint?: 1 | 2 | 3 | 4 | 5 | 'neutral';
}
```

Wraps every small icon-on-a-tinted-square in the app. Radius 9–10px, icon 55–58% of tile size, `fill: var(--accent)`.

The tint ladder exists so a vertical list of these reads as a set rather than a stripe of identical squares. Step down it in order within a list.

---

## `<Icon>`

```ts
type IconName =
  | 'home' | 'brand' | 'know' | 'studio' | 'numbers' | 'chat'
  | 'search' | 'bell' | 'doc' | 'img' | 'bag' | 'pres' | 'link'
  | 'target' | 'upload' | 'check' | 'plus' | 'arrow' | 'send';
```

All 19 live in `assets/icons/`, 24×24 viewBox, `fill="currentColor"`, filled (not stroked). Ship as a sprite or an SVGR-style component set — either is fine, but one mechanism, not both.

They are **stand-ins** for the MingCute filled set used in Figma. Replace with the real exports if licensing allows; these match the size, weight and colour behaviour so nothing else has to change.

---

## `<StatTile>` and `<Pill>`

Small enough to inline, listed so they don't get reinvented three times. `StatTile` is the knowledge counter (icon, label, tabular-nums value); `Pill` is the band badge and any status chip — radius `50px`, 13px/700.

---

## Accessibility floor

Nothing here should ship without it:

- Every interactive element is a real `<button>` or `<a>`, never a `div` with `onClick`.
- Visible focus on all of them — `outline: 2px solid var(--accent)`.
- Icons that carry meaning get a label; decorative artwork gets `aria-hidden="true"`.
- Landmarks: `<nav aria-label="Primary">`, `<main>`, `<aside aria-label="AI Chat">`.
- `prefers-reduced-motion` disables the hover transitions.
- Contrast: white on `--accent` passes; `--faint` on white is 12px meta only, never body.
