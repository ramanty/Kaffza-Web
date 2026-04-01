import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        kaffza: {
          bg: '#F0F4FA',
          info: '#1A2B4A',
          text: '#4A4A4A',
          primary: '#1B3A6B',
          premium: '#F5A623',
          success: '#22C55E',
          warn: '#F59E0B',
          error: '#EF4444',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
