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
          surface: "#FFFFFF",
          darkText: "#24141C",     // Dark Text
          border: "#F0E1E8"
        },
        admin: {
          sidebar: "#1A0B13",      // Deep Wine-toned Slate Dark
          surface: "#FAF8F9",
          primary: "#A50D52",
          accent: "#D83B70"
        }
      }
    },
  },
  plugins: [],
};
export default config;
