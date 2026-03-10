import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          0: "#FDFBF7",
          1: "#F8F5EE",
          2: "#F0EBE0",
          3: "#E8E2D5",
          4: "#DDD5C4",
        },
        primary: {
          DEFAULT: "#8B1A2B",
          light: "#A82040",
          dim: "rgba(139,26,43,0.08)",
        },
        gold: {
          DEFAULT: "#D4A017",
          light: "#E5B82A",
          dim: "rgba(212,160,23,0.12)",
        },
        saffron: {
          DEFAULT: "#E87F24",
          dim: "rgba(232,127,36,0.10)",
        },
        emerald: {
          DEFAULT: "#1A6B4A",
          dim: "rgba(26,107,74,0.10)",
        },
        text: {
          primary: "#1C1410",
          secondary: "#5C4F42",
          tertiary: "#8A7D6F",
        },
      },
      fontFamily: {
        fraunces: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      spacing: {
        "2xs": "2px",
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "64px",
        "4xl": "80px",
      },
    },
  },
  plugins: [],
};

export default config;
