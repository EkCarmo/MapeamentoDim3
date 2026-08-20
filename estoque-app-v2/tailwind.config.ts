import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1C1E21",
        paper: "#F7F7F5",
        line: "#E2E1DC",
        accent: "#2F5D50",
        accentSoft: "#E7EFEC",
        warn: "#B45309",
        danger: "#B3261E",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
      },
    },
  },
  plugins: [],
};
export default config;
