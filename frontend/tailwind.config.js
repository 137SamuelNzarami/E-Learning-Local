/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Outfit",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        serif: ["Newsreader", "Georgia", "serif"],
      },
      colors: {
        brand: {
          50: "#f0f6f2",
          100: "#dcebe2",
          200: "#bcd8c8",
          300: "#92bea6",
          400: "#649e82",
          500: "#468466",
          600: "#356a51",
          700: "#2b5542",
          800: "#244536",
          900: "#1e392e",
          950: "#0f201a",
        },
        accent: {
          50: "#fdf7ec",
          100: "#f9ebcf",
          200: "#f2d699",
          300: "#eabb61",
          400: "#f2b455",
          500: "#e89f3d",
          600: "#d6832a",
          700: "#b2661f",
          800: "#8f521f",
          900: "#75431d",
        },
        canvas: {
          DEFAULT: "#f6f4ef",
          deep: "#f0ede5",
        },
        ink: {
          DEFAULT: "#1f2e28",
          soft: "#44574e",
        },
        slate: {
          50: "#f7f7f3",
          100: "#efefe7",
          200: "#dcdcd2",
          300: "#c3c3b6",
          400: "#a4a497",
          500: "#86867b",
          600: "#6c6c63",
          700: "#56564f",
          800: "#3f3f3a",
          900: "#2b2b28",
          950: "#1a1a17",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(31 46 40 / 0.03), 0 2px 8px -2px rgb(31 46 40 / 0.05)",
        lift: "0 16px 40px -16px rgb(31 46 40 / 0.24), 0 6px 16px -8px rgb(31 46 40 / 0.12)",
        soft: "0 2px 4px -1px rgb(31 46 40 / 0.04)",
      },
    },
  },
  plugins: [],
};
