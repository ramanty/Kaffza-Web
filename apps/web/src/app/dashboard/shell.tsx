'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import DashboardSidebar from './sidebar';
import { Button } from '../../components/Button';
import { NotificationBell } from '../../components/NotificationBell';
import { api } from '../../lib/api';
import { authHeader, clearAuthCookiesClientSide } from '../../lib/auth';
import { clearStoreCookie, useStore } from './store-context';

const NAV_AR = [
  { href: '/dashboard', label: 'نظرة عامة', icon: '📊' },
  { href: '/dashboard/products', label: 'المنتجات', icon: '📦' },
  { href: '/dashboard/categories', label: 'التصنيفات', icon: '🏷️' },
  { href: '/dashboard/orders', label: 'الطلبات', icon: '🧾' },
  { href: '/dashboard/shipping', label: 'الشحن', icon: '🚚' },
  { href: '/dashboard/disputes', label: 'النزاعات', icon: '⚖️' },
  { href: '/dashboard/wallet', label: 'المحفظة', icon: '👜' },
  { href: '/dashboard/settings', label: 'الإعدادات', icon: '⚙️' },
];

const NAV_EN = [
  { href: '/dashboard', label: 'Overview', icon: '📊' },
  { href: '/dashboard/products', label: 'Products', icon: '📦' },
  { href: '/dashboard/categories', label: 'Categories', icon: '🏷️' },
  { href: '/dashboard/orders', label: 'Orders', icon: '🧾' },
  { href: '/dashboard/shipping', label: 'Shipping', icon: '🚚' },
  { href: '/dashboard/disputes', label: 'Disputes', icon: '⚖️' },
  { href: '/dashboard/wallet', label: 'Wallet', icon: '👜' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
];

function isActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(href + '/');
}

export default function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/dashboard';
  const [isEn, setIsEn] = useState(false);
  const nav = isEn ? NAV_EN : NAV_AR;
  const withLang = (href: string) => (isEn ? `${href}?lang=en` : href);
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsEn(new URLSearchParams(window.location.search).get('lang') === 'en');
  }, [pathname]);

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

  const activeLabel = useMemo(
    () =>
      nav.find((n) => isActive(pathname, n.href))?.label || (isEn ? 'Dashboard' : 'لوحة التحكم'),
    [isEn, nav, pathname]
  );

  async function logout() {
    try {
      await api.post('/auth/logout', {}, { headers: { 'x-client': 'web' } });
    } catch {
      try {
        await api.post('/auth/refresh/revoke', {}, { headers: { 'x-client': 'web' } });
      } catch {
        // ignore
      }
    }

    try {
      clearAuthCookiesClientSide();
      clearStoreCookie();
    } catch {
      // ignore
    }

    router.push(isEn ? '/en/merchant/login' : '/merchant/login');
  }

  return (
    <div className="bg-kaffza-bg text-kaffza-text min-h-screen">
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
            isEn={isEn}
          />
          <main className="min-w-0 flex-1 p-4 md:p-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>

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
          isEn={isEn}
        />

        {mobileOpen ? (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <div
              dir={isEn ? 'ltr' : 'rtl'}
              className="absolute right-0 top-0 h-full w-[82%] max-w-xs bg-[#1A2B4A] shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <div className="text-kaffza-premium text-sm font-extrabold">
                  {isEn ? 'Menu' : 'القائمة'}
                </div>
                <button
                  className="text-sm font-bold text-white/70"
                  onClick={() => setMobileOpen(false)}
                >
                  {isEn ? 'Close' : 'إغلاق'}
                </button>
              </div>

              <div className="border-b border-white/10 p-4">
                <div className="text-xs font-bold text-white/70">{isEn ? 'Store' : 'المتجر'}</div>
                <div className="mt-2">
                  <StoreSwitcher
                    stores={stores}
                    storeId={storeId}
                    onChange={(id) => setStoreId(id)}
                    loading={storesLoading}
                    onReload={() => reloadStores()}
                    isEn={isEn}
                  />
                </div>
              </div>

              <nav className="p-3">
                {nav.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={withLang(item.href)}
                      onClick={() => setMobileOpen(false)}
                      className={
                        'mb-1 flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ' +
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
            </div>
          </div>
        ) : null}

        <main className="p-4">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/10 bg-white">
          <div className="mx-auto grid max-w-6xl grid-cols-5">
            {nav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={withLang(item.href)}
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
  isEn,
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
  isEn: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {mobile ? (
            <button
              onClick={onOpenMobile}
              className="text-kaffza-text rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-bold"
              aria-label={isEn ? 'Open menu' : 'فتح القائمة'}
            >
              ☰
            </button>
          ) : null}

          <div className="min-w-0">
            <div className="text-kaffza-text/70 truncate text-sm">
              {userName
                ? isEn
                  ? `Hi, ${userName}`
                  : `مرحباً، ${userName}`
                : isEn
                  ? 'Merchant Dashboard'
                  : 'لوحة التاجر'}
            </div>
            <div className="text-kaffza-primary truncate text-base font-extrabold">{title}</div>
          </div>

          <div className="hidden sm:block">
            <StoreSwitcher
              stores={stores}
              storeId={storeId}
              onChange={onChangeStore}
              loading={storesLoading}
              onReload={onReloadStores}
              isEn={isEn}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <NotificationBell isEn={isEn} />
          <Button variant="secondary" onClick={onLogout}>
            {isEn ? 'Logout' : 'تسجيل خروج'}
          </Button>
        </div>
      </div>

      <div className="border-t border-black/10 px-4 py-3 sm:hidden">
        <StoreSwitcher
          stores={stores}
          storeId={storeId}
          onChange={onChangeStore}
          loading={storesLoading}
          onReload={onReloadStores}
          isEn={isEn}
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
  isEn,
}: {
  stores: { id: string; nameAr?: string; nameEn?: string; subdomain?: string }[];
  storeId: string | null;
  onChange: (id: string) => void;
  loading: boolean;
  onReload: () => void;
  isEn: boolean;
}) {
  const multiple = stores.length > 1;

  if (!multiple) {
    const s = stores[0];
    const label = s
      ? isEn
        ? s.nameEn || s.nameAr || s.subdomain || s.id
        : s.nameAr || s.nameEn || s.subdomain || s.id
      : '—';
    return (
      <div className="bg-kaffza-bg text-kaffza-text flex items-center gap-2 rounded-lg px-3 py-2 text-xs">
        <span className="font-bold">{isEn ? 'Store:' : 'المتجر:'}</span>
        <span className="text-kaffza-primary font-extrabold">{loading ? '...' : label}</span>
        <button className="text-kaffza-text/70 underline" onClick={onReload}>
          {isEn ? 'Refresh' : 'تحديث'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="text-kaffza-text max-w-[220px] rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-bold"
        value={storeId || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
      >
        {stores.map((s) => {
          const label = isEn
            ? s.nameEn || s.nameAr || s.subdomain || s.id
            : s.nameAr || s.nameEn || s.subdomain || s.id;
          return (
            <option key={s.id} value={s.id}>
              {label}
            </option>
          );
        })}
      </select>
      <button className="text-kaffza-text/70 text-xs font-bold underline" onClick={onReload}>
        {isEn ? 'Refresh' : 'تحديث'}
      </button>
    </div>
  );
}
