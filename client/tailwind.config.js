/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E5E7EB',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#111827',
          700: '#080D1C',
          800: '#020617',
          900: '#020617',
        },
        game: {
          level1: '#111827',
          level2: '#111827',
          level3: '#111827',
        },
      },
    },
  },
  plugins: [],
}
