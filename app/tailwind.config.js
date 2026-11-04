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
          canvas: '#FFF5F8',
          card: '#FFFFFF',
          surface: '#FFF0F5',
          border: '#F4DCE6',
          borderAccent: '#E8C2D3',
          pink: '#F5A8C0',
          pinkDeep: '#C2477A',
          pinkDark: '#9E2D5B',
          pinkSoft: '#FCE4EC',
          pinkLight: '#FCEAF0',
          text: '#2B1520',
          textMain: '#3A2430',
          muted: '#705060',
          subtle: '#8E6D7E',
          success: '#4C8C5C',
          warningBg: '#FDEAF1',
        }
      },
      fontFamily: {
        sans: ['Manrope-Regular', 'Manrope_400Regular', 'Manrope', '-apple-system', 'sans-serif'],
        body: ['Manrope-Regular', 'Manrope_400Regular', 'Manrope', '-apple-system', 'sans-serif'],
        display: ['Manrope-SemiBold', 'Manrope_600SemiBold', 'Manrope-Bold', 'Manrope_700Bold', 'sans-serif'],
        regular: ['Manrope-Regular', 'Manrope_400Regular', 'sans-serif'],
        medium: ['Manrope-Medium', 'Manrope_500Medium', 'sans-serif'],
        semibold: ['Manrope-SemiBold', 'Manrope_600SemiBold', 'sans-serif'],
        bold: ['Manrope-Bold', 'Manrope_700Bold', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
