/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        coral: {
          DEFAULT: "#FB4E77",
          hover: "#e03b63",
          dark: "#8c1a36",
          50: "#fff1f4",
          100: "#ffe4e9",
          200: "#fecdd7",
          400: "#fb718f",
          500: "#FB4E77",
          600: "#e03b63",
        },
        mint: {
          DEFAULT: "#00D99D",
          hover: "#00b885",
          dark: "#004d38",
          50: "#edfff8",
          100: "#d6ffef",
          200: "#afffe1",
          400: "#22eab0",
          500: "#00D99D",
          600: "#00b885",
        },
        iris: {
          DEFAULT: "#584BE0",
          hover: "#4639cb",
          dark: "#271f78",
          50: "#eff0fe",
          100: "#e0e2fd",
          200: "#c7cbfa",
          400: "#7b70ea",
          500: "#584BE0",
          600: "#4639cb",
        },
      },
    },
  },
  plugins: [],
};
