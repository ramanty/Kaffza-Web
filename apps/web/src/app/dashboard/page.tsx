'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingBag,
  Wallet,
  Clock,
  Plus,
  Rocket,
  Megaphone,
  LifeBuoy,
} from 'lucide-react';
import { api } from '../../lib/api';
import { authHeader } from '../../lib/auth';
import { useStore } from './store-context';
import { StatCard } from './_components/StatCard';
import {
  RecentOrdersTable,
  MOCK_RECENT_ORDERS,
  type OrderRow,
} from './_components/RecentOrdersTable';
import { SalesChart } from './_components/SalesChart';

type WalletData = {
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
};

function formatOMR(v: number) {
  const n = Number.isFinite(v) ? v : 0;
  return `${n.toFixed(3)} ر.ع`;
}

function withLang(path: string, isEn: boolean) {
  return isEn ? `${path}?lang=en` : path;
}

function DashboardPageInner() {
  const sp = useSearchParams();
  const isEn = sp.get('lang') === 'en';
  const welcome = sp.get('welcome') === '1';
  const { storeId, stores, loading: storesLoading } = useStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
  const [ordersFromApi, setOrdersFromApi] = useState(false);

  const storeLabel = useMemo(() => {
    const s = stores.find((x) => x.id === storeId) || stores[0];
    if (!s) return '';
    return isEn
      ? s.nameEn || s.nameAr || s.subdomain || s.id
      : s.nameAr || s.nameEn || s.subdomain || s.id;
  }, [isEn, stores, storeId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!storeId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [walletRes, ordersRes] = await Promise.all([
          api.get(`/stores/${storeId}/wallet`, {
            headers: { ...authHeader(), 'x-client': 'web' },
          }),
          api.get(`/stores/${storeId}/orders`, {
            headers: { ...authHeader(), 'x-client': 'web' },
          }),
        ]);

        const w = walletRes?.data?.data;
        const orders: any[] = ordersRes?.data?.data || [];

        if (!mounted) return;

        setWallet(w || null);
        setOrdersCount(Array.isArray(orders) ? orders.length : 0);
        setPendingOrdersCount(
          Array.isArray(orders) ? orders.filter((o) => o.status === 'pending').length : 0
        );

        if (Array.isArray(orders) && orders.length > 0) {
          setOrdersFromApi(true);
          setRecentOrders(
            orders.slice(0, 5).map((o) => ({
              id: String(o.id),
              orderNumber: o.orderNumber,
              customerName:
                o.customerName || (isEn ? `Customer #${o.customerId}` : `عميل #${o.customerId}`),
              createdAt: o.createdAt,
              totalAmount: Number(o.totalAmount),
              status: o.status,
            }))
          );
        } else {
          setOrdersFromApi(true);
          setRecentOrders([]);
        }
      } catch (e: any) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          (isEn ? 'Failed to load dashboard data' : 'حدث خطأ أثناء تحميل البيانات');
        if (mounted) {
          setError(msg);
          setOrdersFromApi(false);
          setRecentOrders(MOCK_RECENT_ORDERS);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isEn, storeId]);

  const totalSales = useMemo(() => Number(wallet?.totalEarned ?? 0), [wallet]);
  const walletBalance = useMemo(() => Number(wallet?.availableBalance ?? 0), [wallet]);
  const hasNoStore = !storesLoading && !storeLabel;

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        {welcome && (
          <div className="border-kaffza-success/30 bg-kaffza-success/10 text-kaffza-success rounded-xl border p-4 text-sm font-bold">
            {isEn
              ? 'Welcome to Kaffza 🎉 — your store was created successfully!'
              : 'مرحباً بك في Kaffza 🎉 — تم إنشاء متجرك بنجاح!'}
          </div>
        )}

        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-kaffza-primary text-2xl font-extrabold">
                {storesLoading
                  ? isEn
                    ? 'Loading...'
                    : 'جاري التحميل...'
                  : storeLabel
                    ? isEn
                      ? 'Welcome back 👋'
                      : 'مرحباً بعودتك 👋'
                    : isEn
                      ? 'Start your merchant workspace'
                      : 'ابدأ مساحة عمل متجرك'}
              </h1>
              <p className="text-kaffza-text/70 mt-1 text-sm">
                {storesLoading
                  ? isEn
                    ? 'Loading stores...'
                    : 'تحميل المتاجر...'
                  : storeLabel
                    ? isEn
                      ? `Today overview for ${storeLabel}`
                      : `ملخص اليوم لمتجرك: ${storeLabel}`
                    : isEn
                      ? 'No store linked yet. Complete onboarding to activate your dashboard.'
                      : 'لا يوجد متجر مرتبط بعد. أكمل الإعداد لتفعيل لوحة التحكم.'}
              </p>
            </div>

            <Link
              href={withLang('/dashboard/products/new', isEn)}
              className="bg-kaffza-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              {isEn ? 'Add Product' : 'إضافة منتج'}
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={withLang('/dashboard/onboarding', isEn)}
              className="text-kaffza-primary hover:bg-kaffza-bg inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-bold"
            >
              <Rocket className="h-4 w-4" />
              {isEn ? 'Launch checklist' : 'خطة الانطلاقة'}
            </Link>
            <Link
              href={withLang('/dashboard/growth', isEn)}
              className="text-kaffza-primary hover:bg-kaffza-bg inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-bold"
            >
              <Megaphone className="h-4 w-4" />
              {isEn ? 'Growth hub' : 'مركز النمو'}
            </Link>
            <Link
              href={withLang('/dashboard/settings', isEn)}
              className="text-kaffza-primary hover:bg-kaffza-bg inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-bold"
            >
              <LifeBuoy className="h-4 w-4" />
              {isEn ? 'Store settings' : 'إعدادات المتجر'}
            </Link>
          </div>
        </div>
      </header>

      {hasNoStore ? (
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-kaffza-primary text-lg font-extrabold">
            {isEn ? 'No active store yet' : 'لا يوجد متجر نشط بعد'}
          </h2>
          <p className="text-kaffza-text/70 mt-2 text-sm">
            {isEn
              ? 'Finish onboarding to create your first store, then return here for sales and order insights.'
              : 'أكمل خطوات الإعداد لإنشاء متجرك الأول ثم عد هنا لمتابعة الطلبات والمبيعات.'}
          </p>
          <div className="mt-4">
            <Link href={withLang('/onboarding', isEn)}>
              <span className="bg-kaffza-primary inline-flex rounded-xl px-4 py-2 text-sm font-bold text-white">
                {isEn ? 'Continue onboarding' : 'متابعة الإعداد'}
              </span>
            </Link>
          </div>
        </div>
      ) : null}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={isEn ? 'Total Sales' : 'إجمالي المبيعات'}
          value={formatOMR(totalSales)}
          loading={loading}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="primary"
          subtitle={isEn ? 'Total generated revenue' : 'إجمالي الأرباح المحققة'}
        />
        <StatCard
          title={isEn ? 'Total Orders' : 'إجمالي الطلبات'}
          value={String(ordersCount)}
          loading={loading}
          icon={<ShoppingBag className="h-5 w-5" />}
          variant="order"
          subtitle={isEn ? 'All incoming orders' : 'جميع الطلبات الواردة'}
        />
        <StatCard
          title={isEn ? 'Available for Withdrawal' : 'الرصيد المتاح للسحب'}
          value={formatOMR(walletBalance)}
          loading={loading}
          icon={<Wallet className="h-5 w-5" />}
          variant="premium"
          subtitle={isEn ? 'Ready to withdraw now' : 'رصيد جاهز للسحب الآن'}
        />
        <StatCard
          title={isEn ? 'Pending Orders' : 'طلبات قيد المعالجة'}
          value={String(pendingOrdersCount)}
          loading={loading}
          icon={<Clock className="h-5 w-5" />}
          variant="warning"
          subtitle={isEn ? 'Need your action' : 'تحتاج إلى إجراء'}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesChart isEn={isEn} />
        </div>

        <div className="rounded-xl border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="text-kaffza-primary text-base font-extrabold">
            {isEn ? 'Wallet Summary' : 'ملخص المحفظة'}
          </h2>
          <p className="text-kaffza-text/60 mt-0.5 text-xs">
            {isEn ? 'Currency: OMR' : 'العملة: OMR'}
          </p>

          <div className="mt-4 space-y-3">
            <InfoRow
              label={isEn ? 'Pending Balance (Escrow)' : 'الرصيد المعلق (Escrow)'}
              value={formatOMR(Number(wallet?.pendingBalance ?? 0))}
              loading={loading}
            />
            <InfoRow
              label={isEn ? 'Total Withdrawn' : 'إجمالي المسحوبات'}
              value={formatOMR(Number(wallet?.totalWithdrawn ?? 0))}
              loading={loading}
            />
            <InfoRow
              label={isEn ? 'Total Earnings' : 'إجمالي الأرباح'}
              value={formatOMR(totalSales)}
              loading={loading}
              highlight
            />
          </div>

          <Link
            href={withLang('/dashboard/wallet', isEn)}
            className="border-kaffza-primary/30 text-kaffza-primary hover:bg-kaffza-primary mt-4 flex w-full items-center justify-center rounded-xl border py-2 text-sm font-bold transition-colors hover:text-white"
          >
            {isEn ? 'Manage Wallet' : 'إدارة المحفظة'}
          </Link>
        </div>
      </section>

      <section>
        {!ordersFromApi && !loading && (
          <div className="border-kaffza-warning/30 bg-kaffza-warning/10 text-kaffza-warning mb-3 rounded-lg border px-4 py-2 text-xs font-semibold">
            {isEn
              ? 'Showing demo data — connect your store to see real orders'
              : 'يتم عرض بيانات تجريبية — قم بتوصيل متجرك لعرض طلباتك الحقيقية'}
          </div>
        )}

        {ordersFromApi && !loading && recentOrders.length === 0 ? (
          <div className="mb-3 rounded-lg border border-black/10 bg-white px-4 py-4 text-sm">
            <div className="text-kaffza-primary font-extrabold">
              {isEn ? 'No orders yet' : 'لا توجد طلبات حتى الآن'}
            </div>
            <p className="text-kaffza-text/70 mt-1 text-xs">
              {isEn
                ? 'Add products and share your storefront link to receive your first order.'
                : 'أضف منتجاتك وشارك رابط متجرك لبدء استقبال أول طلب.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={withLang('/dashboard/products/new', isEn)}
                className="text-kaffza-primary rounded-lg border border-black/10 px-3 py-1.5 text-xs font-bold"
              >
                {isEn ? 'Add first product' : 'إضافة أول منتج'}
              </Link>
              <Link
                href={withLang('/dashboard/onboarding', isEn)}
                className="text-kaffza-primary rounded-lg border border-black/10 px-3 py-1.5 text-xs font-bold"
              >
                {isEn ? 'Open checklist' : 'فتح خطة الانطلاقة'}
              </Link>
            </div>
          </div>
        ) : null}

        <RecentOrdersTable orders={recentOrders} loading={loading} isEn={isEn} />
      </section>
    </div>
  );
}

function InfoRow({
  label,
  value,
  loading,
  highlight,
}: {
  label: string;
  value: string;
  loading: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="bg-kaffza-bg flex items-center justify-between rounded-lg px-4 py-3">
      <div className="text-kaffza-text text-sm font-semibold">{label}</div>
      <div
        className={`text-sm font-extrabold ${highlight ? 'text-kaffza-premium' : 'text-kaffza-primary'}`}
      >
        {loading ? (
          <span className="inline-block h-5 w-20 animate-pulse rounded bg-black/10" />
        ) : (
          value
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardPageInner />
    </Suspense>
  );
}
