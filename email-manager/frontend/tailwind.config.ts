import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ceo: { DEFAULT: '#ef4444', light: '#fef2f2', badge: '#dc2626' },
        admin: { DEFAULT: '#f97316', light: '#fff7ed', badge: '#ea580c' },
        guest: { DEFAULT: '#3b82f6', light: '#eff6ff', badge: '#2563eb' },
        supplier: { DEFAULT: '#22c55e', light: '#f0fdf4', badge: '#16a34a' },
        staff: { DEFAULT: '#a855f7', light: '#faf5ff', badge: '#9333ea' },
      },
    },
  },
  plugins: [],
}

export default config
