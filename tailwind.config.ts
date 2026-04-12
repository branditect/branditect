import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
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
        ink: "#1a1c1e", dark: "#1a1c1e", mid: "#44474e", muted: "#8d7169", subtle: "#e1bfb6",
        pale: "#f3f6fc", alabaster: "#eceef4", payne: "#1a1c1e",
        light: "rgba(225, 191, 182, 0.15)",
        brand: { orange: "#ec5c36", "orange-hover": "#d14a22", "orange-pale": "#ffdbd1", "orange-mid": "#ffb4a1" },
        heading: "#1a1c1e",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
        full: "9999px",
      },
      fontFamily: {
        headline: ["var(--font-jakarta)", "Plus Jakarta Sans", "var(--font-dm-sans)", "DM Sans", "sans-serif"],
        body: ["var(--font-manrope)", "Manrope", "var(--font-dm-sans)", "DM Sans", "sans-serif"],
        label: ["var(--font-manrope)", "Manrope", "var(--font-dm-sans)", "DM Sans", "sans-serif"],
        display: ["var(--font-jakarta)", "Plus Jakarta Sans", "var(--font-dm-sans)", "DM Sans", "sans-serif"],
        sans: ["var(--font-manrope)", "Manrope", "var(--font-dm-sans)", "DM Sans", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
      },
      fontSize: {
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
      width: { sidebar: "220px" },
      height: { topbar: "52px" },
    },
  },
  plugins: [],
};
export default config;
