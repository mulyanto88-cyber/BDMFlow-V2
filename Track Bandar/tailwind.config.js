/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#090d16',
        card: '#0f172a',
        primary: {
          DEFAULT: '#22d3ee',
          foreground: '#090d16',
        },
        gold: {
          DEFAULT: '#f59e0b',
          glow: '#d97706',
        },
        accent: '#14b8a6',
      },
    },
  },
  plugins: [],
}
