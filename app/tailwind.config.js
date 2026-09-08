/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        salbeau: {
          bg: '#FFF8FA',
          pink: '#F5A8C0',
          pinkDeep: '#C2477A',
          pinkSoft: '#FCE4EC',
          text: '#3A2430',
          muted: '#8C7078',
          success: '#4C8C5C',
          warningBg: '#FDEAF1',
        }
      }
    },
  },
  plugins: [],
}
