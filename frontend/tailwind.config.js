/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sand: {
          50: "#FAF8F5",
          100: "#F3EFE8",
          200: "#E7DFD3",
        },
        ink: {
          900: "#1C1917",
          700: "#44403C",
          500: "#78716C",
        },
        accent: {
          DEFAULT: "#C2410C",
          dark: "#9A3412",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}

