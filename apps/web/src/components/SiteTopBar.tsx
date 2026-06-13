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

import { Menu, X } from 'lucide-react';

export function SiteTopBar() {
  const pathname = usePathname();
  const nextLocalePath = buildLocalizedPath(pathname);
  const localeLabel = pathname === '/en' || pathname.startsWith('/en/') ? 'العربية' : 'English';
  const isEn = pathname === '/en' || pathname.startsWith('/en/');
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(0);
  const [userState, setUserState] = useState({ loaded: false, loggedIn: false, hasStore: false });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    <header className="sticky top-0 z-50 w-full border-b border-border glass-nav">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link
            href={isEn ? '/en' : '/'}
            className="text-primary text-2xl font-black tracking-tight flex items-center gap-2"
            aria-label="Kaffza Home"
          >
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl w-8 h-8 flex items-center justify-center text-white shadow-lg text-lg">K</span>
            <span className="hidden sm:inline-block">Kaffza</span>
          </Link>
          
          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium ml-4 border-l border-border pl-6 rtl:border-l-0 rtl:border-r rtl:ml-0 rtl:mr-4 rtl:pl-0 rtl:pr-6">
            <Link href={isEn ? '/en/features' : '/features'} className="text-muted-foreground hover:text-foreground transition-colors">
              {isEn ? 'Features' : 'المميزات'}
            </Link>
            <Link href={isEn ? '/en/pricing' : '/pricing'} className="text-muted-foreground hover:text-foreground transition-colors">
              {isEn ? 'Pricing' : 'الأسعار'}
            </Link>
            <Link href={isEn ? '/en/contact' : '/contact'} className="text-muted-foreground hover:text-foreground transition-colors">
              {isEn ? 'Contact' : 'اتصل بنا'}
            </Link>
          </nav>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4 text-sm">
          {mounted && count > 0 ? (
            <Link
              className="text-primary relative rounded-full border border-border px-4 py-2 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              href={isEn ? '/en/plans/cart' : '/plans/cart'}
              aria-label={isEn ? 'Plan cart' : 'سلة الخطط'}
            >
              {isEn ? 'Cart' : 'السلة'}
              <span className="bg-primary ml-2 rtl:mr-2 rtl:ml-0 rounded-full px-2 py-0.5 text-xs text-primary-foreground">
                {count}
              </span>
            </Link>
          ) : null}
          <Link className="text-muted-foreground hover:text-foreground font-medium transition-colors border border-transparent hover:border-border px-3 py-1.5 rounded-full" href={nextLocalePath}>
            {localeLabel}
          </Link>
          <ThemeToggle />

          {!mounted || !userState.loaded ? (
            <div className="w-24 h-10 bg-muted animate-pulse rounded-full" />
          ) : userState.hasStore ? (
            <Button asChild className="rounded-full px-6 bg-omani-amber hover:bg-celestial-gold text-midnight-void font-bold text-white font-bold shadow-[0_0_20px_rgba(37,99,235,0.3)] border-0">
              <Link href={isEn ? '/en/dashboard' : '/dashboard'}>
                {isEn ? 'Dashboard' : 'لوحة التحكم'}
              </Link>
            </Button>
          ) : userState.loggedIn ? (
            <Button asChild className="rounded-full px-6 bg-omani-amber hover:bg-celestial-gold text-midnight-void font-bold text-white font-bold shadow-[0_0_20px_rgba(37,99,235,0.3)] border-0">
              <Link href={isEn ? '/en/onboarding' : '/onboarding'}>
                {isEn ? 'Open Your Store' : 'افتح متجرك'}
              </Link>
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button asChild variant="ghost" className="rounded-full font-bold">
                <Link href={isEn ? '/en/merchant/login' : '/merchant/login'}>
                  {isEn ? 'Log in' : 'دخول'}
                </Link>
              </Button>
              <Button asChild className="rounded-full px-6 bg-omani-amber hover:bg-celestial-gold text-midnight-void font-bold text-white font-bold shadow-[0_0_20px_rgba(37,99,235,0.3)] border-0">
                <Link href={isEn ? '/en/merchant/register' : '/merchant/register'}>
                  {isEn ? 'Start Now' : 'ابدأ الآن'}
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="flex md:hidden items-center gap-2">
          {mounted && count > 0 ? (
            <Link
              className="text-primary relative rounded-full border border-border px-3 py-1 font-bold text-xs"
              href={isEn ? '/en/plans/cart' : '/plans/cart'}
            >
              {isEn ? 'Cart' : 'السلة'}
              <span className="bg-primary ml-1 rtl:mr-1 rtl:ml-0 rounded-full px-1.5 py-0.5 text-[10px] text-primary-foreground">
                {count}
              </span>
            </Link>
          ) : null}
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} className="rounded-full" aria-label="Menu">
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-background border-b border-border shadow-xl px-4 py-6 flex flex-col gap-6" dir={isEn ? 'ltr' : 'rtl'}>
          <nav className="flex flex-col gap-4 text-lg font-bold">
            <Link href={isEn ? '/en/features' : '/features'} onClick={() => setIsMenuOpen(false)} className="border-b border-border pb-2">
              {isEn ? 'Features' : 'المميزات'}
            </Link>
            <Link href={isEn ? '/en/help' : '/help'} onClick={() => setIsMenuOpen(false)} className="border-b border-border pb-2">
              {isEn ? 'Help Center' : 'الحلول'}
            </Link>
            <Link href={isEn ? '/en/pricing' : '/pricing'} onClick={() => setIsMenuOpen(false)} className="border-b border-border pb-2">
              {isEn ? 'Pricing' : 'الأسعار'}
            </Link>
            <Link href={isEn ? '/en/trust' : '/trust'} onClick={() => setIsMenuOpen(false)} className="border-b border-border pb-2">
              {isEn ? 'Trust & Safety' : 'من نحن'}
            </Link>
            <Link href={isEn ? '/en/contact' : '/contact'} onClick={() => setIsMenuOpen(false)} className="border-b border-border pb-2">
              {isEn ? 'Contact Us' : 'تواصل معنا'}
            </Link>
          </nav>

          <div className="flex flex-col gap-4">
            <Link className="text-center font-medium border border-border py-3 rounded-xl bg-card" href={nextLocalePath} onClick={() => setIsMenuOpen(false)}>
              {isEn ? 'تصفح بالعربية' : 'Browse in English'}
            </Link>

            {!mounted || !userState.loaded ? (
              <div className="w-full h-12 bg-muted animate-pulse rounded-xl" />
            ) : userState.hasStore ? (
              <Button asChild className="w-full py-6 text-lg rounded-xl bg-omani-amber hover:bg-celestial-gold text-midnight-void font-bold text-white font-bold border-0">
                <Link href={isEn ? '/en/dashboard' : '/dashboard'} onClick={() => setIsMenuOpen(false)}>
                  {isEn ? 'Dashboard' : 'لوحة التحكم'}
                </Link>
              </Button>
            ) : userState.loggedIn ? (
              <Button asChild className="w-full py-6 text-lg rounded-xl bg-omani-amber hover:bg-celestial-gold text-midnight-void font-bold text-white font-bold border-0">
                <Link href={isEn ? '/en/onboarding' : '/onboarding'} onClick={() => setIsMenuOpen(false)}>
                  {isEn ? 'Open Your Store' : 'افتح متجرك'}
                </Link>
              </Button>
            ) : (
              <div className="flex flex-col gap-3">
                <Button asChild variant="outline" className="w-full py-6 text-lg rounded-xl font-bold">
                  <Link href={isEn ? '/en/merchant/login' : '/merchant/login'} onClick={() => setIsMenuOpen(false)}>
                    {isEn ? 'Log in' : 'تسجيل الدخول'}
                  </Link>
                </Button>
                <Button asChild className="w-full py-6 text-lg rounded-xl bg-omani-amber hover:bg-celestial-gold text-midnight-void font-bold text-white font-bold border-0 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                  <Link href={isEn ? '/en/merchant/register' : '/merchant/register'} onClick={() => setIsMenuOpen(false)}>
                    {isEn ? 'Start Now' : 'ابدأ الآن'}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
