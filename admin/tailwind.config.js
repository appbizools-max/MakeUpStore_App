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
          brand: '#C2477A',        // Logo's primary brand color
          brandDark: '#9E2D5B',    // Hover / pressed state
          brandLight: '#FFF5F8',   // Lightest background tint
          brandSoft: '#FDF2F8',    // Active / soft badge background
          brandBorder: '#FCE4EC',  // Soft border
          brandBorderHover: '#F8B4CB',
          bg: '#FFFFFF',           // Crisp white background
          pink: '#F5A8C0',
          pinkDeep: '#C2477A',
          pinkSoft: '#FCE4EC',
          softCard: '#FFF5F8',
          text: '#000000',         // Black text throughout
          textMuted: '#1F2937',    // Clean dark readable text
          border: '#FCE4EC',
        }
      },
      fontFamily: {
        sans: ['"Google Sans"', '"Product Sans"', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        body: ['"Google Sans"', '"Product Sans"', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Google Sans"', '"Product Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
