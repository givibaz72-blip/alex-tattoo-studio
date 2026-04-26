// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        charcoal: '#121212', // Charcoal
        deepPurple: '#2D1B33', // Deep Purple
        gold: '#D4AF37', // Gold accents
      },
    },
  },
  plugins: [],
} satisfies Config

export default config
