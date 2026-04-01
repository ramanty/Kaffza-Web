'use client';

import { useEffect, useMemo, useState } from 'react';

import { api } from '../../../lib/api';
import { authHeader } from '../../../lib/auth';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';

export default function AdminPayments() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.get('/admin/payments', { headers: { ...authHeader(), 'x-client': 'web' } });
      setItems(res?.data?.data || []);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'تعذر تحميل المدفوعات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => items, [items]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-kaffza-primary">المدفوعات</h1>
          <p className="mt-1 text-sm text-kaffza-text/80">سجل المدفوعات على المنصة.</p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>تحديث</Button>
      </div>

      {msg ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{msg}</div> : null}

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-kaffza-bg">
              <tr className="text-right">
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">الطلب</th>
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">المتجر</th>
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">العميل</th>
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">المبلغ</th>
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-kaffza-text/70">جاري التحميل...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-kaffza-text/70">لا يوجد مدفوعات.</td></tr>
              ) : (
                rows.map((p) => (
                  <tr key={String(p.id)} className="border-t border-black/5">
                    <td className="px-4 py-3 font-bold text-kaffza-text">{p.order?.orderNumber || p.orderId}</td>
                    <td className="px-4 py-3 text-kaffza-text/80">{p.order?.store?.subdomain || '-'}</td>
                    <td className="px-4 py-3 text-kaffza-text/80">{p.order?.customer?.name || '-'}</td>
                    <td className="px-4 py-3 text-kaffza-text/80">{formatOMR(Number(p.amount || 0))}</td>
                    <td className="px-4 py-3"><span className="text-xs font-bold text-kaffza-text/70">{p.status}</span></td>
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

function formatOMR(v: number) {
  const n = Number.isFinite(v) ? v : 0;
  return `${n.toFixed(3)} ر.ع`;
}
