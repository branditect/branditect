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
        brand: {
          orange: "#a63300",
          "orange-hover": "#8a2b00",
          "orange-pale": "#fff0e6",
          "orange-mid": "#ffcaa7",
        },
        // Surface hierarchy
        surface: {
          DEFAULT: "#f4f7f9",
          low: "#edf1f3",
          lowest: "#ffffff",
          high: "#e5e9eb",
          highest: "#d8dee1",
        },
        // Text
        ink: "#2b2f31",
        dark: "#2b2f31",
        mid: "#5a6062",
        muted: "#767c7e",
        subtle: "#aaaeb0",
        // Semantic
        light: "rgba(170, 174, 176, 0.15)",
        pale: "#f4f7f9",
        alabaster: "#edf1f3",
        payne: "#2b2f31",
        // Accent
        primary: "#a63300",
        "primary-container": "#ff7949",
        "primary-fixed-dim": "#f7652f",
        "on-primary": "#fff7f5",
        secondary: "#556072",
        "secondary-container": "#d8e3f9",
        "on-secondary-container": "#475264",
        outline: "#767c7e",
        "outline-variant": "#aaaeb0",
        "on-surface": "#2b2f31",
        "on-surface-variant": "#5a6062",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "1rem",
        xl: "1.5rem",
        full: "9999px",
      },
      width: {
        sidebar: "220px",
      },
      height: {
        topbar: "52px",
      },
      fontFamily: {
        headline: ["Manrope", "var(--font-dm-sans)", "sans-serif"],
        body: ["Inter", "var(--font-dm-sans)", "sans-serif"],
        label: ["Inter", "var(--font-dm-sans)", "sans-serif"],
        display: ["Manrope", "var(--font-dm-sans)", "sans-serif"],
        sans: ["Inter", "var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
