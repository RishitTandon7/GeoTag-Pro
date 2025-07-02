/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#14213D',
          dark: '#000000',
          light: '#14213D',
        },
        accent: {
          DEFAULT: '#FCA311',
          dark: '#FCA311',
          light: '#FCA311',
        },
        neutral: {
          DEFAULT: '#FFFFFF',
          50: '#FFFFFF',
          100: '#FFFFFF',
          200: '#FFFFFF',
          300: '#FFFFFF',
          400: '#FFFFFF',
          500: '#FFFFFF',
          600: '#14213D',
          700: '#14213D',
          800: '#000000',
          900: '#000000',
        }
      }
    },
  },
  plugins: [],
};
