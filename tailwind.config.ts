import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // lib/ holds class maps (e.g. CATEGORY_STYLES in lib/products.ts). Without
    // this glob those classes are never scanned and silently render unstyled —
    // which is invisible until one category has no pill colour.
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Branditect v6 tokens (docs/handoff/design) ───────────────────
        // Single source of truth for new surfaces. Figma WyphBCrLRfCaUkqZb2Fskf,
        // frame 58:13755. Do not introduce hex values outside this block.
        ink: { DEFAULT: "#15151b", 2: "#3a3a45", 3: "#3f3f4a" },
        muted: { DEFAULT: "#6f6f8a", 2: "#8b8b97" },
        faint: { DEFAULT: "#aeaeb8", 2: "#9a9aa4" },
        page: "#f4f3f2",
        card: "#ffffff",
        tile: { DEFAULT: "#f4f3f2", 2: "#f1f0ee" },
        rule: { DEFAULT: "#edecea", 2: "#e6e6e6", 3: "#ddddf1" },
        accent: { DEFAULT: "#f0562a", dark: "#e8481f", line: "#f6b7a0" },
        // The warm tint ladder — icon tiles step through 1..5 so a vertical
        // list reads as a set rather than a stripe of identical squares.
        tint: { 1: "#fef0ea", 2: "#fdede6", 3: "#fdeee7", 4: "#fbe7e2", 5: "#fcedeb" },
        good: "#2fbf71",
        navy: "#1d2748",
        plannote: "#a98a80",

        // Category / status washes (products.html). Each pairs a wash with an
        // ink dark enough to carry text on it — never use a wash as a text
        // colour or an ink as a background.
        lavender: "#e8dff6",
        "lav-ink": "#5b4a80",
        "green-wash": "#e8f6ee",
        "green-ink": "#1c7a48",
        "blue-wash": "#e8effd",
        "blue-ink": "#3c5a8f",
        amber: "#b8791a",
        "amber-wash": "#fbf1de",

        // ── Legacy palette (pre-v6 pages) ────────────────────────────────
        // Retained so un-migrated inner pages keep rendering. Remove as each
        // page moves onto the tokens above.
        // Primary
        primary: { DEFAULT: "#ec5c36", dim: "#891e00", container: "#ffdbd1", fixed: "#ffdbd2", "fixed-dim": "#ffb4a1" },
        "on-primary": { DEFAULT: "#ffffff", container: "#fffbff", fixed: "#3c0800", "fixed-variant": "#891e00" },
        "inverse-primary": "#ffb4a1",
        // Secondary
        secondary: { DEFAULT: "#934936", container: "#ffa088", fixed: "#ffdbd2", "fixed-dim": "#ffb4a1" },
        "on-secondary": { DEFAULT: "#ffffff", container: "#783523", fixed: "#3c0800", "fixed-variant": "#753321" },
        // Tertiary
        tertiary: { DEFAULT: "#00647c", container: "#007f9c", fixed: "#b7eaff", "fixed-dim": "#66d4f8" },
        "on-tertiary": { DEFAULT: "#ffffff", container: "#fafdff", fixed: "#001f28", "fixed-variant": "#004e60" },
        // Error
        error: { DEFAULT: "#ba1a1a", container: "#ffdad6" },
        "on-error": { DEFAULT: "#ffffff", container: "#93000a" },
        // Surface
        background: "#fcfcff",
        surface: { DEFAULT: "#fcfcff", bright: "#fcfcff", dim: "#d0dbed", container: "#eceef4", "container-low": "#f3f6fc", "container-lowest": "#ffffff", "container-high": "#dee9fc", "container-highest": "#e8eef8", variant: "#e1e2e8", tint: "#ec5c36" },
        // Text
        "on-surface": { DEFAULT: "#1a1c1e", variant: "#44474e" },
        "on-background": "#121c2a",
        "inverse-surface": "#2f3033",
        "inverse-on-surface": "#f0f0f3",
        outline: { DEFAULT: "#8d7169", variant: "#e1bfb6" },
        // Semantic aliases
        // `ink` and `muted` intentionally omitted here — they are defined in
        // the v6 block above and would otherwise be overridden by this one.
        dark: "#1a1c1e", mid: "#44474e", subtle: "#e1bfb6",
        pale: "#f3f6fc", alabaster: "#eceef4", payne: "#1a1c1e",
        light: "rgba(225, 191, 182, 0.15)",
        brand: { orange: "#ec5c36", "orange-hover": "#d14a22", "orange-pale": "#ffdbd1", "orange-mid": "#ffb4a1" },
        heading: "#1a1c1e",
      },
      backgroundImage: {
        "grad-hero": "linear-gradient(92.52deg, #f16d2c 11.42%, #fe4401 29.59%)",
        "grad-mark": "linear-gradient(135deg, #f16d2c, #fe4401)",
        "grad-write": "linear-gradient(116.565deg, rgb(103,139,191) 17.664%, rgb(67,99,148) 79.542%)",
        "grad-images": "linear-gradient(128.944deg, rgb(237,230,252) 17.382%, rgb(216,201,249) 83.306%)",
        "grad-numbers": "linear-gradient(127.831deg, rgb(232,239,253) 21.838%, rgb(208,219,247) 94.881%)",
        "grad-assets": "linear-gradient(123.041deg, rgb(230,244,241) 28.392%, rgb(179,207,203) 83.262%)",
        "grad-more": "linear-gradient(120deg, rgb(253,243,240) 18%, rgb(251,224,217) 92%)",
        "grad-chat": "linear-gradient(180deg, #fdf6f7 0%, #f5f1fc 100%)",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
        full: "9999px",
        // v6
        nav: "10px",
        tile: "10px",
        card: "12px",
        panel: "16px",
        pill: "50px",
      },
      // Applied via `filter`, not box-shadow, so shadows follow the rounded
      // corners of gradient-filled cards.
      dropShadow: {
        panel: ["0 6px 10px rgba(20,20,26,.07)", "0 1px 1px rgba(20,20,26,.04)"],
        hero: "0 10px 18px rgba(180,50,10,.18)",
        btn: "0 1px 1px rgba(20,20,26,.05)",
      },
      maxWidth: { shell: "1480px" },
      screens: {
        // below `chat` the AI Chat rail hides; below `stack` it's one column
        chat: { max: "1180px" },
        stack: { max: "900px" },
      },
      fontFamily: {
        // One typeface. `font-body` used to resolve to Manrope and, being a
        // class on <body>, overrode the base-layer rule — so the whole app
        // rendered in Manrope while claiming Plus Jakarta Sans.
        sans: ["var(--font-jakarta)", "Plus Jakarta Sans", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        headline: ["var(--font-jakarta)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        body: ["var(--font-jakarta)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        label: ["var(--font-jakarta)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        display: ["var(--font-jakarta)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
      },
      fontSize: {
        // ── v6 scale: Airbnb density. 14px body, 12px meta, 22px section
        // headings, 26px page title. Product UI does not use 40px text.
        micro: ["10px", { lineHeight: "14px" }],
        "2xs": ["11px", { lineHeight: "15px" }],
        xs: ["12px", { lineHeight: "17px" }],
        sm: ["13px", { lineHeight: "18px" }],
        base: ["14px", { lineHeight: "20px" }],
        h3: ["16px", { lineHeight: "19px", letterSpacing: "-0.2px" }],
        h2: ["22px", { lineHeight: "26px", letterSpacing: "-0.5px" }],
        display: ["26px", { lineHeight: "30px", letterSpacing: "-0.7px" }],
        score: ["46px", { lineHeight: "46px", letterSpacing: "-2px" }],

        "display-lg": ["3.5rem", { lineHeight: "1.1", fontWeight: "800" }],
        "display-md": ["2.5rem", { lineHeight: "1.15", fontWeight: "800" }],
        "headline-lg": ["2rem", { lineHeight: "1.2", fontWeight: "700" }],
        "headline-md": ["1.75rem", { lineHeight: "1.25", fontWeight: "700" }],
        "headline-sm": ["1.25rem", { lineHeight: "1.3", fontWeight: "700" }],
        "title-lg": ["1.125rem", { lineHeight: "1.35", fontWeight: "600" }],
        "title-md": ["1rem", { lineHeight: "1.4", fontWeight: "600" }],
        "body-lg": ["1rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body-md": ["0.875rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body-sm": ["0.8125rem", { lineHeight: "1.55", fontWeight: "400" }],
        "label-lg": ["0.875rem", { lineHeight: "1.4", fontWeight: "600" }],
        "label-md": ["0.75rem", { lineHeight: "1.4", fontWeight: "600" }],
        "label-sm": ["0.6875rem", { lineHeight: "1.4", fontWeight: "500" }],
      },
      boxShadow: {
        "ambient-sm": "0 2px 20px rgba(26, 28, 30, 0.04)",
        "ambient": "0 4px 32px rgba(26, 28, 30, 0.05)",
        "ambient-lg": "0 8px 48px rgba(26, 28, 30, 0.06)",
        "float": "0 12px 60px rgba(26, 28, 30, 0.08)",
        "primary-glow": "0 12px 48px rgba(236, 92, 54, 0.35)",
        "ghost": "inset 0 0 0 1px rgba(225, 191, 182, 0.15)",
      },
      width: { sidebar: "228px" },
      spacing: { sidebar: "228px", chatrail: "296px" },
    },
  },
  plugins: [],
};
export default config;
