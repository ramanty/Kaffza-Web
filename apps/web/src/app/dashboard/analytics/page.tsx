'use client';

import { useEffect, useState } from 'react';
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
  };
  dailySales: Array<{ date: string; total: number }>;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
};

export default function AnalyticsPage() {
  const { storeId } = useStore();
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);

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
      setError(e?.response?.data?.message || e?.message || 'تعذر تحميل التحليلات');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(days);
     
  }, [storeId, days]);

  const maxDaily = Math.max(...(data?.dailySales.map((x) => x.total) || [0]), 1);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-kaffza-primary text-2xl font-extrabold">التحليلات الذكية</h1>
          <p className="text-kaffza-text/70 mt-1 text-sm">
            أداء المبيعات والطلبات وتكرار الشراء خلال الفترة المحددة.
          </p>
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
              آخر {d} يوم
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
        <Kpi label="إجمالي المبيعات" value={`${Number(data?.kpis.revenue || 0).toFixed(3)} ر.ع`} />
        <Kpi label="عدد الطلبات" value={String(data?.kpis.ordersCount || 0)} />
        <Kpi
          label="متوسط قيمة الطلب"
          value={`${Number(data?.kpis.avgOrderValue || 0).toFixed(3)} ر.ع`}
        />
        <Kpi
          label="معدل العملاء العائدين"
          value={`${Number(data?.kpis.repeatCustomerRate || 0).toFixed(1)}%`}
        />
      </section>

      <Card className="p-5">
        <h2 className="text-kaffza-primary text-sm font-extrabold">مبيعات يومية</h2>
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

      <Card className="p-5">
        <h2 className="text-kaffza-primary text-sm font-extrabold">أفضل المنتجات</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-kaffza-text/70 border-b border-black/10 text-right">
                <th className="px-2 py-2">المنتج</th>
                <th className="px-2 py-2">الكمية</th>
                <th className="px-2 py-2">الإيراد</th>
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
                    لا توجد بيانات كافية للفترة المختارة.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      {loading ? <div className="text-kaffza-text/60 text-sm">جارٍ تحميل التحليلات...</div> : null}
    </div>
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
