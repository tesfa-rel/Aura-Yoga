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
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
