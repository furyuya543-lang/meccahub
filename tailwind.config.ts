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
        bg:         "#070710",
        surface:    "#0f0f1e",
        "surface-2":"#161628",
        "surface-3":"#1e1e38",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #4ade80, #2dd4bf)",
        "gradient-hero":    "linear-gradient(135deg, #0a0a1a 0%, #0d1a0d 50%, #0a0a1a 100%)",
      },
      boxShadow: {
        "glow-green": "0 0 24px rgba(74,222,128,0.25)",
        "glow-teal":  "0 0 24px rgba(45,212,191,0.25)",
        "glow-card":  "0 0 40px rgba(74,222,128,0.08)",
      },
      keyframes: {
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%":       { backgroundPosition: "100% 50%" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%":       { opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "gradient-shift": "gradient-shift 8s ease infinite",
        "pulse-glow":     "pulse-glow 3s ease-in-out infinite",
        "fade-up":        "fade-up 0.4s ease both",
      },
    },
  },
  plugins: [],
};

export default config;
