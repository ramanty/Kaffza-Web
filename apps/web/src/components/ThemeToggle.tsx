'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-card text-card-foreground/10 animate-pulse" />;

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-card text-card-foreground/10 transition-colors"
      aria-label="Toggle Theme"
      title="تبديل الوضع الليلي"
    >
      {theme === 'dark' ? '🌞' : '🌙'}
    </button>
  );
}
