export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      screens: {
        xs: "375px",
      },
    },
  },
  plugins: [],
  safelist: [
    "bg-green-100",
    "bg-green-900/30",
    "text-green-600",
    "text-green-400",
  ],
};