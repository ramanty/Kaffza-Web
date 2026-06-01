'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type NavItem = { href: string; label: string; icon?: string };

const NAV_AR: NavItem[] = [
  { href: '/dashboard', label: 'نظرة عامة', icon: '📊' },
  { href: '/dashboard/products', label: 'المنتجات', icon: '📦' },
  { href: '/dashboard/categories', label: 'التصنيفات', icon: '🏷️' },
  { href: '/dashboard/orders', label: 'الطلبات', icon: '🧾' },
  { href: '/dashboard/onboarding', label: 'الانطلاقة', icon: '🚀' },
  { href: '/dashboard/growth', label: 'النمو والتسويق', icon: '📣' },
  { href: '/dashboard/campaigns', label: 'الحملات', icon: '🎯' },
  { href: '/dashboard/analytics', label: 'التحليلات', icon: '📈' },
  { href: '/dashboard/shipping', label: 'الشحن', icon: '🚚' },
  { href: '/dashboard/disputes', label: 'النزاعات', icon: '⚖️' },
  { href: '/dashboard/wallet', label: 'المحفظة', icon: '👜' },
  { href: '/dashboard/integrations', label: 'التكاملات', icon: '🧩' },
  { href: '/dashboard/settings', label: 'الإعدادات', icon: '⚙️' },
];

const NAV_EN: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: '📊' },
  { href: '/dashboard/products', label: 'Products', icon: '📦' },
  { href: '/dashboard/categories', label: 'Categories', icon: '🏷️' },
  { href: '/dashboard/orders', label: 'Orders', icon: '🧾' },
  { href: '/dashboard/onboarding', label: 'Launch Plan', icon: '🚀' },
  { href: '/dashboard/growth', label: 'Growth & Marketing', icon: '📣' },
  { href: '/dashboard/campaigns', label: 'Campaigns', icon: '🎯' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: '📈' },
  { href: '/dashboard/shipping', label: 'Shipping', icon: '🚚' },
  { href: '/dashboard/disputes', label: 'Disputes', icon: '⚖️' },
  { href: '/dashboard/wallet', label: 'Wallet', icon: '👜' },
  { href: '/dashboard/integrations', label: 'Integrations', icon: '🧩' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
];

function isActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(href + '/');
}

export default function DashboardSidebar() {
  const pathname = usePathname() || '/dashboard';
  const [isEn, setIsEn] = useState(false);
  const nav = isEn ? NAV_EN : NAV_AR;
  const withLang = (href: string) => (isEn ? `${href}?lang=en` : href);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsEn(new URLSearchParams(window.location.search).get('lang') === 'en');
  }, [pathname]);

  return (
    <aside className="h-full w-64 shrink-0 overflow-y-auto bg-[#1A2B4A]">
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
            {isEn ? 'Merchant' : 'تاجر'}
          </span>
        </div>

        <nav className="flex-1 space-y-1">
          {nav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={withLang(item.href)}
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
          <div className="text-kaffza-premium text-sm font-bold">{isEn ? 'Note' : 'ملاحظة'}</div>
          <p className="mt-1 text-xs leading-5 text-white/70">
            {isEn
              ? 'This is the merchant dashboard (preview). Use the store switcher above to choose a store.'
              : 'هذه لوحة تحكم التاجر (نسخة أولية). استخدم السويتشر بالأعلى لاختيار المتجر.'}
          </p>
        </div>
      </div>
    </aside>
  );
}
