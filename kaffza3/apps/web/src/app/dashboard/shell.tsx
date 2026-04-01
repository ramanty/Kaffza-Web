'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import DashboardSidebar from './sidebar';
import { Button } from '../../components/Button';
import { api } from '../../lib/api';
import { authHeader, clearAuthCookiesClientSide } from '../../lib/auth';
import { clearStoreCookie, useStore } from './store-context';

const NAV = [
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

export default function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/dashboard';
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState<string>('');

  const { stores, storeId, setStoreId, loading: storesLoading, reload: reloadStores } = useStore();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/auth/me', { headers: { ...authHeader(), 'x-client': 'web' } });
        const u = res?.data?.data;
        setUserName(u?.name || u?.email || '');
      } catch {
        // ignore
      }
    })();
  }, []);

  const activeLabel = useMemo(() => NAV.find((n) => isActive(pathname, n.href))?.label || 'لوحة التحكم', [pathname]);

  async function logout() {
    // 1) revoke refresh token (best effort). If it fails, continue logout.
    try {
      await api.post('/auth/logout', {}, { headers: { 'x-client': 'web' } });
    } catch {
      try {
        await api.post('/auth/refresh/revoke', {}, { headers: { 'x-client': 'web' } });
      } catch {
        // ignore
      }
    }

    // 2) clear cookies
    try {
      clearAuthCookiesClientSide();
      clearStoreCookie();
    } catch {
      // ignore
    }

    // 3) redirect
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-kaffza-bg text-kaffza-text">
      {/* Desktop */}
      <div className="hidden md:flex md:flex-row-reverse">
        <DashboardSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            title={activeLabel}
            userName={userName}
            onLogout={logout}
            onOpenMobile={() => setMobileOpen(true)}
            stores={stores}
            storeId={storeId}
            onChangeStore={(id) => setStoreId(id)}
            storesLoading={storesLoading}
            onReloadStores={() => reloadStores()}
          />
          <main className="min-w-0 flex-1 p-4 md:p-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <Header
          title={activeLabel}
          userName={userName}
          onLogout={logout}
          onOpenMobile={() => setMobileOpen(true)}
          mobile
          stores={stores}
          storeId={storeId}
          onChangeStore={(id) => setStoreId(id)}
          storesLoading={storesLoading}
          onReloadStores={() => reloadStores()}
        />

        {mobileOpen ? (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <div dir="rtl" className="absolute right-0 top-0 h-full w-[82%] max-w-xs bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-black/10 p-4">
                <div className="text-sm font-extrabold text-kaffza-primary">القائمة</div>
                <button className="text-sm font-bold text-kaffza-text/70" onClick={() => setMobileOpen(false)}>
                  إغلاق
                </button>
              </div>

              <div className="border-b border-black/10 p-4">
                <div className="text-xs font-bold text-kaffza-text/70">المتجر</div>
                <div className="mt-2">
                  <StoreSwitcher
                    stores={stores}
                    storeId={storeId}
                    onChange={(id) => setStoreId(id)}
                    loading={storesLoading}
                    onReload={() => reloadStores()}
                  />
                </div>
              </div>

              <nav className="p-3">
                {NAV.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={
                        'mb-1 flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ' +
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
            </div>
          </div>
        ) : null}

        <main className="p-4">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/10 bg-white">
          <div className="mx-auto grid max-w-6xl grid-cols-5">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    'flex flex-col items-center justify-center gap-1 px-2 py-2 text-[11px] ' +
                    (active ? 'text-kaffza-primary' : 'text-kaffza-text/70')
                  }
                >
                  <span className="text-base" aria-hidden>
                    {item.icon}
                  </span>
                  <span className="font-bold">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="h-16" />
      </div>
    </div>
  );
}

function Header({
  title,
  userName,
  onLogout,
  onOpenMobile,
  mobile,
  stores,
  storeId,
  onChangeStore,
  storesLoading,
  onReloadStores,
}: {
  title: string;
  userName: string;
  onLogout: () => void;
  onOpenMobile: () => void;
  mobile?: boolean;
  stores: { id: string; nameAr?: string; nameEn?: string; subdomain?: string }[];
  storeId: string | null;
  onChangeStore: (id: string) => void;
  storesLoading: boolean;
  onReloadStores: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {mobile ? (
            <button
              onClick={onOpenMobile}
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-bold text-kaffza-text"
              aria-label="فتح القائمة"
            >
              ☰
            </button>
          ) : null}

          <div className="min-w-0">
            <div className="truncate text-sm text-kaffza-text/70">{userName ? `مرحباً، ${userName}` : 'لوحة التاجر'}</div>
            <div className="truncate text-base font-extrabold text-kaffza-primary">{title}</div>
          </div>

          <div className="hidden sm:block">
            <StoreSwitcher
              stores={stores}
              storeId={storeId}
              onChange={onChangeStore}
              loading={storesLoading}
              onReload={onReloadStores}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" onClick={onLogout}>
            تسجيل خروج
          </Button>
        </div>
      </div>

      <div className="sm:hidden border-t border-black/10 px-4 py-3">
        <StoreSwitcher
          stores={stores}
          storeId={storeId}
          onChange={onChangeStore}
          loading={storesLoading}
          onReload={onReloadStores}
        />
      </div>
    </header>
  );
}

function StoreSwitcher({
  stores,
  storeId,
  onChange,
  loading,
  onReload,
}: {
  stores: { id: string; nameAr?: string; nameEn?: string; subdomain?: string }[];
  storeId: string | null;
  onChange: (id: string) => void;
  loading: boolean;
  onReload: () => void;
}) {
  const multiple = stores.length > 1;

  if (!multiple) {
    const s = stores[0];
    const label = s ? s.nameAr || s.nameEn || s.subdomain || s.id : '—';
    return (
      <div className="flex items-center gap-2 rounded-lg bg-kaffza-bg px-3 py-2 text-xs text-kaffza-text">
        <span className="font-bold">المتجر:</span>
        <span className="font-extrabold text-kaffza-primary">{loading ? '...' : label}</span>
        <button className="underline text-kaffza-text/70" onClick={onReload}>
          تحديث
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="max-w-[220px] rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-bold text-kaffza-text"
        value={storeId || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
      >
        {stores.map((s) => {
          const label = s.nameAr || s.nameEn || s.subdomain || s.id;
          return (
            <option key={s.id} value={s.id}>
              {label}
            </option>
          );
        })}
      </select>
      <button className="text-xs font-bold text-kaffza-text/70 underline" onClick={onReload}>
        تحديث
      </button>
    </div>
  );
}
