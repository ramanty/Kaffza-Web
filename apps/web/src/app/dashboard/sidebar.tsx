'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

type NavItem = { href: string; label: string; icon?: string };

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'نظرة عامة', icon: '📊' },
  { href: '/dashboard/products', label: 'المنتجات', icon: '📦' },
  { href: '/dashboard/categories', label: 'التصنيفات', icon: '🏷️' },
  { href: '/dashboard/orders', label: 'الطلبات', icon: '🧾' },
  { href: '/dashboard/shipping', label: 'الشحن', icon: '🚚' },
  { href: '/dashboard/disputes', label: 'النزاعات', icon: '⚖️' },
  { href: '/dashboard/wallet', label: 'المحفظة', icon: '👜' },
  { href: '/dashboard/settings', label: 'الإعدادات', icon: '⚙️' },
];

function isActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(href + '/');
}

export default function DashboardSidebar() {
  const pathname = usePathname() || '/dashboard';
  const [logoError, setLogoError] = useState(false);

  return (
    <aside className="h-screen w-[280px] shrink-0 bg-[#1A2B4A]">
      <div className="flex h-full flex-col p-5">
        {/* Logo header */}
        <div className="mb-4 flex flex-col items-center border-b border-white/10 pb-4 pt-2">
          {logoError ? (
            /* Text fallback shown when /public/logo.png is absent */
            <div className="flex select-none flex-col items-center leading-tight">
              <span className="text-kaffza-premium text-2xl font-extrabold tracking-wide">
                Kaffza
              </span>
              <span className="text-sm font-bold tracking-widest text-white/80">قفزة</span>
            </div>
          ) : (
            /* Logo image – place your logo at /public/logo.png */
            <img
              src="/logo.png"
              alt="قفزة Kaffza"
              className="h-12 w-auto object-contain"
              onError={() => setLogoError(true)}
            />
          )}
          <span className="bg-kaffza-premium/20 text-kaffza-premium mt-2 rounded-full px-3 py-1 text-xs font-semibold">
            تاجر
          </span>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-colors ' +
                  (active
                    ? 'bg-kaffza-primary font-bold text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white')
                }
              >
                <span aria-hidden className="text-base">
                  {item.icon}
                </span>
                <span className="font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="rounded-xl bg-white/10 p-4">
          <div className="text-kaffza-premium text-sm font-bold">ملاحظة</div>
          <p className="mt-1 text-xs leading-5 text-white/70">
            هذه لوحة تحكم التاجر (نسخة أولية). استخدم السويتشر بالأعلى لاختيار المتجر.
          </p>
        </div>
      </div>
    </aside>
  );
}
