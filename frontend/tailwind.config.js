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
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}

