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
          orange: "#E8562A",
          "orange-hover": "#D14820",
          "orange-pale": "#FEF0EB",
          "orange-mid": "#F9C9B8",
        },
        ink: "#1A1A1A",
        dark: "#2D2D2D",
        mid: "#6B6B6B",
        muted: "#6B6B6B",
        light: "#E5E5E5",
        pale: "#F5F5F5",
        "on-grey": "#1A1A1A",
        "on-white": "#4A4A4A",
        heading: "#111111",
        vetra: {
          black: "#0A0A0F",
          lime: "#C8F135",
        },
      },
      width: {
        sidebar: "220px",
      },
      height: {
        topbar: "52px",
      },
      fontFamily: {
        display: ["var(--font-dm-sans)", "sans-serif"],
        sans: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
