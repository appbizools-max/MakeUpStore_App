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
          bg: '#FFF8FA',
          pink: '#F5A8C0',
          pinkDeep: '#C2477A',
          pinkSoft: '#FCE4EC',
          softCard: '#FDEAF1',
          text: '#3A2430',
          muted: '#8C7078',
          success: '#4C8C5C',
          border: '#FCE4EC',
        }
      },
      fontFamily: {
        sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
