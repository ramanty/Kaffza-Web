import type { ReactNode } from 'react';
import Link from 'next/link';

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div dir="rtl" className="min-h-screen bg-kaffza-bg text-kaffza-text">
      <header className="border-b border-black/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <div>
            <div className="text-xs text-kaffza-text/70">منطقة العميل</div>
            <div className="text-xl font-extrabold text-kaffza-primary">حسابي</div>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <Link className="font-bold text-kaffza-primary underline" href="/account">الملف الشخصي</Link>
            <Link className="font-bold text-kaffza-primary underline" href="/account/orders">طلباتي</Link>
            <Link className="text-xs font-bold text-kaffza-text/70 underline" href="/store">تسوق</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
