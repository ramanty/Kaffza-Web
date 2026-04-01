import type { ReactNode } from 'react';
import Link from 'next/link';

const NAV = [
  { href: '/admin', label: 'لوحة التحكم', icon: '📊' },
  { href: '/admin/merchants', label: 'التجار', icon: '🏪' },
  { href: '/admin/customers', label: 'العملاء', icon: '🧑‍🤝‍🧑' },
  { href: '/admin/orders', label: 'الطلبات', icon: '🧾' },
  { href: '/admin/disputes', label: 'النزاعات', icon: '⚖️' },
  { href: '/admin/payments', label: 'المدفوعات', icon: '💳' },
  { href: '/admin/settings', label: 'الإعدادات', icon: '⚙️' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div dir="rtl" className="min-h-screen bg-kaffza-bg text-kaffza-text">
      <div className="flex">
        <aside className="hidden h-screen w-[280px] shrink-0 lg:block" style={{ backgroundColor: '#1A2B4A' }}>
          <div className="flex h-full flex-col p-5">
            <div className="flex items-center justify-between">
              <div className="text-lg font-extrabold text-white">Kaffza</div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">Admin</span>
            </div>

            <nav className="mt-6 flex-1 space-y-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
                >
                  <span aria-hidden className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="rounded-xl bg-white/5 p-4">
              <div className="text-sm font-bold text-white">ملاحظة</div>
              <p className="mt-1 text-xs leading-5 text-white/70">لوحة إدارة المنصة (Admin).</p>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <header className="border-b border-black/10 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
              <div className="text-lg font-extrabold text-kaffza-primary">لوحة الإدارة</div>
              <Link className="text-sm font-bold text-kaffza-primary underline" href="/">
                العودة للموقع
              </Link>
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
