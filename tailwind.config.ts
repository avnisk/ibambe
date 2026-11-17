import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          50: "#18181b",
          100: "#121215",
          200: "#0c0c0e",
          300: "#080809",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.08)",
          hairline: "rgba(255, 255, 255, 0.05)",
        },
        accent: {
          DEFAULT: "#00e5ff",
          hover: "#00c4db",
          subtle: "rgba(0, 229, 255, 0.12)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
