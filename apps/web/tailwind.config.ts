import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        panel: "var(--panel)",
        panelStrong: "var(--panel-strong)",
        line: "var(--line)",
        text: "var(--text)",
        muted: "var(--muted)",
        orange: {
          300: "var(--orange-300)",
          400: "var(--orange-400)",
          500: "var(--orange-500)",
          600: "var(--orange-600)"
        }
      },
      boxShadow: {
        glow: "0 30px 80px rgba(0, 0, 0, 0.35)",
        panel: "0 18px 60px rgba(0, 0, 0, 0.28)"
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at 20% 20%, rgba(255, 157, 66, 0.2), transparent 25%), radial-gradient(circle at 80% 0%, rgba(255, 102, 0, 0.14), transparent 30%), linear-gradient(180deg, rgba(15, 18, 26, 0.94), rgba(7, 10, 16, 1))"
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        pulseLine: "pulseLine 5s ease-in-out infinite",
        appear: "appear 700ms ease-out both"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        pulseLine: {
          "0%, 100%": { opacity: "0.45", transform: "scaleX(0.94)" },
          "50%": { opacity: "1", transform: "scaleX(1)" }
        },
        appear: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
