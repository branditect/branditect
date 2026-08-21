# Design System Strategy: The Editorial Architect

## 1. Overview & Creative North Star
This design system is built upon the **Creative North Star: The Editorial Architect.** 

Most SaaS platforms feel like rigid spreadsheets; this system is designed to feel like a premium digital workspace—one that balances the precision of an architectural blueprint with the sophisticated layout of a high-end editorial magazine. We reject the "standard" boxy grid in favor of **intentional asymmetry, breathing room, and tonal depth.** 

By leveraging overlapping surfaces and a sophisticated coral accent, the system transforms a functional tool into a curated experience. The goal is to make the user feel organized yet creative, providing a "calm tech" environment that recedes into the background, allowing their ideas to take center stage.

---

## 2. Colors & Surface Philosophy
The palette is rooted in soft, muted neutrals that provide a "paper-like" tactile quality, punctuated by a surgical use of coral to denote action and vitality.

### The "No-Line" Rule
To achieve a premium, custom feel, **1px solid borders are strictly prohibited for sectioning.** Boundaries must be defined through background color shifts or subtle tonal transitions. 
- Use `surface-container-low` (#f1f4f5) for large layout sections.
- Use `surface-container-lowest` (#ffffff) for primary content cards.
- This creates a "staged" look where elements feel placed onto a surface rather than trapped inside a box.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the `surface-container` tiers to create depth:
1. **Base:** `background` (#f8f9fa)
2. **Structural Sections:** `surface-container-low` (#f1f4f5)
3. **Primary Content Containers:** `surface-container-lowest` (#ffffff)
4. **Active/Overlay Elements:** `surface-bright` (#f8f9fa)

### The "Glass & Gradient" Rule
To move beyond a flat "template" look, floating elements (like dropdowns or navigation bars) should utilize **Glassmorphism**. Apply a `backdrop-blur` of 12px-16px to `surface-container-lowest` with an 85% opacity. 

For high-impact CTAs, use a **Signature Texture**: a subtle linear gradient (45deg) transitioning from `primary` (#ad3507) to `primary-container` (#ff6e41). This provides a visual "soul" that flat colors cannot achieve.

---

## 3. Typography
The system uses a dual-font strategy to balance authority with modern accessibility.

*   **Display & Headlines (Manrope):** Chosen for its geometric precision and modern, wide stance. It communicates the "Architect" side of the brand—structured, professional, and bold.
*   **Body & Labels (Inter):** The gold standard for digital readability. Inter handles the "Brain" side of the brand—processing information with absolute clarity.

**Hierarchy as Identity:**
- **Display-LG (3.5rem):** Use for high-level welcome states or empty-state headers.
- **Headline-MD (1.75rem):** Use for primary dashboard sections.
- **Body-MD (0.875rem):** The workhorse for all user-generated content.
- **Label-MD (0.75rem):** Always in `on-surface-variant` (#5a6062) for metadata to ensure secondary information doesn't compete with primary tasks.

---

## 4. Elevation & Depth
In this system, elevation is conveyed through **Tonal Layering** rather than heavy shadows.

### The Layering Principle
Depth is achieved by "stacking" surface tiers. A `surface-container-lowest` card sitting on a `surface-container-low` background creates a natural, soft lift. This mimics the way fine paper sits on a desk.

### Ambient Shadows
When a floating effect is required (e.g., a "Create" modal or a hovering chip), use **Ambient Shadows**:
- **Blur:** 24px - 40px
- **Opacity:** 4% - 8%
- **Shadow Color:** Use a tinted version of `on-surface` (#2d3335) rather than pure black to simulate natural light.

### The "Ghost Border" Fallback
If a border is required for accessibility (e.g., in a high-density data table), use a **Ghost Border**: Use the `outline-variant` (#adb3b5) token at a maximum of **15% opacity**. Never use 100% opaque borders.

---

## 5. Components

### Buttons
- **Primary:** `primary` to `primary-container` gradient. White text (`on-primary`). Roundedness: `md` (0.75rem / 12px).
- **Secondary:** `surface-container-highest` background with `on-surface` text. No border.
- **Tertiary:** Text-only using `primary` color. Use for low-emphasis actions like "Cancel" or "View all."

### Cards & Layouts
- **Rule:** Absolute prohibition of divider lines between card content.
- **Separation:** Use `spacing-scale` (vertical whitespace) or a 1-step shift in surface color (e.g., a `surface-container-low` header inside a `surface-container-lowest` card).
- **Radius:** Standardize on `xl` (1.5rem / 24px) for main dashboard cards and `lg` (1rem / 16px) for inner nested elements.

### Floating Action Chips
Used for quick category selection. These should utilize the **Glassmorphism** rule: semi-transparent `surface-container-lowest` with a subtle `outline-variant` ghost border.

### Input Fields
- **Background:** `surface-container-low`.
- **Active State:** Transition background to `surface-container-lowest` and add a 2px `primary-container` ghost border.
- **Corner Radius:** `md` (0.75rem).

---

## 6. Do's and Don'ts

### Do
- **Do** use "Negative Space" as a functional element. Allow sections to breathe; white space is a luxury signal.
- **Do** use the Coral/Orange (`primary`) sparingly. It is a "laser pointer," not a "paint brush."
- **Do** align icons with the "thin-line" aesthetic. Use 1.5px stroke weights to match the Manrope font-weight.

### Don't
- **Don't** use pure black (#000000) for text. Use `on-surface` (#2d3335) to maintain the soft, editorial feel.
- **Don't** use standard "drop shadows" with small blur radii. It makes the UI feel dated and heavy.
- **Don't** use dividers to separate list items. Use increased vertical padding and subtle hover states (`surface-container-high`).
- **Don't** use sharp corners. Every element should feel approachable and ergonomic (minimum 8px radius).

---

## 7. Spacing Scale
The system relies on a base-8 grid to maintain rhythmic consistency. 
- **Section Spacing:** 48px or 64px to emphasize the Editorial layout.
- **Component Padding:** 16px (inner) and 24px (outer).
- **Visual Gaps:** Use 12px for grouping related elements (e.g., an icon and its label).

---

## 8. Tailwind Config Reference

```js
colors: {
  "secondary-fixed": "#d8e3f9",
  "secondary-fixed-dim": "#cad5ea",
  "on-primary": "#fff7f5",
  "tertiary": "#755b25",
  "inverse-primary": "#ff6e41",
  "tertiary-fixed": "#f9d593",
  "secondary-container": "#d8e3f9",
  "on-background": "#2d3335",
  "tertiary-container": "#f9d593",
  "primary-fixed-dim": "#ed6235",
  "primary-dim": "#9b2b00",
  "surface-bright": "#f8f9fa",
  "surface-variant": "#dee3e6",
  "on-secondary-container": "#475264",
  "outline": "#767c7e",
  "tertiary-dim": "#684f1a",
  "inverse-surface": "#0c0f10",
  "surface-container-lowest": "#ffffff",
  "error": "#a83836",
  "on-secondary-fixed-variant": "#515c6e",
  "surface-container-low": "#f1f4f5",
  "on-tertiary-fixed": "#4c3602",
  "error-dim": "#67040d",
  "on-surface": "#2d3335",
  "on-secondary": "#f8f8ff",
  "tertiary-fixed-dim": "#eac787",
  "surface-container": "#ebeef0",
  "outline-variant": "#adb3b5",
  "inverse-on-surface": "#9b9d9e",
  "on-tertiary-container": "#614914",
  "surface": "#f8f9fa",
  "on-tertiary-fixed-variant": "#6b521d",
  "error-container": "#fa746f",
  "surface-tint": "#ad3507",
  "primary": "#ad3507",
  "on-secondary-fixed": "#354051",
  "primary-container": "#ff6e41",
  "on-primary-fixed": "#000000",
  "secondary": "#556072",
  "on-primary-fixed-variant": "#4e1100",
  "on-error-container": "#6e0a12",
  "secondary-dim": "#495465",
  "on-primary-container": "#3d0b00",
  "primary-fixed": "#ff6e41",
  "on-surface-variant": "#5a6062",
  "surface-container-highest": "#dee3e6",
  "background": "#f8f9fa",
  "surface-container-high": "#e5e9eb",
  "on-error": "#fff7f6",
  "surface-dim": "#d5dbdd",
  "on-tertiary": "#fff8f1"
},
borderRadius: {
  DEFAULT: "0.25rem",
  lg: "0.5rem",
  xl: "0.75rem",
  full: "9999px"
},
fontFamily: {
  headline: ["Manrope"],
  body: ["Inter"],
  label: ["Inter"],
  display: "Manrope"
}
```

---

## 9. No Emoji Rule
Never use emoji in the UI. Replace with text labels or colored initials.
