import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f6ff",
          100: "#dce7ff",
          200: "#b3ceff",
          300: "#80adff",
          400: "#4c85ff",
          500: "#1f5eff",
          600: "#0e3ff0",
          700: "#0933c8",
          800: "#0c2c99",
          900: "#102770",
        },
      },
    },
  },
  plugins: [],
};

export default config;
