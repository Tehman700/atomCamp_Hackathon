import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body: ["Outfit", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        base: "#05050D",
        surface: "#0C0C1E",
        elevated: "#131328",
        border: "#1E1E45",
        "border-bright": "#2D2D6B",
        primary: {
          DEFAULT: "#7C3AED",
          dim: "rgba(124,58,237,0.15)",
          glow: "rgba(124,58,237,0.4)",
        },
        secondary: {
          DEFAULT: "#06B6D4",
          dim: "rgba(6,182,212,0.15)",
        },
        accent: "#F59E0B",
        success: "#10B981",
        danger: "#EF4444",
        warning: "#F59E0B",
      },
      animation: {
        "orbit-1": "orbit1 6s linear infinite",
        "orbit-2": "orbit2 9s linear infinite",
        "orbit-3": "orbit3 12s linear infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "float": "float 4s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "slide-up": "slideUp 0.5s ease-out",
        "fade-in": "fadeIn 0.4s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
      },
      keyframes: {
        orbit1: {
          "0%": { transform: "translate(-50%, -50%) rotate(0deg) translateX(60px) rotate(0deg)" },
          "100%": { transform: "translate(-50%, -50%) rotate(360deg) translateX(60px) rotate(-360deg)" },
        },
        orbit2: {
          "0%": { transform: "translate(-50%, -50%) rotate(60deg) translateX(85px) rotate(-60deg)" },
          "100%": { transform: "translate(-50%, -50%) rotate(420deg) translateX(85px) rotate(-420deg)" },
        },
        orbit3: {
          "0%": { transform: "translate(-50%, -50%) rotate(120deg) translateX(110px) rotate(-120deg)" },
          "100%": { transform: "translate(-50%, -50%) rotate(480deg) translateX(110px) rotate(-480deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(124,58,237,0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(124,58,237,0.6), 0 0 80px rgba(124,58,237,0.2)" },
        },
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(rgba(124,58,237,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.05) 1px, transparent 1px)",
        "radial-glow": "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,58,237,0.15), transparent)",
        "card-gradient": "linear-gradient(135deg, rgba(19,19,40,0.8), rgba(12,12,30,0.9))",
      },
      backgroundSize: {
        "grid": "40px 40px",
      },
    },
  },
  plugins: [],
};

export default config;
