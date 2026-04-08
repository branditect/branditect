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
          orange: "#E16C00",
          "orange-hover": "#C45C00",
          "orange-pale": "#FFF0E6",
          "orange-mid": "#FFCAA7",
        },
        ink: "#1A1A1A",
        dark: "#2d2d2d",
        mid: "#555555",
        muted: "#888888",
        subtle: "#AAAAAA",
        light: "#C8C9CC",
        pale: "#F5F4F0",
        alabaster: "#EBEBDF",
        payne: "#315A72",
        sky: "#87C5EA",
        "on-grey": "#1A1A1A",
        "on-white": "#555555",
        heading: "#1A1A1A",
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
