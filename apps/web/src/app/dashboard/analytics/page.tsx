'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { api } from '../../../lib/api';
import { authHeader } from '../../../lib/auth';
import { Card } from '../../../components/Card';
import { useStore } from '../store-context';

type AnalyticsData = {
  rangeDays: number;
  kpis: {
    revenue: number;
    ordersCount: number;
    avgOrderValue: number;
    deliveredCount: number;
    pendingCount: number;
    cancelledCount: number;
    repeatCustomerRate: number;
    uniqueCustomers: number;
    repeatCustomers: number;
    repeatOrdersCount: number;
    returningOrdersShare: number;
    checkoutCompletionProxyRate: number;
    deliverySuccessRate: number;
    cancellationRate: number;
    avgItemsPerOrder: number;
  };
  trendComparison: {
    revenueDeltaPercent: number;
    ordersDeltaPercent: number;
    avgOrderValueDeltaPercent: number;
    repeatRateDeltaPercent: number;
  };
  statusDistribution: Array<{ status: string; count: number; percent: number }>;
  dailySales: Array<{ date: string; total: number }>;
  dailyOrders: Array<{ date: string; count: number }>;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
};

function AnalyticsPageInner() {
  const sp = useSearchParams();
  const isEn = sp.get('lang') === 'en';
  const { storeId } = useStore();
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const t = useMemo(
    () =>
      isEn
        ? {
            title: 'Smart Analytics',
            subtitle:
              'Sales momentum, repeat indicators, conversion-adjacent metrics, and order status clarity.',
            periods: (d: number) => `Last ${d} days`,
            loadError: 'Failed to load analytics',
            loading: 'Loading analytics...',
            kpi: {
              revenue: 'Revenue',
              orders: 'Orders',
              aov: 'Avg order value',
              repeatRate: 'Repeat customer rate',
              checkoutProxy: 'Checkout completion proxy',
              deliveryRate: 'Delivery success rate',
              cancelRate: 'Cancellation rate',
              avgItems: 'Avg items per order',
            },
            dailySales: 'Daily sales',
            statusTitle: 'Order status distribution',
            trendTitle: 'Trend comparison vs previous period',
            topProducts: 'Top products',
            noData: 'Not enough data for selected range.',
          }
        : {
            title: 'التحليلات الذكية',
            subtitle:
              'زخم المبيعات، ومؤشرات التكرار، ومقاييس قريبة من التحويل، مع وضوح في حالات الطلبات.',
            periods: (d: number) => `آخر ${d} يوم`,
            loadError: 'تعذر تحميل التحليلات',
            loading: 'جارٍ تحميل التحليلات...',
            kpi: {
              revenue: 'إجمالي المبيعات',
              orders: 'عدد الطلبات',
              aov: 'متوسط قيمة الطلب',
              repeatRate: 'معدل العملاء العائدين',
              checkoutProxy: 'مؤشر إكمال الشراء',
              deliveryRate: 'معدل التسليم الناجح',
              cancelRate: 'معدل الإلغاء',
              avgItems: 'متوسط العناصر بالطلب',
            },
            dailySales: 'مبيعات يومية',
            statusTitle: 'توزيع حالات الطلبات',
            trendTitle: 'مقارنة الاتجاه بالفترة السابقة',
            topProducts: 'أفضل المنتجات',
            noData: 'لا توجد بيانات كافية للفترة المختارة.',
          },
    [isEn]
  );

  async function load(nextDays: number) {
    if (!storeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/stores/${storeId}/analytics/overview?days=${nextDays}`, {
        headers: { ...authHeader(), 'x-client': 'web' },
      });
      setData(res?.data?.data || null);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || t.loadError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(days);
  }, [storeId, days, isEn]);

  const maxDaily = Math.max(...(data?.dailySales.map((x) => x.total) || [0]), 1);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-kaffza-primary text-2xl font-extrabold">{t.title}</h1>
          <p className="text-kaffza-text/70 mt-1 text-sm">{t.subtitle}</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={
                'rounded-lg border px-3 py-2 text-sm font-bold ' +
                (days === d
                  ? 'border-kaffza-primary bg-kaffza-primary text-white'
                  : 'text-kaffza-text border-slate-200 bg-white')
              }
            >
              {t.periods(d)}
            </button>
          ))}
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label={t.kpi.revenue} value={`${Number(data?.kpis.revenue || 0).toFixed(3)} ر.ع`} />
        <Kpi label={t.kpi.orders} value={String(data?.kpis.ordersCount || 0)} />
        <Kpi label={t.kpi.aov} value={`${Number(data?.kpis.avgOrderValue || 0).toFixed(3)} ر.ع`} />
        <Kpi
          label={t.kpi.repeatRate}
          value={`${Number(data?.kpis.repeatCustomerRate || 0).toFixed(1)}%`}
        />
        <Kpi
          label={t.kpi.checkoutProxy}
          value={`${Number(data?.kpis.checkoutCompletionProxyRate || 0).toFixed(1)}%`}
        />
        <Kpi
          label={t.kpi.deliveryRate}
          value={`${Number(data?.kpis.deliverySuccessRate || 0).toFixed(1)}%`}
        />
        <Kpi
          label={t.kpi.cancelRate}
          value={`${Number(data?.kpis.cancellationRate || 0).toFixed(1)}%`}
        />
        <Kpi label={t.kpi.avgItems} value={Number(data?.kpis.avgItemsPerOrder || 0).toFixed(2)} />
      </section>

      <Card className="p-5">
        <h2 className="text-kaffza-primary text-sm font-extrabold">{t.dailySales}</h2>
        <div className="lg:grid-cols-14 mt-4 grid grid-cols-7 gap-2 sm:grid-cols-10">
          {(data?.dailySales || []).map((d) => (
            <div key={d.date} className="flex flex-col items-center gap-2">
              <div className="flex h-24 w-full items-end rounded-md bg-slate-100 px-1">
                <div
                  className="bg-kaffza-primary w-full rounded"
                  style={{ height: `${Math.max(4, (d.total / maxDaily) * 100)}%` }}
                  title={`${d.date}: ${d.total.toFixed(3)} OMR`}
                />
              </div>
              <span className="text-kaffza-text/70 text-[10px]">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-kaffza-primary text-sm font-extrabold">{t.statusTitle}</h2>
          <div className="mt-3 space-y-2">
            {(data?.statusDistribution || []).map((s) => (
              <div key={s.status} className="space-y-1">
                <div className="text-kaffza-text flex items-center justify-between text-xs font-bold">
                  <span>{s.status}</span>
                  <span>
                    {s.count} ({s.percent}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="bg-kaffza-primary h-full"
                    style={{ width: `${Math.min(100, s.percent)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-kaffza-primary text-sm font-extrabold">{t.trendTitle}</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <Trend
              label={isEn ? 'Revenue' : 'المبيعات'}
              value={data?.trendComparison.revenueDeltaPercent || 0}
            />
            <Trend
              label={isEn ? 'Orders' : 'الطلبات'}
              value={data?.trendComparison.ordersDeltaPercent || 0}
            />
            <Trend
              label={isEn ? 'Avg order value' : 'متوسط قيمة الطلب'}
              value={data?.trendComparison.avgOrderValueDeltaPercent || 0}
            />
            <Trend
              label={isEn ? 'Repeat rate' : 'معدل العائدين'}
              value={data?.trendComparison.repeatRateDeltaPercent || 0}
            />
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-kaffza-primary text-sm font-extrabold">{t.topProducts}</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-kaffza-text/70 border-b border-black/10 text-right">
                <th className="px-2 py-2">{isEn ? 'Product' : 'المنتج'}</th>
                <th className="px-2 py-2">{isEn ? 'Qty' : 'الكمية'}</th>
                <th className="px-2 py-2">{isEn ? 'Revenue' : 'الإيراد'}</th>
              </tr>
            </thead>
            <tbody>
              {(data?.topProducts || []).map((p) => (
                <tr key={p.name} className="border-b border-black/5">
                  <td className="px-2 py-2 font-semibold">{p.name}</td>
                  <td className="px-2 py-2">{p.quantity}</td>
                  <td className="px-2 py-2">{p.revenue.toFixed(3)} ر.ع</td>
                </tr>
              ))}
              {!loading && (!data?.topProducts || data.topProducts.length === 0) ? (
                <tr>
                  <td className="text-kaffza-text/60 px-2 py-4" colSpan={3}>
                    {t.noData}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      {loading ? <div className="text-kaffza-text/60 text-sm">{t.loading}</div> : null}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="text-kaffza-text/60 text-sm">...</div>}>
      <AnalyticsPageInner />
    </Suspense>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="text-kaffza-text/70 text-xs">{label}</div>
      <div className="text-kaffza-primary mt-1 text-xl font-extrabold">{value}</div>
    </Card>
  );
}

function Trend({ label, value }: { label: string; value: number }) {
  const positive = value >= 0;
  return (
    <div className="rounded-xl border border-black/10 p-3">
      <div className="text-kaffza-text/70 text-xs">{label}</div>
      <div
        className={
          'mt-1 text-base font-extrabold ' + (positive ? 'text-green-700' : 'text-red-700')
        }
      >
        {positive ? '+' : ''}
        {value.toFixed(1)}%
      </div>
    </div>
  );
}
