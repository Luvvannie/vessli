/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sand: {
          50: "#FAF6EE",
          100: "#F1E9D9",
          200: "#E2D5BE",
        },
        ink: {
          900: "#2A1A1E",
          700: "#5C4A4E",
          500: "#8A767A",
        },
        accent: {
          DEFAULT: "#7A1E2E",
          dark: "#5A1421",
        },
        wine: {
          DEFAULT: "#7A1E2E",
          dark: "#5A1421",
          light: "#9E2E42",
          soft: "#F6E3E6",
        },
        gold: {
          DEFAULT: "#C9A227",
          dark: "#9A7B18",
          soft: "#F7EDC9",
        },
        sage: {
          DEFAULT: "#5F6F52",
          soft: "#E4E9DE",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}

