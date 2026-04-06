'use client';

import { useState } from 'react';

import { Card } from '../../../components/Card';

/* ── Types ───────────────────────────────────────────────────────────────── */
interface PayoutRow {
  id: string;
  merchantName: string;
  storeName: string;
  amount: number;
  bankName: string;
  iban: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

/* ── Mock data (fallback until admin endpoints are ready) ─────────────────── */
const MOCK_PAYOUTS: PayoutRow[] = [
  {
    id: '1',
    merchantName: 'فاطمة الزهراء',
    storeName: 'متجر الأزياء الحديثة',
    amount: 342.5,
    bankName: 'بنك مسقط',
    iban: 'OM810020000012345678901',
    requestDate: '2025-04-03T09:15:00Z',
    status: 'pending',
  },
  {
    id: '2',
    merchantName: 'علي الشكيلي',
    storeName: 'متجر العروض الذهبية',
    amount: 150.0,
    bankName: 'البنك الوطني العماني',
    iban: 'OM810040000098765432101',
    requestDate: '2025-04-04T11:30:00Z',
    status: 'pending',
  },
  {
    id: '3',
    merchantName: 'خالد المكتومي',
    storeName: 'بوتيك النخبة',
    amount: 875.75,
    bankName: 'بنك ظفار',
    iban: 'OM810060000011223344556',
    requestDate: '2025-04-02T14:00:00Z',
    status: 'approved',
  },
  {
    id: '4',
    merchantName: 'سالم الحارثي',
    storeName: 'متجر الرياضة',
    amount: 50.0,
    bankName: 'بنك صحار الدولي',
    iban: 'OM810080000099887766554',
    requestDate: '2025-04-01T08:45:00Z',
    status: 'rejected',
  },
  {
    id: '5',
    merchantName: 'محمد الوهيبي',
    storeName: 'متجر الإلكترونيات',
    amount: 210.25,
    bankName: 'بنك مسقط',
    iban: 'OM810020000055667788990',
    requestDate: '2025-04-05T16:20:00Z',
    status: 'pending',
  },
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function formatOMR(v: number) {
  return `${Number(v).toFixed(3)} ر.ع`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('ar-OM', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/* ── Status Badge ─────────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const map: Record<string, { cls: string; label: string }> = {
    pending: { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'قيد الانتظار' },
    approved: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'موافق عليه' },
    rejected: { cls: 'bg-red-50 text-red-700 border-red-200', label: 'مرفوض' },
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

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function AdminPayoutsPage() {
  const [items, setItems] = useState<PayoutRow[]>(MOCK_PAYOUTS);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const decide = async (id: string, approve: boolean) => {
    setBusy(id);
    setMsg(null);
    try {
      /* When API endpoints are ready, swap this block with a real api.patch call:
         await api.patch(
           `/admin/withdrawals/${id}/${approve ? 'approve' : 'reject'}`,
           { notes: approve ? 'approved' : 'rejected' },
           { headers: { ...authHeader(), 'x-client': 'web' } }
         );
      */
      await new Promise((r) => setTimeout(r, 500));
      setItems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: approve ? 'approved' : 'rejected' } : p))
      );
      setMsg({
        type: 'success',
        text: approve ? 'تمت الموافقة على طلب السحب.' : 'تم رفض طلب السحب.',
      });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setMsg({ type: 'error', text: err?.response?.data?.message ?? 'فشل تحديث الحالة.' });
    } finally {
      setBusy(null);
    }
  };

  const pendingCount = items.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>
            إدارة طلبات السحب (Payouts)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            مراجعة طلبات سحب أرباح التجار والموافقة عليها أو رفضها.
            {pendingCount > 0 && (
              <span className="mr-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                {pendingCount} طلب معلق
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Mock data notice */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        ⚠️ يتم عرض بيانات تجريبية — ستُستبدل بالبيانات الحقيقية عند توفر نقاط النهاية في الخادم.
      </div>

      {msg && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            msg.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-right">
              <tr>
                <th className="px-5 py-3 text-xs font-bold text-slate-500">اسم التاجر</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500">اسم المتجر</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500">المبلغ المطلوب</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500">البنك / IBAN</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500">تاريخ الطلب</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500">الحالة</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500">الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-400">
                    لا توجد طلبات سحب حالياً.
                  </td>
                </tr>
              ) : (
                items.map((row) => {
                  const isPending = row.status === 'pending';
                  const isLoading = busy === row.id;
                  return (
                    <tr
                      key={row.id}
                      className="border-t border-slate-50 transition-colors hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-3 font-semibold text-slate-800">{row.merchantName}</td>
                      <td className="px-5 py-3 text-slate-600">{row.storeName}</td>
                      <td className="px-5 py-3 font-bold text-slate-800">
                        {formatOMR(row.amount)}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-700">{row.bankName}</p>
                        <p className="mt-0.5 font-mono text-xs text-slate-400">{row.iban}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-500">{formatDate(row.requestDate)}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-5 py-3">
                        {isPending ? (
                          <div className="flex items-center gap-2">
                            <button
                              disabled={isLoading}
                              onClick={() => decide(row.id, true)}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {isLoading ? '...' : 'موافقة ✓'}
                            </button>
                            <button
                              disabled={isLoading}
                              onClick={() => decide(row.id, false)}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                            >
                              {isLoading ? '...' : 'رفض ✗'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
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
