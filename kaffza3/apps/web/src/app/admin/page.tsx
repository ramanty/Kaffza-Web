'use client';

import { useEffect, useState } from 'react';

import { api } from '../../lib/api';
import { authHeader } from '../../lib/auth';
import { Card } from '../../components/Card';

export default function AdminOverview() {
  const [stats, setStats] = useState<any>(null);
  const [customersCount, setCustomersCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.get('/admin/stats', { headers: { ...authHeader(), 'x-client': 'web' } });
      setStats(res?.data?.data);

      const c = await api.get('/admin/users?role=customer', { headers: { ...authHeader(), 'x-client': 'web' } });
      setCustomersCount((c?.data?.data || []).length);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'تعذر تحميل الإحصائيات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-kaffza-primary">نظرة عامة</h1>
        <p className="mt-1 text-sm text-kaffza-text/80">إحصائيات سريعة عن المنصة.</p>
      </div>

      {msg ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{msg}</div> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="إجمالي التجار" value={loading ? '...' : String(stats?.merchantsCount ?? 0)} />
        <StatCard title="إجمالي العملاء" value={loading ? '...' : String(customersCount)} />
        <StatCard title="إجمالي الطلبات" value={loading ? '...' : String(stats?.ordersCount ?? 0)} />
        <StatCard title="إجمالي المبيعات" value={loading ? '...' : formatOMR(Number(stats?.totalSales ?? 0))} />
      </div>

      <Card className="p-6">
        <div className="text-sm font-extrabold text-kaffza-primary">ملاحظة</div>
        <div className="mt-2 text-sm text-kaffza-text/80">هذه الصفحة تعتمد على /admin/stats. يمكن توسيعها لاحقاً.</div>
      </Card>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card className="p-6">
      <div className="text-xs text-kaffza-text/70">{title}</div>
      <div className="mt-2 text-2xl font-extrabold text-kaffza-primary">{value}</div>
    </Card>
  );
}

function formatOMR(v: number) {
  const n = Number.isFinite(v) ? v : 0;
  return `${n.toFixed(3)} ر.ع`;
}
