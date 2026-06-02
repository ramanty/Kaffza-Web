'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { api } from '../../../lib/api';
import { authHeader } from '../../../lib/auth';
import { Card } from '../../../components/Card';
import { useStore } from '../store-context';
import { formatCurrency } from '@/lib/utils';

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
  const hasAnyData =
    !!data &&
    ((data.dailySales && data.dailySales.length > 0) ||
      (data.topProducts && data.topProducts.length > 0) ||
      Number(data.kpis.ordersCount) > 0);
  const actionInsights = useMemo(() => {
    if (!data) return [];
    const tips: string[] = [];
    if (data.kpis.cancellationRate >= 10) {
      tips.push(
        isEn
          ? 'Cancellation is high — review shipping windows and COD constraints.'
          : 'معدل الإلغاء مرتفع — راجع مواعيد الشحن وقيود الدفع عند الاستلام.'
      );
    }
    if (data.kpis.checkoutCompletionProxyRate < 60) {
      tips.push(
        isEn
          ? 'Checkout completion is low — simplify payment/shipping options in settings.'
          : 'مؤشر إكمال الشراء منخفض — بسّط خيارات الدفع والشحن في الإعدادات.'
      );
    }
    if (data.kpis.repeatCustomerRate < 20) {
      tips.push(
        isEn
          ? 'Repeat rate is low — enable welcome and abandoned-cart automations.'
          : 'معدل العملاء العائدين منخفض — فعّل رسائل الترحيب واسترجاع السلة.'
      );
    }
    if (tips.length === 0) {
      tips.push(
        isEn
          ? 'Healthy signals detected. Keep monitoring top products and fulfillment speed.'
          : 'المؤشرات جيدة. استمر بمتابعة المنتجات الأعلى مبيعاً وسرعة التنفيذ.'
      );
    }
    return tips.slice(0, 3);
  }, [data, isEn]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-primary text-2xl font-extrabold">{t.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t.subtitle}</p>
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
                  ? 'border-kaffza-primary bg-primary text-white'
                  : 'text-foreground border-border bg-card text-card-foreground')
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
          <div className="mt-3">
            <button
              type="button"
              onClick={() => load(days)}
              className="rounded-lg border border-red-300 bg-card text-card-foreground px-3 py-1 text-xs font-bold text-red-700"
            >
              {isEn ? 'Retry' : 'إعادة المحاولة'}
            </button>
          </div>
        </div>
      ) : null}

      {!loading && !error && !hasAnyData ? (
        <Card className="border-border p-5 text-sm">
          <div className="text-primary font-extrabold">
            {isEn ? 'No analytics yet' : 'لا توجد تحليلات بعد'}
          </div>
          <p className="text-muted-foreground mt-1">
            {isEn
              ? 'Complete onboarding, add products, and share your store link to start collecting insights.'
              : 'أكمل الإعداد، أضف المنتجات، وشارك رابط المتجر لبدء جمع التحليلات.'}
          </p>
        </Card>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label={t.kpi.revenue} value={`${formatCurrency(Number(data?.kpis.revenue || 0))}`} />
        <Kpi label={t.kpi.orders} value={String(data?.kpis.ordersCount || 0)} />
        <Kpi label={t.kpi.aov} value={`${formatCurrency(Number(data?.kpis.avgOrderValue || 0))}`} />
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
        <h2 className="text-primary text-sm font-extrabold">
          {isEn ? 'Actionable recommendations' : 'توصيات قابلة للتنفيذ'}
        </h2>
        <ul className="text-foreground mt-3 list-disc space-y-1 px-4 text-sm">
          {actionInsights.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </Card>

      <Card className="p-5">
        <h2 className="text-primary text-sm font-extrabold">{t.dailySales}</h2>
        <div className="lg:grid-cols-14 mt-4 grid grid-cols-7 gap-2 sm:grid-cols-10">
          {(data?.dailySales || []).map((d) => (
            <div key={d.date} className="flex flex-col items-center gap-2">
              <div className="flex h-24 w-full items-end rounded-md bg-slate-100 px-1">
                <div
                  className="bg-primary w-full rounded"
                  style={{ height: `${Math.max(4, (d.total / maxDaily) * 100)}%` }}
                  title={`${d.date}: ${d.total.toFixed(3)} OMR`}
                />
              </div>
              <span className="text-muted-foreground text-[10px]">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
        {!loading && (!data?.dailySales || data.dailySales.length === 0) ? (
          <div className="text-muted-foreground mt-3 text-xs">{t.noData}</div>
        ) : null}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-primary text-sm font-extrabold">{t.statusTitle}</h2>
          <div className="mt-3 space-y-2">
            {(data?.statusDistribution || []).map((s) => (
              <div key={s.status} className="space-y-1">
                <div className="text-foreground flex items-center justify-between text-xs font-bold">
                  <span>{s.status}</span>
                  <span>
                    {s.count} ({s.percent}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="bg-primary h-full"
                    style={{ width: `${Math.min(100, s.percent)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-primary text-sm font-extrabold">{t.trendTitle}</h2>
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
        <h2 className="text-primary text-sm font-extrabold">{t.topProducts}</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b border-border text-right">
                <th className="px-2 py-2">{isEn ? 'Product' : 'المنتج'}</th>
                <th className="px-2 py-2">{isEn ? 'Qty' : 'الكمية'}</th>
                <th className="px-2 py-2">{isEn ? 'Revenue' : 'الإيراد'}</th>
              </tr>
            </thead>
            <tbody>
              {(data?.topProducts || []).map((p) => (
                <tr key={p.name} className="border-b border-border">
                  <td className="px-2 py-2 font-semibold">{p.name}</td>
                  <td className="px-2 py-2">{p.quantity}</td>
                  <td className="px-2 py-2">{formatCurrency(p.revenue)}</td>
                </tr>
              ))}
              {!loading && (!data?.topProducts || data.topProducts.length === 0) ? (
                <tr>
                  <td className="text-muted-foreground px-2 py-4" colSpan={3}>
                    {t.noData}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      {loading ? (
        <Card className="border-border p-4 text-sm">
          <div className="text-muted-foreground">{t.loading}</div>
        </Card>
      ) : null}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground text-sm">...</div>}>
      <AnalyticsPageInner />
    </Suspense>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="text-primary mt-1 text-xl font-extrabold">{value}</div>
    </Card>
  );
}

function Trend({ label, value }: { label: string; value: number }) {
  const positive = value >= 0;
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
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
