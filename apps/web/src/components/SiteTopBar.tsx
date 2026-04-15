'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
          <Link className="text-kaffza-primary font-bold underline" href={nextLocalePath}>
            {localeLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}
