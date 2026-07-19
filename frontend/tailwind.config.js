/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cozy: {
          bg: '#FEFDF9',
          card: '#FAF6EE',
          darkBg: '#1A1813',
          darkCard: '#27241D',
          lavender: {
            light: '#F3E5F5',
            DEFAULT: '#E1BEE7',
            dark: '#CE93D8',
            deep: '#8E24AA'
          },
          mint: {
            light: '#E8F5E9',
            DEFAULT: '#C8E6C9',
            dark: '#A5D6A7',
            deep: '#4CAF50'
          },
          sky: {
            light: '#E3F2FD',
            DEFAULT: '#BBDEFB',
            dark: '#90CAF9',
            deep: '#2196F3'
          },
          peach: {
            light: '#FFE0B2',
            DEFAULT: '#FFCC80',
            dark: '#FFB74D',
            deep: '#FF9800'
          },
          yellow: {
            light: '#FFFDE7',
            DEFAULT: '#FFF9C4',
            dark: '#FFF59D',
            deep: '#FBC02D'
          },
          cream: {
            light: '#FFFDF9',
            DEFAULT: '#FAF5EA',
            dark: '#EADFC9'
          }
        }
      },
      fontFamily: {
        cozy: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        cozy: '0 8px 30px rgba(220, 205, 180, 0.25)',
        cozyInner: 'inset 0 2px 4px rgba(220, 205, 180, 0.15)',
        cozyHover: '0 12px 40px rgba(220, 205, 180, 0.35)',
      },
      borderRadius: {
        'cozy': '20px',
        'cozy-lg': '32px',
      }
    },
  },
  plugins: [],
}
