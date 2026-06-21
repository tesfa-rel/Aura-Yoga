/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          50: '#E2D1C2',
          100: '#E2D1C2',
          200: '#D4BBAC',
          300: '#D4BBAC',
          400: '#98755B',
          500: '#98755B',
          600: '#98755B',
          700: '#5C3422',
          800: '#442913',
          900: '#442913',
        },
        aura: {
          ink: '#241a13',
          bark: '#3b2a1d',
          umber: '#5c4530',
          clay: '#a87f5a',
          sand: '#cdab85',
          cream: '#f2ebe0',
          paper: '#eee5d6',
          ivory: '#f8f4ec',
        },
      },
      fontFamily: {
        sans: ['Jost', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
