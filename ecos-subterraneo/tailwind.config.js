/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0b12",
        bone: "#e7e5e4",
        hive: "#e0b700",
      },
    },
  },
  plugins: [],
};
