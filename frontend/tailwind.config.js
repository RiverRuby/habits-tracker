/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        black: "#0F1014",
        "dark-gray": "#1B1C1F",
        gray: "#26272B",
        "light-gray": "#6C7086",
        blue: "#3564DC",
        purple: "#4F4CDD",
      },
    },
  },
  plugins: [],
};
