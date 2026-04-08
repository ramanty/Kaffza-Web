'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '../../../lib/api';
import { authHeader } from '../../../lib/auth';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Card } from '../../../components/Card';
import { useStore } from '../store-context';

type Tx = {
  id: string;
  amount: number;
  type: string;
  description: string;
  balanceAfter: number;
  createdAt: string;
};

type Wallet = {
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  transactions?: Tx[];
};

export default function WalletPage() {
  const { storeId, loading: storesLoading } = useStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [withdraw, setWithdraw] = useState({
    amount: '',
    bankName: '',
    accountNumber: '',
    iban: '',
  });
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    if (!storeId) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.get(`/stores/${storeId}/wallet`, {
        headers: { ...authHeader(), 'x-client': 'web' },
      });
      setWallet(res?.data?.data || null);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'حدث خطأ أثناء تحميل المحفظة');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!storeId) {
      setLoading(false);
      return;
    }
    load();
     
  }, [storeId]);

  const available = useMemo(() => Number(wallet?.availableBalance ?? 0), [wallet]);
  const earned = useMemo(() => Number(wallet?.totalEarned ?? 0), [wallet]);

  async function submitWithdraw() {
    if (!storeId) return;
    setError(null);
    setSuccess(null);
    try {
      setSubmitting(true);
      const payload = {
        amount: Number(withdraw.amount),
        bankName: withdraw.bankName.trim(),
        accountNumber: withdraw.accountNumber.trim(),
        iban: withdraw.iban.trim(),
      };
      if (!Number.isFinite(payload.amount) || payload.amount < 10)
        throw new Error('الحد الأدنى للسحب هو 10 ر.ع');
      if (!payload.bankName || !payload.accountNumber || !payload.iban)
        throw new Error('يرجى تعبئة بيانات السحب كاملة');

      await api.patch('/wallet/me/withdraw', payload, {
        headers: { ...authHeader(), 'x-client': 'web' },
      });

      setWithdraw({ amount: '', bankName: '', accountNumber: '', iban: '' });
      setSuccess('تم تقديم طلب السحب بنجاح');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'فشل تقديم طلب السحب');
    } finally {
      setSubmitting(false);
    }
  }

  const txs: Tx[] = (wallet?.transactions || []).map((t: any) => ({
    id: String(t.id),
    amount: Number(t.amount),
    type: String(t.type),
    description: String(t.description || ''),
    balanceAfter: Number(t.balanceAfter ?? 0),
    createdAt: String(t.createdAt),
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-kaffza-primary text-2xl font-extrabold">المحفظة</h1>
        <p className="text-kaffza-text/80 mt-1 text-sm">الرصيد، الأرباح، السحب، وسجل المعاملات.</p>
        {!storeId && !storesLoading ? (
          <p className="mt-1 text-xs text-red-700">لا يوجد متجر محدد.</p>
        ) : null}
      </header>

      {error ? <Alert kind="error" text={error} /> : null}
      {success ? <Alert kind="success" text={success} /> : null}

      <section className="grid gap-4 md:grid-cols-2">
        <StatCard title="الرصيد المتاح" value={formatOMR(available)} loading={loading} />
        <StatCard title="إجمالي الأرباح" value={formatOMR(earned)} loading={loading} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <div className="text-kaffza-primary text-sm font-extrabold">سحب رصيد</div>
          <p className="text-kaffza-text/70 mt-1 text-xs">الحد الأدنى للسحب 10 ر.ع.</p>

          <div className="mt-4 grid gap-3">
            <Field label="المبلغ (OMR)">
              <Input
                value={withdraw.amount}
                onChange={(e: any) => setWithdraw((s) => ({ ...s, amount: e.target.value }))}
                placeholder="10.000"
              />
            </Field>
            <Field label="اسم البنك">
              <Input
                value={withdraw.bankName}
                onChange={(e: any) => setWithdraw((s) => ({ ...s, bankName: e.target.value }))}
                placeholder="Bank Muscat"
              />
            </Field>
            <Field label="رقم الحساب">
              <Input
                value={withdraw.accountNumber}
                onChange={(e: any) => setWithdraw((s) => ({ ...s, accountNumber: e.target.value }))}
                placeholder="123456789"
              />
            </Field>
            <Field label="IBAN">
              <Input
                value={withdraw.iban}
                onChange={(e: any) => setWithdraw((s) => ({ ...s, iban: e.target.value }))}
                placeholder="OM00XXXX..."
              />
            </Field>

            <Button onClick={submitWithdraw} disabled={submitting}>
              {submitting ? 'جارٍ الإرسال...' : 'تقديم طلب سحب'}
            </Button>
          </div>
        </Card>

        <Card className="overflow-hidden p-0 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <div className="text-kaffza-primary text-sm font-extrabold">سجل المعاملات</div>
              <div className="text-kaffza-text/70 mt-1 text-xs">
                آخر 50 معاملة (إن كانت متوفرة من الـ API).
              </div>
            </div>
            <Button variant="secondary" onClick={load}>
              تحديث
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-kaffza-bg">
                <tr className="text-right">
                  <th className="text-kaffza-text px-4 py-3 font-bold">التاريخ</th>
                  <th className="text-kaffza-text px-4 py-3 font-bold">النوع</th>
                  <th className="text-kaffza-text px-4 py-3 font-bold">المبلغ</th>
                  <th className="text-kaffza-text px-4 py-3 font-bold">الوصف</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-kaffza-text/70 px-4 py-6 text-center">
                      جاري التحميل...
                    </td>
                  </tr>
                ) : txs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-kaffza-text/70 px-4 py-6 text-center">
                      لا توجد معاملات لعرضها.
                    </td>
                  </tr>
                ) : (
                  txs.map((t) => (
                    <tr key={t.id} className="border-t border-black/5">
                      <td className="text-kaffza-text/70 px-4 py-3 text-xs">
                        {formatDate(t.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={pillClass(t.type)}>{mapTxType(t.type)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={amountClass(t.amount)}>{formatOMR(t.amount)}</span>
                      </td>
                      <td className="text-kaffza-text px-4 py-3 text-sm">{t.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: any }) {
  return (
    <label className="grid gap-1">
      <span className="text-kaffza-text text-sm font-bold">{label}</span>
      {children}
    </label>
  );
}

function StatCard({ title, value, loading }: { title: string; value: string; loading: boolean }) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="text-kaffza-text/70 text-sm">{title}</div>
      <div className="text-kaffza-primary mt-2 text-2xl font-extrabold">
        {loading ? (
          <span className="inline-block h-7 w-28 animate-pulse rounded bg-black/10" />
        ) : (
          value
        )}
      </div>
    </div>
  );
}

function Alert({ kind, text }: { kind: 'error' | 'success'; text: string }) {
  const cls =
    kind === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-green-200 bg-green-50 text-green-700';
  return <div className={`rounded-xl border p-4 text-sm ${cls}`}>{text}</div>;
}

function formatOMR(v: number) {
  const n = Number.isFinite(v) ? v : 0;
  return `${n.toFixed(3)} ر.ع`;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('ar', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function mapTxType(type: string) {
  switch (type) {
    case 'escrow_hold':
      return 'حجز (Escrow)';
    case 'escrow_release':
      return 'تحرير (Escrow)';
    case 'withdrawal':
      return 'سحب';
    case 'commission':
      return 'عمولة';
    case 'refund':
      return 'استرجاع';
    default:
      return type;
  }
}

function pillClass(type: string) {
  const base = 'inline-flex rounded-full px-3 py-1 text-xs font-extrabold';
  switch (type) {
    case 'escrow_hold':
      return `${base} bg-amber-50 text-amber-700`;
    case 'escrow_release':
      return `${base} bg-green-50 text-green-700`;
    case 'withdrawal':
      return `${base} bg-blue-50 text-blue-700`;
    case 'refund':
      return `${base} bg-red-50 text-red-700`;
    default:
      return `${base} bg-gray-100 text-gray-700`;
  }
}

function amountClass(amount: number) {
  if (amount > 0) return 'font-extrabold text-green-700';
  if (amount < 0) return 'font-extrabold text-red-700';
  return 'font-extrabold text-kaffza-primary';
}
