'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getPlanCartCount } from '../lib/plan-cart';

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

export function SiteTopBar() {
  const pathname = usePathname();
  const nextLocalePath = buildLocalizedPath(pathname);
  const localeLabel = pathname === '/en' || pathname.startsWith('/en/') ? 'العربية' : 'English';
  const isEn = pathname === '/en' || pathname.startsWith('/en/');
  const [count, setCount] = useState(0);

  useEffect(() => {
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
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-12 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <a
          href="https://kaffza.me"
          className="text-kaffza-primary text-lg font-extrabold"
          aria-label="Kaffza Home"
        >
          Kaffza
        </a>

        <div className="flex items-center gap-3 text-sm">
          {count > 0 ? (
            <Link
              className="text-kaffza-primary relative rounded-full border border-black/10 px-3 py-1 font-bold"
              href={isEn ? '/en/plans/cart' : '/plans/cart'}
              aria-label={isEn ? 'Plan cart' : 'سلة الخطط'}
            >
              {isEn ? 'Cart' : 'السلة'}
              <span className="bg-kaffza-primary ml-2 rounded-full px-2 py-0.5 text-xs text-white">
                {count}
              </span>
            </Link>
          ) : null}
          <Link className="text-kaffza-primary font-bold underline" href={nextLocalePath}>
            {localeLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}
