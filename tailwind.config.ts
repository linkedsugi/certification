import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f3f5ff",
          100: "#e6ebff",
          200: "#c9d3ff",
          300: "#a0b0ff",
          400: "#7180f7",
          500: "#4a55e6",
          600: "#343dc4",
          700: "#2a319c",
          800: "#1f2474",
          900: "#131747",
        },
        ink: {
          900: "#0c1020",
          700: "#2a3350",
          500: "#5b6586",
          300: "#a3aac0",
          100: "#e8eaf2",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'Pretendard Variable'",
          "Pretendard",
          "Inter",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
