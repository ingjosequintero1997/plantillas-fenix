module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#E8F5E9",
          100: "#C8E6C9",
          200: "#A5D6A7",
          300: "#81C784",
          400: "#66BB6A",
          500: "#4CAF50",
          600: "#43A047",
          700: "#388E3C",
          800: "#2E7D32",
          900: "#1B5E20",
          950: "#0D3B0F",
        },
        surface: {
          DEFAULT: "#F4F6F8",
          50: "#FAFBFC",
          100: "#F0F2F5",
          200: "#E2E5EA",
          300: "#C9CFD8",
        },
        ink: {
          DEFAULT: "#1E293B",
          muted: "#64748B",
          faint: "#94A3B8",
          line: "#E2E8F0",
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"Segoe UI"', "system-ui", "-apple-system", "sans-serif"],
        mono: ['"JetBrains Mono"', '"Fira Code"', "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 16px 0 rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)",
        "card-active": "0 0 0 2px rgba(46,125,50,0.15), 0 4px 16px 0 rgba(0,0,0,0.08)",
        panel: "0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.06)",
        "panel-hover": "0 8px 24px 0 rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)",
        button: "0 1px 2px 0 rgba(0,0,0,0.06)",
        "button-hover": "0 2px 6px 0 rgba(0,0,0,0.12)",
      },
      animation: {
        "fade-in": "fade-in 400ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in-up": "fade-in-up 500ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-down": "slide-down 300ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "scale-in": "scale-in 200ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "pulse-soft": "pulse-soft 2000ms ease-in-out infinite",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
}
