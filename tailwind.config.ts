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
        // Surface hierarchy (No-Line Rule)
        background: "#f8f9fa",
        surface: {
          DEFAULT: "#f8f9fa",
          bright: "#f8f9fa",
          dim: "#d5dbdd",
          container: "#ebeef0",
          "container-low": "#f1f4f5",
          "container-lowest": "#ffffff",
          "container-high": "#e5e9eb",
          "container-highest": "#dee3e6",
          variant: "#dee3e6",
          tint: "#ad3507",
        },
        // Primary (Signature Coral)
        primary: {
          DEFAULT: "#ad3507",
          dim: "#9b2b00",
          container: "#ff6e41",
          fixed: "#ff6e41",
          "fixed-dim": "#ed6235",
        },
        "on-primary": {
          DEFAULT: "#fff7f5",
          container: "#3d0b00",
          fixed: "#000000",
          "fixed-variant": "#4e1100",
        },
        "inverse-primary": "#ff6e41",
        // Secondary
        secondary: {
          DEFAULT: "#556072",
          dim: "#495465",
          container: "#d8e3f9",
          fixed: "#d8e3f9",
          "fixed-dim": "#cad5ea",
        },
        "on-secondary": {
          DEFAULT: "#f8f8ff",
          container: "#475264",
          fixed: "#354051",
          "fixed-variant": "#515c6e",
        },
        // Tertiary
        tertiary: {
          DEFAULT: "#755b25",
          dim: "#684f1a",
          container: "#f9d593",
          fixed: "#f9d593",
          "fixed-dim": "#eac787",
        },
        "on-tertiary": {
          DEFAULT: "#fff8f1",
          container: "#614914",
          fixed: "#4c3602",
          "fixed-variant": "#6b521d",
        },
        // Error
        error: {
          DEFAULT: "#a83836",
          dim: "#67040d",
          container: "#fa746f",
        },
        "on-error": {
          DEFAULT: "#fff7f6",
          container: "#6e0a12",
        },
        // Text
        "on-surface": {
          DEFAULT: "#2d3335",
          variant: "#5a6062",
        },
        "on-background": "#2d3335",
        "inverse-surface": "#0c0f10",
        "inverse-on-surface": "#9b9d9e",
        outline: {
          DEFAULT: "#767c7e",
          variant: "#adb3b5",
        },
        // Semantic aliases
        ink: "#2d3335",
        dark: "#2d3335",
        mid: "#5a6062",
        muted: "#767c7e",
        subtle: "#adb3b5",
        // Legacy compat
        brand: {
          orange: "#ad3507",
          "orange-hover": "#9b2b00",
          "orange-pale": "#fff0e6",
          "orange-mid": "#ffcaa7",
        },
        pale: "#f1f4f5",
        alabaster: "#ebeef0",
        payne: "#2d3335",
        light: "rgba(173, 179, 181, 0.15)",
      },
      borderRadius: {
        DEFAULT: "0.5rem",    // 8px min (no sharp corners)
        sm: "0.5rem",         // 8px
        md: "0.75rem",        // 12px — buttons, inputs
        lg: "1rem",           // 16px — inner cards
        xl: "1.5rem",         // 24px — main dashboard cards
        "2xl": "2rem",        // 32px
        full: "9999px",
      },
      spacing: {
        "space-xs": "4px",
        "space-sm": "8px",
        "space-md": "16px",
        "space-lg": "24px",
        "space-xl": "32px",
        "space-2xl": "48px",
        "space-3xl": "64px",
      },
      width: {
        sidebar: "220px",
      },
      height: {
        topbar: "52px",
      },
      fontFamily: {
        headline: ["Manrope", "var(--font-manrope)", "sans-serif"],
        display: ["Manrope", "var(--font-manrope)", "sans-serif"],
        body: ["Inter", "var(--font-inter)", "DM Sans", "sans-serif"],
        label: ["Inter", "var(--font-inter)", "DM Sans", "sans-serif"],
        sans: ["Inter", "var(--font-inter)", "DM Sans", "sans-serif"],
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
        "ambient-sm": "0 2px 20px rgba(45, 51, 53, 0.04)",
        "ambient": "0 4px 32px rgba(45, 51, 53, 0.05)",
        "ambient-lg": "0 8px 48px rgba(45, 51, 53, 0.06)",
        "float": "0 12px 60px rgba(45, 51, 53, 0.08)",
        "ghost": "inset 0 0 0 1px rgba(173, 179, 181, 0.15)",
      },
    },
  },
  plugins: [],
};
export default config;
