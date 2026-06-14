/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#09090b", soft: "#3f485a", faint: "#7b869e" },
        flow: {
          50: "#f6f8fb",
          100: "#e3eaf3",
          200: "#cfd8e6",
          400: "#9aa4b5",
          500: "#5f6878",
          600: "#10151b",
          700: "#09090b",
        },
        rebate: { DEFAULT: "#10151b", soft: "#eef1f5" },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        sans: ['"Spline Sans"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(9,9,11,0.04), 0 16px 44px -28px rgba(9,9,11,0.28)",
        lift: "0 24px 60px -34px rgba(9,9,11,0.42)",
      },
      keyframes: {
        "slide-up": { from: { opacity: 0, transform: "translateY(14px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(16,21,27,0.22)" },
          "70%": { boxShadow: "0 0 0 12px rgba(16,21,27,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(16,21,27,0)" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        marquee: "marquee 30s linear infinite",
        "pulse-ring": "pulse-ring 2s infinite",
      },
    },
  },
  plugins: [],
};
