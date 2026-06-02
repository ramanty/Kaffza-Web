'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getPlanCartCount } from '../lib/plan-cart';
import { api } from '../lib/api';
import { authHeader } from '../lib/auth';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { Button } from './Button';

function buildLocalizedPath(pathname: string) {
  const protectedOnly = ['/dashboard', '/admin', '/account', '/merchant', '/onboarding'];
  if (protectedOnly.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return pathname === '/en' || pathname.startsWith('/en/') ? '/' : '/en';
  }

  const isEn = pathname === '/en' || pathname.startsWith('/en/');
  if (isEn) {
    const stripped = pathname.replace(/^\/en(?=\/|$)/, '');
    return stripped || '/';
  }
  return pathname === '/' ? '/en' : `/en${pathname}`;
}

function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="rounded-full"
      aria-label="Toggle Theme"
      title="تبديل الوضع الليلي"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}

export function SiteTopBar() {
  const pathname = usePathname();
  const nextLocalePath = buildLocalizedPath(pathname);
  const localeLabel = pathname === '/en' || pathname.startsWith('/en/') ? 'العربية' : 'English';
  const isEn = pathname === '/en' || pathname.startsWith('/en/');
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(0);
  const [userState, setUserState] = useState({ loaded: false, loggedIn: false, hasStore: false });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/auth/me', { headers: { ...authHeader(), 'x-client': 'web' } });
        if (res?.data?.success) {
          try {
            const storesRes = await api.get('/stores/my', { headers: { ...authHeader(), 'x-client': 'web' } });
            const arr = storesRes?.data?.data;
            const hasStore = Array.isArray(arr) && arr.length > 0;
            if (mounted) setUserState({ loaded: true, loggedIn: true, hasStore });
          } catch {
            if (mounted) setUserState({ loaded: true, loggedIn: true, hasStore: false });
          }
        } else {
          if (mounted) setUserState({ loaded: true, loggedIn: false, hasStore: false });
        }
      } catch {
        if (mounted) setUserState({ loaded: true, loggedIn: false, hasStore: false });
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setMounted(true);
    const update = () => setCount(getPlanCartCount());
    update();
    window.addEventListener('storage', update);
    window.addEventListener('kaffza-plan-cart-updated', update);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener('kaffza-plan-cart-updated', update);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/60 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <a
          href="https://kaffza.me"
          className="text-primary text-xl font-extrabold tracking-tight"
          aria-label="Kaffza Home"
        >
          Kaffza
        </a>

        <div className="flex items-center gap-2 sm:gap-4 text-sm">
          {mounted && count > 0 ? (
            <Link
              className="text-primary relative rounded-full border border-border px-3 py-1 font-bold"
              href={isEn ? '/en/plans/cart' : '/plans/cart'}
              aria-label={isEn ? 'Plan cart' : 'سلة الخطط'}
            >
              {isEn ? 'Cart' : 'السلة'}
              <span className="bg-primary ml-2 rounded-full px-2 py-0.5 text-xs text-primary-foreground">
                {count}
              </span>
            </Link>
          ) : null}
          <Link className="text-muted-foreground hover:text-foreground font-medium transition-colors" href={nextLocalePath}>
            {localeLabel}
          </Link>
          <ThemeToggle />

          {!mounted || !userState.loaded ? (
            <div className="w-24 h-9 bg-muted animate-pulse rounded-full" />
          ) : userState.hasStore ? (
            <Button asChild className="rounded-full">
              <Link href={isEn ? '/en/dashboard' : '/dashboard'}>
                {isEn ? 'Dashboard' : 'لوحة التحكم'}
              </Link>
            </Button>
          ) : userState.loggedIn ? (
            <Button asChild className="rounded-full">
              <Link href={isEn ? '/en/onboarding' : '/onboarding'}>
                {isEn ? 'Open Your Store' : 'افتح متجرك'}
              </Link>
            </Button>
          ) : (
            <Button asChild className="rounded-full">
              <Link href={isEn ? '/en/merchant/login' : '/merchant/login'}>
                {isEn ? 'Start Now' : 'ابدأ الآن'}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
