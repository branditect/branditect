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
          "orange-hover": "#d14a22",
          "orange-pale": "#FEF0EB",
          "orange-mid": "#F8C9B3",
        },
        ink: "#1f1f1f",
        dark: "#2d2d2d",
        mid: "#444444",
        muted: "#666666",
        subtle: "#888888",
        light: "#D0D3DA",
        pale: "#F2F1EE",
        alabaster: "#EBEBDF",
        "on-grey": "#1f1f1f",
        "on-white": "#3d3d3d",
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
