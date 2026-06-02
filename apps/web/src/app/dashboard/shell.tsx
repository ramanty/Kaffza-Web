'use client';

import { ReactNode, useEffect, useState } from 'react';
import DashboardSidebar from './sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { authHeader } from '../../lib/auth';
import { Button } from '../../components/Button';
import { useStore } from './store-context';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

type NavItem = { href: string; label: string; icon?: string };

const NAV_AR: NavItem[] = [
  { href: '/dashboard', label: 'نظرة عامة', icon: '📊' },
  { href: '/dashboard/products', label: 'المنتجات', icon: '📦' },
  { href: '/dashboard/categories', label: 'التصنيفات', icon: '🏷️' },
  { href: '/dashboard/orders', label: 'الطلبات', icon: '🧾' },
  { href: '/dashboard/onboarding', label: 'الانطلاقة', icon: '🚀' },
  { href: '/dashboard/growth', label: 'النمو', icon: '📣' },
  { href: '/dashboard/campaigns', label: 'الحملات', icon: '🎯' },
  { href: '/dashboard/analytics', label: 'التحليلات', icon: '📈' },
  { href: '/dashboard/shipping', label: 'الشحن', icon: '🚚' },
  { href: '/dashboard/disputes', label: 'النزاعات', icon: '⚖️' },
  { href: '/dashboard/wallet', label: 'المحفظة', icon: '👜' },
  { href: '/dashboard/integrations', label: 'تطبيقات', icon: '🧩' },
  { href: '/dashboard/settings', label: 'الإعدادات', icon: '⚙️' },
];

const NAV_EN: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: '📊' },
  { href: '/dashboard/products', label: 'Products', icon: '📦' },
  { href: '/dashboard/categories', label: 'Categories', icon: '🏷️' },
  { href: '/dashboard/orders', label: 'Orders', icon: '🧾' },
  { href: '/dashboard/onboarding', label: 'Launch', icon: '🚀' },
  { href: '/dashboard/growth', label: 'Growth', icon: '📣' },
  { href: '/dashboard/campaigns', label: 'Campaigns', icon: '🎯' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: '📈' },
  { href: '/dashboard/shipping', label: 'Shipping', icon: '🚚' },
  { href: '/dashboard/disputes', label: 'Disputes', icon: '⚖️' },
  { href: '/dashboard/wallet', label: 'Wallet', icon: '👜' },
  { href: '/dashboard/integrations', label: 'Apps', icon: '🧩' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
];

function isActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(href + '/');
}

export default function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/dashboard';
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isEn, setIsEn] = useState(false);
  
  const { stores, storeId, setStoreId, loading: storesLoading, reloadStores } = useStore();

  const nav = isEn ? NAV_EN : NAV_AR;
  const withLang = (href: string) => (isEn ? `${href}?lang=en` : href);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsEn(new URLSearchParams(window.location.search).get('lang') === 'en');
  }, [pathname]);

  useEffect(() => {
    let m = true;
    api
      .get('/auth/me', { headers: { ...authHeader(), 'x-client': 'web' } })
      .then((res) => {
        if (!m) return;
        if (res.data.success && res.data.data?.name) {
          setUserName(res.data.data.name);
        } else {
          router.replace('/merchant/login');
        }
      })
      .catch(() => {
        if (m) router.replace('/merchant/login');
      });
    return () => {
      m = false;
    };
  }, [router]);

  const logout = () => {
    try { fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1') + '/auth/logout', { method: 'POST', headers: authHeader() }); } catch(e){console.error(e);}
    router.replace('/');
  };

  const activeItem = nav.find((n) => isActive(pathname, n.href)) || nav[0];
  const activeLabel = activeItem?.label || '';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden sm:block">
        <DashboardSidebar />
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto">
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

        <AnimatePresence>
          {mobileOpen && (
            <div className="fixed inset-0 z-50 sm:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                initial={{ x: isEn ? '-100%' : '100%' }}
                animate={{ x: 0 }}
                exit={{ x: isEn ? '-100%' : '100%' }}
                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                dir={isEn ? 'ltr' : 'rtl'}
                className="absolute right-0 top-0 h-full w-[82%] max-w-xs bg-background shadow-xl border-l border-border flex flex-col"
              >
                <div className="flex items-center justify-between border-b border-border p-4">
                  <div className="text-primary text-sm font-extrabold">
                    {isEn ? 'Menu' : 'القائمة'}
                  </div>
                  <button
                    className="text-sm font-bold text-muted-foreground hover:text-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    {isEn ? 'Close' : 'إغلاق'}
                  </button>
                </div>

                <div className="border-b border-border p-4 bg-muted/20">
                  <div className="text-xs font-bold text-muted-foreground mb-2">{isEn ? 'Store' : 'المتجر'}</div>
                  <StoreSwitcher
                    stores={stores}
                    storeId={storeId}
                    onChange={(id) => setStoreId(id)}
                    loading={storesLoading}
                    onReload={() => reloadStores()}
                    isEn={isEn}
                  />
                </div>

                <nav className="p-3 flex-1 overflow-y-auto space-y-1">
                  {nav.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={withLang(item.href)}
                        onClick={() => setMobileOpen(false)}
                        className={
                          'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ' +
                          (active
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground')
                        }
                      >
                        <span aria-hidden className="text-base">
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/80 backdrop-blur-md sm:hidden">
          <div className="mx-auto grid max-w-6xl grid-cols-5">
            {nav.slice(0, 5).map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={withLang(item.href)}
                  className={
                    'flex flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] sm:text-[11px] ' +
                    (active ? 'text-primary' : 'text-muted-foreground')
                  }
                >
                  <span className="text-base" aria-hidden>
                    {item.icon}
                  </span>
                  <span className="font-bold truncate w-full text-center">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="h-16 sm:hidden" />
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
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {mobile && (
            <Button
              variant="outline"
              size="icon"
              onClick={onOpenMobile}
              className="sm:hidden"
              aria-label={isEn ? 'Open menu' : 'فتح القائمة'}
            >
              ☰
            </Button>
          )}

          <div className="min-w-0">
            <div className="text-muted-foreground truncate text-xs sm:text-sm">
              {userName
                ? isEn
                  ? `Hi, ${userName}`
                  : `مرحباً، ${userName}`
                : isEn
                  ? 'Merchant Dashboard'
                  : 'لوحة التاجر'}
            </div>
            <div className="text-foreground truncate text-lg sm:text-xl font-extrabold tracking-tight">{title}</div>
          </div>

          <div className="hidden sm:block mr-4 border-r border-border pr-4">
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
          <Button variant="secondary" onClick={onLogout}>
            {isEn ? 'Logout' : 'تسجيل خروج'}
          </Button>
        </div>
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
      <div className="bg-muted/50 text-foreground flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs">
        <span className="font-medium text-muted-foreground">{isEn ? 'Store:' : 'المتجر:'}</span>
        <span className="font-bold truncate max-w-[150px]">{loading ? '...' : label}</span>
        <button className="text-primary hover:underline ml-1" onClick={onReload}>
          {isEn ? 'Refresh' : 'تحديث'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="text-foreground max-w-[220px] rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
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
      <button className="text-primary text-xs font-medium hover:underline" onClick={onReload}>
        {isEn ? 'Refresh' : 'تحديث'}
      </button>
    </div>
  );
}
