import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Kaffza Design System (canonical flat names) ──────────────────
        background: '#F0F4FA',
        'dark-blue': '#1A2B4A',
        primary: '#1B3A6B',
        premium: '#F5A623',
        secondary: '#FFFFFF',
        error: '#EF4444',
        success: '#22C55E',
        warning: '#F59E0B',
        info: '#3B82F6',
        order: '#2A5298',
        // ── kaffza.* namespace (backward-compat) ─────────────────────────
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
        tajawal: ['Tajawal', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        sans: ['Tajawal', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
