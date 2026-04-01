'use client';

import { useEffect, useMemo, useState } from 'react';

import { api } from '../../../lib/api';
import { authHeader } from '../../../lib/auth';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';

export default function AdminCustomers() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.get('/admin/users?role=customer', { headers: { ...authHeader(), 'x-client': 'web' } });
      setItems(res?.data?.data || []);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'تعذر تحميل العملاء');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (id: string, suspended: boolean) => {
    setMsg(null);
    try {
      await api.patch(`/admin/users/${id}`, { suspended }, { headers: { ...authHeader(), 'x-client': 'web' } });
      await load();
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'فشل تحديث الحالة');
    }
  };

  const rows = useMemo(() => items, [items]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-kaffza-primary">إدارة العملاء</h1>
          <p className="mt-1 text-sm text-kaffza-text/80">عرض العملاء وتفعيل/تعليق الحساب.</p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>تحديث</Button>
      </div>

      {msg ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{msg}</div> : null}

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-kaffza-bg">
              <tr className="text-right">
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">الاسم</th>
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">الهاتف</th>
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">الحالة</th>
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-6 text-kaffza-text/70">جاري التحميل...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-kaffza-text/70">لا يوجد عملاء.</td></tr>
              ) : (
                rows.map((u) => (
                  <tr key={String(u.id)} className="border-t border-black/5">
                    <td className="px-4 py-3 font-bold text-kaffza-text">{u.name}</td>
                    <td className="px-4 py-3 text-kaffza-text/80">{u.phone}</td>
                    <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                    <td className="px-4 py-3">
                      {u.status === 'suspended' ? (
                        <Button variant="secondary" onClick={() => toggle(String(u.id), false)}>تفعيل</Button>
                      ) : (
                        <Button variant="secondary" onClick={() => toggle(String(u.id), true)}>تعليق</Button>
                      )}
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

function StatusBadge({ status }: { status: string }) {
  const s = String(status || '').toLowerCase();
  const base = 'inline-flex rounded-full px-3 py-1 text-xs font-extrabold';
  if (s === 'active') return <span className={`${base} bg-green-50 text-green-700`}>active</span>;
  if (s === 'suspended') return <span className={`${base} bg-red-50 text-red-700`}>suspended</span>;
  return <span className={`${base} bg-gray-100 text-gray-700`}>{status}</span>;
}
