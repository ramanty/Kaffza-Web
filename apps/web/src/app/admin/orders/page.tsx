'use client';

import { useEffect, useMemo, useState } from 'react';

import { api } from '../../../lib/api';
import { authHeader } from '../../../lib/auth';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';

const STATUS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'];

export default function AdminOrders() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  const load = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.get('/admin/orders', { headers: { ...authHeader(), 'x-client': 'web' } });
      setItems(res?.data?.data || []);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'تعذر تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => {
    let arr = [...items];
    if (status) arr = arr.filter((o) => String(o.status).toLowerCase() === status);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      arr = arr.filter((o) => String(o.orderNumber || '').toLowerCase().includes(s));
    }
    return arr;
  }, [items, q, status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-kaffza-primary">كل الطلبات</h1>
          <p className="mt-1 text-sm text-kaffza-text/80">بحث/فلترة ومتابعة طلبات المنصة.</p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>تحديث</Button>
      </div>

      {msg ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{msg}</div> : null}

      <Card className="p-6">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-kaffza-primary"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث برقم الطلب"
          />
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-kaffza-primary"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">كل الحالات</option>
            {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="text-xs text-kaffza-text/70">النتائج: {rows.length}</div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-kaffza-bg">
              <tr className="text-right">
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">رقم الطلب</th>
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">العميل</th>
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">التاجر</th>
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">المتجر</th>
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">الإجمالي</th>
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-6 text-kaffza-text/70">جاري التحميل...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-kaffza-text/70">لا يوجد طلبات.</td></tr>
              ) : (
                rows.map((o) => (
                  <tr key={String(o.id)} className="border-t border-black/5">
                    <td className="px-4 py-3 font-bold text-kaffza-text">{o.orderNumber}</td>
                    <td className="px-4 py-3 text-kaffza-text/80">{o.customer?.name || '-'}</td>
                    <td className="px-4 py-3 text-kaffza-text/80">{o.store?.owner?.name || '-'}</td>
                    <td className="px-4 py-3 text-kaffza-text/80">{o.store?.nameAr || o.store?.subdomain || '-'}</td>
                    <td className="px-4 py-3 text-kaffza-text/80">{formatOMR(Number(o.totalAmount))}</td>
                    <td className="px-4 py-3"><Badge status={o.status} /></td>
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

function Badge({ status }: { status: string }) {
  const s = String(status || '').toLowerCase();
  const base = 'inline-flex rounded-full px-3 py-1 text-xs font-extrabold';
  if (s === 'pending') return <span className={`${base} bg-yellow-50 text-yellow-700`}>pending</span>;
  if (s === 'confirmed') return <span className={`${base} bg-blue-50 text-blue-700`}>confirmed</span>;
  if (s === 'shipped') return <span className={`${base} bg-orange-50 text-orange-700`}>shipped</span>;
  if (s === 'delivered') return <span className={`${base} bg-green-50 text-green-700`}>delivered</span>;
  if (s === 'cancelled') return <span className={`${base} bg-red-50 text-red-700`}>cancelled</span>;
  return <span className={`${base} bg-gray-100 text-gray-700`}>{status}</span>;
}

function formatOMR(v: number) {
  const n = Number.isFinite(v) ? v : 0;
  return `${n.toFixed(3)} ر.ع`;
}
