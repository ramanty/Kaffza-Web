'use client';

import Link from 'next/link';
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

  return (
    <aside className="h-screen w-[280px] shrink-0 border-l border-black/10 bg-white">
      <div className="flex h-full flex-col p-5">
        <div className="flex items-center justify-between">
          <div className="text-lg font-extrabold text-kaffza-primary">Kaffza</div>
          <span className="rounded-full bg-kaffza-primary/10 px-3 py-1 text-xs font-semibold text-kaffza-primary">تاجر</span>
        </div>

        <nav className="mt-6 flex-1 space-y-1">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  'flex items-center gap-3 rounded-lg px-4 py-2 text-sm transition-colors ' +
                  (active
                    ? 'bg-kaffza-primary text-white'
                    : 'text-kaffza-text hover:bg-kaffza-primary/10 hover:text-kaffza-primary')
                }
              >
                <span aria-hidden className="text-base">{item.icon}</span>
                <span className="font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="rounded-xl bg-kaffza-bg p-4">
          <div className="text-sm font-bold text-kaffza-primary">ملاحظة</div>
          <p className="mt-1 text-xs leading-5 text-kaffza-text/80">
            هذه لوحة تحكم التاجر (نسخة أولية). استخدم السويتشر بالأعلى لاختيار المتجر.
          </p>
        </div>
      </div>
    </aside>
  );
}
