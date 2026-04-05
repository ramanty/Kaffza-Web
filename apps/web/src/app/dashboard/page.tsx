'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, ShoppingBag, Wallet, Clock, Plus } from 'lucide-react';
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

function DashboardPageInner() {
  const sp = useSearchParams();
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
    return s.nameAr || s.nameEn || s.subdomain || s.id;
  }, [stores, storeId]);

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
              customerName: o.customerName || `عميل #${o.customerId}`,
              createdAt: o.createdAt,
              totalAmount: Number(o.totalAmount),
              status: o.status,
            }))
          );
        } else {
          setOrdersFromApi(false);
          setRecentOrders(MOCK_RECENT_ORDERS);
        }
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || 'حدث خطأ أثناء تحميل البيانات';
        if (mounted) {
          setError(msg);
          setRecentOrders(MOCK_RECENT_ORDERS);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [storeId]);

  const totalSales = useMemo(() => Number(wallet?.totalEarned ?? 0), [wallet]);
  const walletBalance = useMemo(() => Number(wallet?.availableBalance ?? 0), [wallet]);

  return (
    <div className="space-y-6">
      {/* ── Welcome ── */}
      <header className="flex flex-col gap-1">
        {welcome && (
          <div className="border-kaffza-success/30 bg-kaffza-success/10 text-kaffza-success rounded-xl border p-4 text-sm font-bold">
            مرحباً بك في Kaffza 🎉 — تم إنشاء متجرك بنجاح!
          </div>
        )}

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-kaffza-primary text-2xl font-extrabold">
              {storesLoading
                ? 'جاري التحميل...'
                : storeLabel
                  ? `مرحباً بك في متجرك 👋`
                  : 'مرحباً بك في Kaffza 👋'}
            </h1>
            <p className="text-kaffza-text/70 mt-1 text-sm">
              {storesLoading
                ? 'تحميل المتاجر...'
                : storeLabel
                  ? `نظرة عامة على أداء متجرك: ${storeLabel}`
                  : 'لا يوجد متجر مرتبط بحسابك بعد'}
            </p>
          </div>

          {/* Quick Action */}
          <Link
            href="/dashboard/products"
            className="bg-kaffza-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            إضافة منتج جديد
          </Link>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── KPI Cards ── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="إجمالي المبيعات"
          value={formatOMR(totalSales)}
          loading={loading}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="primary"
          subtitle="إجمالي الأرباح المحققة"
        />
        <StatCard
          title="إجمالي الطلبات"
          value={String(ordersCount)}
          loading={loading}
          icon={<ShoppingBag className="h-5 w-5" />}
          variant="order"
          subtitle="جميع الطلبات الواردة"
        />
        <StatCard
          title="الرصيد المتاح للسحب"
          value={formatOMR(walletBalance)}
          loading={loading}
          icon={<Wallet className="h-5 w-5" />}
          variant="premium"
          subtitle="رصيد جاهز للسحب الآن"
        />
        <StatCard
          title="طلبات قيد المعالجة"
          value={String(pendingOrdersCount)}
          loading={loading}
          icon={<Clock className="h-5 w-5" />}
          variant="warning"
          subtitle="تحتاج إلى إجراء"
        />
      </section>

      {/* ── Chart + Wallet Summary ── */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>

        <div className="rounded-xl border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="text-kaffza-primary text-base font-extrabold">ملخص المحفظة</h2>
          <p className="text-kaffza-text/60 mt-0.5 text-xs">العملة: OMR</p>

          <div className="mt-4 space-y-3">
            <InfoRow
              label="الرصيد المعلق (Escrow)"
              value={formatOMR(Number(wallet?.pendingBalance ?? 0))}
              loading={loading}
            />
            <InfoRow
              label="إجمالي المسحوبات"
              value={formatOMR(Number(wallet?.totalWithdrawn ?? 0))}
              loading={loading}
            />
            <InfoRow
              label="إجمالي الأرباح"
              value={formatOMR(totalSales)}
              loading={loading}
              highlight
            />
          </div>

          <Link
            href="/dashboard/wallet"
            className="border-kaffza-primary/30 text-kaffza-primary hover:bg-kaffza-primary mt-4 flex w-full items-center justify-center rounded-xl border py-2 text-sm font-bold transition-colors hover:text-white"
          >
            إدارة المحفظة
          </Link>
        </div>
      </section>

      {/* ── Recent Orders ── */}
      <section>
        {!ordersFromApi && !loading && (
          <div className="border-kaffza-warning/30 bg-kaffza-warning/10 text-kaffza-warning mb-3 rounded-lg border px-4 py-2 text-xs font-semibold">
            يتم عرض بيانات تجريبية — قم بتوصيل متجرك لعرض طلباتك الحقيقية
          </div>
        )}
        <RecentOrdersTable orders={recentOrders} loading={loading} />
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
