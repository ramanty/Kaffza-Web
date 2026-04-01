'use client';

import { useEffect, useMemo, useState } from 'react';

import { api } from '../../../lib/api';
import { authHeader } from '../../../lib/auth';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { useStore } from '../store-context';

const STATUS_OPTIONS = [
  { label: 'pending', value: 'pending' },
  { label: 'processing', value: 'in_transit' },
  { label: 'shipped', value: 'out_for_delivery' },
  { label: 'delivered', value: 'delivered' },
  { label: 'returned', value: 'returned' },
];

export default function DashboardShippingPage() {
  const { storeId } = useStore();

  const [items, setItems] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ page: 1, limit: 20, total: 0, hasPrev: false, hasNext: false });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const load = async () => {
    if (!storeId) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.get(`/stores/${storeId}/shipping?page=${page}&limit=20`, { headers: { ...authHeader(), 'x-client': 'web' } });
      setItems(res?.data?.data || []);
      setMeta(res?.data?.meta || meta);
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'فشل تحميل الشحنات' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, page]);

  const updateStatus = async (shipmentId: string, status: string) => {
    if (!storeId) return;
    setLoading(true);
    setMsg(null);
    try {
      await api.patch(
        `/stores/${storeId}/shipping/${shipmentId}/status`,
        { status },
        { headers: { ...authHeader(), 'x-client': 'web' } }
      );
      setMsg({ type: 'success', text: 'تم تحديث حالة الشحنة' });
      await load();
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'فشل تحديث الحالة' });
    } finally {
      setLoading(false);
    }
  };

  const rows = useMemo(() => items || [], [items]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-kaffza-primary">الشحن</h1>
          <p className="mt-1 text-sm text-kaffza-text/80">إدارة الشحنات وتحديث حالتها.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={load} disabled={loading}>
            تحديث
          </Button>
        </div>
      </div>

      {msg ? <Alert kind={msg.type} text={msg.text} /> : null}

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-kaffza-bg">
              <tr className="text-right">
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">رقم الطلب</th>
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">اسم العميل</th>
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">الحالة</th>
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">تاريخ الإنشاء</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-6 text-kaffza-text/70">جاري التحميل...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-kaffza-text/70">لا يوجد شحنات.</td></tr>
              ) : (
                rows.map((s) => (
                  <tr key={String(s.id)} className="border-t border-black/5">
                    <td className="px-4 py-3 font-bold text-kaffza-text">{s.order?.orderNumber || s.orderId}</td>
                    <td className="px-4 py-3 text-kaffza-text/80">{s.order?.customer?.name || '-'}</td>
                    <td className="px-4 py-3">
                      <select
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-kaffza-primary"
                        value={String(s.status)}
                        onChange={(e) => updateStatus(String(s.id), e.target.value)}
                        disabled={loading}
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                        {/* allow current enum if not in list */}
                        {!STATUS_OPTIONS.some((o) => o.value === String(s.status)) ? (
                          <option value={String(s.status)}>{String(s.status)}</option>
                        ) : null}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-kaffza-text/70">{formatDate(s.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!meta?.hasPrev || loading}>
          السابق
        </Button>
        <div className="text-xs text-kaffza-text/70">صفحة {meta?.page || page} • {meta?.total || 0} شحنة</div>
        <Button variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={!meta?.hasNext || loading}>
          التالي
        </Button>
      </div>
    </div>
  );
}

function Alert({ kind, text }: { kind: 'error' | 'success'; text: string }) {
  const cls = kind === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700';
  return <div className={`rounded-xl border p-4 text-sm ${cls}`}>{text}</div>;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('ar', { year: 'numeric', month: 'short', day: '2-digit' });
  } catch {
    return iso;
  }
}
