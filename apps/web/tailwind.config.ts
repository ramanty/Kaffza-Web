import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        // Legacy colors kept to prevent breaking old pages temporarily
        kaffza: {
          bg: '#F0F4FA',
          'dark-blue': '#1A2B4A',
          text: '#4A4A4A',
          primary: '#1B3A6B',
          premium: '#F5A623',
          secondary: '#FFFFFF',
          success: '#22C55E',
          warn: '#F59E0B',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
          order: '#2A5298',
        },
      },
      fontFamily: {
        tajawal: ['var(--font-tajawal)'],
        inter: ['var(--font-inter)'],
        sans: ['var(--font-sans)'],
      },
    },
  },
  plugins: [],
} satisfies Config;
