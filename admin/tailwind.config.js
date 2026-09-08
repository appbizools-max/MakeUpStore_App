/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        salbeau: {
          bg: '#FBF9F8',
          card: '#FFFFFF',
          brown: '#5A3825',
          brownDark: '#452A1B',
          brownMuted: '#8C5A3E',
          surface: '#F4ECE7',
          border: '#E8DDD7',
          pink: '#C2477A',
          pinkSoft: '#FCE4EC',
        }
      }
    },
  },
  plugins: [],
};
