/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea6c0a",
          700: "#c2570a",
          800: "#9a3c0f",
          900: "#7c2d12",
        },
        neutral: {
          50: "#f8f7f5",
          100: "#f3f1ed",
          200: "#ede9e1",
          300: "#d9d3c7",
          400: "#bfb5a3",
          500: "#a59585",
          600: "#8b7d6f",
          700: "#6d665e",
          800: "#4a4642",
          900: "#2a2622",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
