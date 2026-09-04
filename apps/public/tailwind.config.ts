import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        qm: {
          primary: "#6E123D",      // Deep Burgundy / Wine
          secondary: "#A50D52",    // Rich Magenta
          accent: "#D83B70",       // Bright Pink Accent
          blush: "#F3D6E1",        // Soft Blush
          background: "#FAF8F9",   // Off White Background
          surface: "#FFFFFF",      // Pure White Surface
          darkText: "#24141C",     // Dark Text
          mutedText: "#6B5A62",    // Softened Dark Muted Text
          border: "#F0E1E8",       // Rose-tinted Border
          subtle: "#F6EDF1"        // Soft Surface Tint
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        'qm-glow': '0 10px 30px -10px rgba(165, 13, 82, 0.25)',
        'qm-card': '0 4px 20px -2px rgba(36, 20, 28, 0.05)'
      }
    },
  },
  plugins: [],
};
export default config;
