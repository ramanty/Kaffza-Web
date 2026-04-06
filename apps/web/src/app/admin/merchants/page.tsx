'use client';

import { useEffect, useMemo, useState } from 'react';

import { api } from '../../../lib/api';
import { authHeader } from '../../../lib/auth';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';

/* ── Types ───────────────────────────────────────────────────────────────── */
interface MerchantRow {
  id: string;
  storeName: string;
  ownerName: string;
  createdAt: string;
  status: 'active' | 'suspended' | 'blocked' | string;
  thawaniSetup: boolean;
}

/* ── Mock data (fallback when API is not ready) ───────────────────────────── */
const MOCK_MERCHANTS: MerchantRow[] = [
  {
    id: '1',
    storeName: 'متجر الأزياء الحديثة',
    ownerName: 'فاطمة الزهراء',
    createdAt: '2025-01-15',
    status: 'active',
    thawaniSetup: true,
  },
  {
    id: '2',
    storeName: 'متجر العروض الذهبية',
    ownerName: 'علي الشكيلي',
    createdAt: '2025-02-03',
    status: 'active',
    thawaniSetup: true,
  },
  {
    id: '3',
    storeName: 'متجر الإلكترونيات',
    ownerName: 'محمد الوهيبي',
    createdAt: '2025-02-20',
    status: 'suspended',
    thawaniSetup: false,
  },
  {
    id: '4',
    storeName: 'بوتيك النخبة',
    ownerName: 'خالد المكتومي',
    createdAt: '2025-03-05',
    status: 'active',
    thawaniSetup: false,
  },
  {
    id: '5',
    storeName: 'متجر الرياضة',
    ownerName: 'سالم الحارثي',
    createdAt: '2025-03-18',
    status: 'active',
    thawaniSetup: true,
  },
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */
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

function normaliseRow(raw: any): MerchantRow {
  return {
    id: String(raw.id ?? raw._id ?? ''),
    storeName: raw.storeName ?? raw.store?.name ?? raw.name ?? '—',
    ownerName: raw.ownerName ?? raw.owner?.name ?? raw.user?.name ?? '—',
    createdAt: raw.createdAt ?? raw.created_at ?? '',
    status: raw.status ?? 'active',
    thawaniSetup: Boolean(raw.thawaniSetup ?? raw.hasThawani ?? raw.paymentConfigured),
  };
}

/* ── Status Badge ─────────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const s = String(status || '').toLowerCase();
  const map: Record<string, { cls: string; label: string }> = {
    active: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'نشط' },
    suspended: { cls: 'bg-red-50 text-red-700 border-red-200', label: 'موقوف' },
    blocked: { cls: 'bg-rose-100 text-rose-800 border-rose-200', label: 'محظور' },
  };
  const { cls, label } = map[s] ?? {
    cls: 'bg-slate-100 text-slate-700 border-slate-200',
    label: status,
  };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${cls}`}>
      {label}
    </span>
  );
}

/* ── Thawani Badge ────────────────────────────────────────────────────────── */
function ThawaniBadge({ ready }: { ready: boolean }) {
  return ready ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
      ✓ مُفعَّل
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500">
      غير مُفعَّل
    </span>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function AdminMerchants() {
  const [items, setItems] = useState<MerchantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [usedMock, setUsedMock] = useState(false);

  const load = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.get('/admin/merchants', {
        headers: { ...authHeader(), 'x-client': 'web' },
      });
      const raw: any[] = res?.data?.data ?? [];
      setItems(raw.map(normaliseRow));
      setUsedMock(false);
    } catch {
      /* Fall back to mock data */
      setItems(MOCK_MERCHANTS);
      setUsedMock(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (id: string, suspend: boolean) => {
    setMsg(null);
    try {
      if (suspend) {
        await api.patch(
          `/admin/merchants/${id}/ban`,
          {},
          { headers: { ...authHeader(), 'x-client': 'web' } }
        );
      } else {
        await api.patch(
          `/admin/merchants/${id}/unban`,
          {},
          { headers: { ...authHeader(), 'x-client': 'web' } }
        );
      }
      await load();
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'فشل تحديث الحالة');
    }
  };

  const rows = useMemo(() => items, [items]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>
            إدارة التجار
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            عرض جميع التجار والمتاجر المسجلة على المنصة — وإدارة حالاتهم.
          </p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          {loading ? 'جاري التحديث...' : 'تحديث'}
        </Button>
      </div>

      {usedMock && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          ⚠️ يتم عرض بيانات تجريبية — تأكد من اتصال الخادم وصلاحيات Admin.
        </div>
      )}

      {msg && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {msg}
        </div>
      )}

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-right">
              <tr>
                <th className="px-5 py-3 text-xs font-bold text-slate-500">اسم المتجر</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500">المالك</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500">تاريخ الإنشاء</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500">الحالة</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500">إعداد ثواني</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-slate-50">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400">
                    لا يوجد تجار مسجلون.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const isSuspended = row.status === 'suspended' || row.status === 'blocked';
                  return (
                    <tr
                      key={row.id}
                      className="border-t border-slate-50 transition-colors hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-3 font-semibold text-slate-800">{row.storeName}</td>
                      <td className="px-5 py-3 text-slate-600">{row.ownerName}</td>
                      <td className="px-5 py-3 text-slate-500">{formatDate(row.createdAt)}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-5 py-3">
                        <ThawaniBadge ready={row.thawaniSetup} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <a
                            href={`/admin/merchants/${row.id}`}
                            className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                          >
                            عرض التفاصيل
                          </a>
                          {isSuspended ? (
                            <Button
                              variant="secondary"
                              className="!px-3 !py-1 !text-xs"
                              onClick={() => toggle(row.id, false)}
                            >
                              تفعيل
                            </Button>
                          ) : (
                            <button
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
                              onClick={() => toggle(row.id, true)}
                            >
                              تعليق المتجر
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
