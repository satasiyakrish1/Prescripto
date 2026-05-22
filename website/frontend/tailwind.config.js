/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      gridTemplateColumns: {
        'auto': 'repeat(auto-fill, minmax(200px, 1fr))'
      },
      colors: {
        'primary': {
          50: '#eef0ff',
          100: '#d9ddff',
          200: '#b8bfff',
          300: '#97a2ff',
          400: '#7884ff',
          500: '#5f6FFF',
          600: '#4c59cc',
          700: '#394399',
          800: '#262c66',
          900: '#131633',
          DEFAULT: '#5f6FFF'
        },
        'accent': {
          teal: '#00d4aa',
          purple: '#8b5cf6',
          pink: '#ec4899',
          orange: '#f97316'
        },
        'dark': {
          bg: '#111827',
          card: '#1f2937',
          text: '#f9fafb',
          muted: '#9ca3af',
          border: '#374151'
        }
      },
      fontFamily: {
        'sans': ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
        'outfit': ['Outfit', 'sans-serif'],
        'inter': ['Inter', 'sans-serif']
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'gradient': 'gradientShift 8s ease infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' }
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        }
      },
      boxShadow: {
        'glow': '0 0 20px rgba(95, 111, 255, 0.3)',
        'glow-lg': '0 0 30px rgba(95, 111, 255, 0.4)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}