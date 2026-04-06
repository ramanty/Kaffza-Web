'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Dark-slate sidebar colour — distinct from the Merchant Dashboard (#1B3A6B) */
const ADMIN_SIDEBAR_BG = '#0F172A';

const NAV = [
  { href: '/admin', label: 'نظرة عامة', icon: '📊' },
  { href: '/admin/merchants', label: 'التجار', icon: '🏪' },
  { href: '/admin/payouts', label: 'طلبات السحب', icon: '🏦' },
  { href: '/admin/customers', label: 'العملاء', icon: '🧑‍🤝‍🧑' },
  { href: '/admin/orders', label: 'الطلبات', icon: '🧾' },
  { href: '/admin/disputes', label: 'النزاعات', icon: '⚖️' },
  { href: '/admin/payments', label: 'المدفوعات', icon: '💳' },
  { href: '/admin/withdrawals', label: 'السحوبات (قديم)', icon: '💸' },
  { href: '/admin/settings', label: 'الإعدادات', icon: '⚙️' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-800">
      <div className="flex">
        {/* ── Sidebar ── */}
        <aside
          className="hidden h-screen w-[260px] shrink-0 flex-col overflow-y-auto lg:flex"
          style={{ backgroundColor: ADMIN_SIDEBAR_BG, position: 'sticky', top: 0 }}
        >
          <div className="flex h-full flex-col p-5">
            {/* Brand */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="text-xl font-extrabold tracking-tight text-white">Kaffza</div>
              <span className="rounded-full border border-indigo-500/30 bg-indigo-500/20 px-3 py-0.5 text-xs font-bold text-indigo-300">
                Super Admin
              </span>
            </div>

            {/* Nav */}
            <nav className="mt-5 flex-1 space-y-0.5">
              {NAV.map((item) => {
                const active =
                  item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-indigo-600/30 text-white'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span aria-hidden className="text-base">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer note */}
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs leading-5 text-slate-400">منصة قفزة — لوحة الإدارة العليا</p>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur"
            style={{ borderBottomColor: '#e2e8f0' }}
          >
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                {/* Mobile brand */}
                <div
                  className="flex items-center gap-2 text-sm font-extrabold lg:hidden"
                  style={{ color: ADMIN_SIDEBAR_BG }}
                >
                  <span>Kaffza</span>
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                    Admin
                  </span>
                </div>
                <div
                  className="hidden text-base font-extrabold lg:block"
                  style={{ color: ADMIN_SIDEBAR_BG }}
                >
                  لوحة إدارة المنصة
                </div>
              </div>
              <Link
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                href="/"
              >
                العودة للموقع
              </Link>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
