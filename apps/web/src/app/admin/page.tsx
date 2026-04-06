'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { api } from '../../lib/api';
import { authHeader } from '../../lib/auth';
import { Card } from '../../components/Card';

/* ── Mock data (shown when API is not available) ─────────────────────────── */
const MOCK_STATS = {
  merchantsCount: 24,
  totalCommission: 1847.5,
  pendingWithdrawalsCount: 8,
};

const MOCK_RECENT: RecentRow[] = [
  {
    id: '1',
    type: 'store',
    label: 'متجر العروض الذهبية',
    actor: 'علي الشكيلي',
    date: '2025-04-05',
    status: 'active',
  },
  {
    id: '2',
    type: 'order',
    label: 'طلب #ORD-00892',
    actor: 'سالم الحارثي',
    date: '2025-04-05',
    status: 'pending',
  },
  {
    id: '3',
    type: 'store',
    label: 'متجر الأزياء الحديثة',
    actor: 'فاطمة الزهراء',
    date: '2025-04-04',
    status: 'active',
  },
  {
    id: '4',
    type: 'order',
    label: 'طلب #ORD-00891',
    actor: 'خالد المكتومي',
    date: '2025-04-04',
    status: 'delivered',
  },
  {
    id: '5',
    type: 'store',
    label: 'متجر الإلكترونيات',
    actor: 'محمد الوهيبي',
    date: '2025-04-03',
    status: 'suspended',
  },
];

interface RecentRow {
  id: string;
  type: 'store' | 'order';
  label: string;
  actor: string;
  date: string;
  status: string;
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function formatOMR(v: number) {
  const n = Number.isFinite(v) ? v : 0;
  return `${n.toFixed(3)} ر.ع`;
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString('ar-OM', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return d;
  }
}

/* ── KPI Card ─────────────────────────────────────────────────────────────── */
function KpiCard({
  title,
  value,
  loading,
  icon,
  accent,
}: {
  title: string;
  value: string;
  loading: boolean;
  icon: string;
  accent: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
        style={{ backgroundColor: `${accent}18` }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500">{title}</p>
        {loading ? (
          <div className="mt-1.5 h-6 w-24 animate-pulse rounded-lg bg-slate-100" />
        ) : (
          <p className="mt-0.5 text-xl font-extrabold" style={{ color: '#0F172A' }}>
            {value}
          </p>
        )}
      </div>
    </Card>
  );
}

/* ── Status Badge ─────────────────────────────────────────────────────────── */
function Badge({ status }: { status: string }) {
  const s = String(status || '').toLowerCase();
  const map: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    delivered: 'bg-blue-50 text-blue-700 border-blue-200',
    suspended: 'bg-red-50 text-red-700 border-red-200',
  };
  const cls = map[s] ?? 'bg-slate-100 text-slate-700 border-slate-200';
  const labels: Record<string, string> = {
    active: 'نشط',
    pending: 'قيد المعالجة',
    delivered: 'مُسلَّم',
    suspended: 'موقوف',
  };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${cls}`}>
      {labels[s] ?? status}
    </span>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function AdminOverview() {
  const [stats, setStats] = useState<typeof MOCK_STATS | null>(null);
  const [recent, setRecent] = useState<RecentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usedMock, setUsedMock] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, ordersRes] = await Promise.all([
        api.get('/admin/stats', { headers: { ...authHeader(), 'x-client': 'web' } }),
        api.get('/admin/orders?limit=5&status=active', {
          headers: { ...authHeader(), 'x-client': 'web' },
        }),
      ]);

      const s = statsRes?.data?.data ?? {};
      setStats({
        merchantsCount: s.merchantsCount ?? 0,
        totalCommission: s.totalCommission ?? s.platformEarnings ?? 0,
        pendingWithdrawalsCount: s.pendingWithdrawalsCount ?? s.pendingWithdrawals ?? 0,
      });

      const rawOrders: any[] = ordersRes?.data?.data ?? [];
      setRecent(
        rawOrders.slice(0, 5).map((o: any) => ({
          id: String(o.id),
          type: 'order' as const,
          label: `طلب #${o.orderNumber ?? o.id}`,
          actor: o.customerName ?? o.customer?.name ?? '—',
          date: o.createdAt ?? '',
          status: o.status ?? 'pending',
        }))
      );
    } catch {
      /* Fall back to mock data when endpoints are not ready */
      setStats(MOCK_STATS);
      setRecent(MOCK_RECENT);
      setUsedMock(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>
          نظرة عامة على المنصة
        </h1>
        <p className="mt-1 text-sm text-slate-500">إحصائيات لحظية لمنصة قفزة.</p>
      </div>

      {usedMock && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          ⚠️ يتم عرض بيانات تجريبية — تأكد من اتصال الخادم وصلاحيات Admin.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          title="إجمالي التجار المسجلين"
          value={String(stats?.merchantsCount ?? 0)}
          loading={loading}
          icon="🏪"
          accent="#6366F1"
        />
        <KpiCard
          title="عمولة المنصة (إجمالي الأرباح)"
          value={formatOMR(stats?.totalCommission ?? 0)}
          loading={loading}
          icon="💰"
          accent="#10B981"
        />
        <KpiCard
          title="طلبات السحب المعلقة"
          value={String(stats?.pendingWithdrawalsCount ?? 0)}
          loading={loading}
          icon="🏦"
          accent="#F59E0B"
        />
      </div>

      {/* Recent Activity */}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-extrabold" style={{ color: '#0F172A' }}>
            آخر النشاطات
          </h2>
          <Link
            href="/admin/merchants"
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            عرض التجار ←
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-right">
              <tr>
                <th className="px-5 py-3 text-xs font-bold text-slate-500">النشاط</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500">المستخدم</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500">التاريخ</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-t border-slate-50">
                    {Array.from({ length: 4 }).map((__, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : recent.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-sm text-slate-400">
                    لا توجد نشاطات حديثة.
                  </td>
                </tr>
              ) : (
                recent.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-slate-50 transition-colors hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{row.type === 'store' ? '🏪' : '🧾'}</span>
                        <span className="font-semibold text-slate-700">{row.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{row.actor}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(row.date)}</td>
                    <td className="px-5 py-3">
                      <Badge status={row.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
