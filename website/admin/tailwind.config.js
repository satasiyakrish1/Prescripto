/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      gridTemplateColumns:{
        'auto':'repeat(auto-fill, minmax(200px, 1fr))'
      },
      colors:{
        'primary': {
          DEFAULT: '#5F6FFF',
          50: '#F0F1FF',
          100: '#E0E3FF',
          200: '#C1C7FF',
          300: '#A2ABFF',
          400: '#838FFF',
          500: '#5F6FFF',
          600: '#4C59CC',
          700: '#394399',
          800: '#262C66',
          900: '#131633',
        }
      }
    },
  },
  plugins: [],
}