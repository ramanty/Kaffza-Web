'use client';

import { useEffect, useMemo, useState } from 'react';

import { api } from '../../../lib/api';
import { authHeader } from '../../../lib/auth';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';

export default function AdminWithdrawalsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.get('/admin/withdrawals', { headers: { ...authHeader(), 'x-client': 'web' } });
      setItems(res?.data?.data || []);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'تعذر تحميل طلبات السحب');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const decide = async (id: string, approve: boolean) => {
    setMsg(null);
    try {
      const url = approve ? `/admin/withdrawals/${id}/approve` : `/admin/withdrawals/${id}/reject`;
      await api.patch(url, { notes: approve ? 'approved' : 'rejected' }, { headers: { ...authHeader(), 'x-client': 'web' } });
      await load();
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'فشل تحديث حالة السحب');
    }
  };

  const rows = useMemo(() => items, [items]);

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-kaffza-primary">إدارة السحوبات</h1>
          <p className="mt-1 text-sm text-kaffza-text/80">مراجعة طلبات سحب التجار والموافقة أو الرفض.</p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>تحديث</Button>
      </div>

      {msg ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{msg}</div> : null}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-kaffza-bg">
              <tr className="text-right">
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">المتجر</th>
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">المبلغ</th>
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">الحالة</th>
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">التاريخ</th>
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-kaffza-text/70">جاري التحميل...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-kaffza-text/70">لا يوجد طلبات سحب حالياً.</td></tr>
              ) : rows.map((w) => (
                <tr key={String(w.id)} className="border-t border-black/5">
                  <td className="px-4 py-3 text-kaffza-text/80">{w.wallet?.store?.subdomain || '-'}</td>
                  <td className="px-4 py-3 font-bold text-kaffza-text">{Number(w.amount || 0).toFixed(3)} ر.ع</td>
                  <td className="px-4 py-3">{String(w.status || '-')}</td>
                  <td className="px-4 py-3 text-kaffza-text/70">{formatDate(w.createdAt)}</td>
                  <td className="px-4 py-3">
                    {String(w.status).toLowerCase() === 'pending' ? (
                      <div className="flex gap-2">
                        <Button onClick={() => decide(String(w.id), true)}>موافقة</Button>
                        <Button variant="secondary" onClick={() => decide(String(w.id), false)}>رفض</Button>
                      </div>
                    ) : <span className="text-xs text-kaffza-text/60">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('ar', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}
