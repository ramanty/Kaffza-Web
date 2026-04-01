'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '../../lib/api';
import { authHeader } from '../../lib/auth';
import { useStore } from './store-context';

type Wallet = {
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
};

export default function DashboardPage() {
  const sp = useSearchParams();
  const welcome = sp.get('welcome') === '1';
  const { storeId, stores, loading: storesLoading } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [productsCount, setProductsCount] = useState<number>(0);

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
        const [walletRes, productsRes, ordersRes] = await Promise.all([
          api.get(`/stores/${storeId}/wallet`, { headers: { ...authHeader(), 'x-client': 'web' } }),
          api.get(`/stores/${storeId}/products?includeInactive=true&limit=1&page=1`, { headers: { ...authHeader(), 'x-client': 'web' } }),
          api.get(`/stores/${storeId}/orders`, { headers: { ...authHeader(), 'x-client': 'web' } }),
        ]);

        const w = walletRes?.data?.data;
        const prodMeta = productsRes?.data?.meta;
        const orders = ordersRes?.data?.data || [];

        if (!mounted) return;
        setWallet(w || null);
        setProductsCount(Number(prodMeta?.total ?? (productsRes?.data?.data?.length || 0)));
        setOrdersCount(Array.isArray(orders) ? orders.length : 0);
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || 'حدث خطأ أثناء تحميل البيانات';
        if (mounted) setError(msg);
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
      <header className="flex flex-col gap-1">
      {welcome ? (
        <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">مرحباً بك في Kaffza 🎉</div>
      ) : null}

        <h1 className="text-2xl font-extrabold text-kaffza-primary">نظرة عامة</h1>
        <p className="text-sm text-kaffza-text/80">
          {storesLoading ? 'تحميل المتاجر...' : storeLabel ? `متجرك: ${storeLabel}` : 'لا يوجد متجر'}
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CardStat title="إجمالي المبيعات" value={formatOMR(totalSales)} loading={loading} />
        <CardStat title="عدد الطلبات" value={String(ordersCount)} loading={loading} />
        <CardStat title="رصيد المحفظة" value={formatOMR(walletBalance)} loading={loading} />
        <CardStat title="عدد المنتجات" value={String(productsCount)} loading={loading} />
      </section>

      <section className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-bold text-kaffza-primary">ملخص سريع</div>
            <div className="mt-1 text-sm text-kaffza-text/80">معلومات مبدئية من الـ API (orders / wallet / products).</div>
          </div>
          <div className="rounded-lg bg-kaffza-bg px-3 py-2 text-xs text-kaffza-text">
            العملة: <span className="font-bold">OMR</span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <InfoRow label="الرصيد المعلق (Escrow)" value={formatOMR(Number(wallet?.pendingBalance ?? 0))} loading={loading} />
          <InfoRow label="إجمالي المسحوبات" value={formatOMR(Number(wallet?.totalWithdrawn ?? 0))} loading={loading} />
        </div>
      </section>
    </div>
  );
}

function CardStat({ title, value, loading }: { title: string; value: string; loading: boolean }) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="text-sm text-kaffza-text/70">{title}</div>
      <div className="mt-2 text-2xl font-extrabold text-kaffza-primary">
        {loading ? <span className="inline-block h-7 w-24 animate-pulse rounded bg-black/10" /> : value}
      </div>
    </div>
  );
}

function InfoRow({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-kaffza-bg px-4 py-3">
      <div className="text-sm font-semibold text-kaffza-text">{label}</div>
      <div className="text-sm font-extrabold text-kaffza-primary">
        {loading ? <span className="inline-block h-5 w-20 animate-pulse rounded bg-black/10" /> : value}
      </div>
    </div>
  );
}

function formatOMR(v: number) {
  const n = Number.isFinite(v) ? v : 0;
  return `${n.toFixed(3)} ر.ع`;
}
