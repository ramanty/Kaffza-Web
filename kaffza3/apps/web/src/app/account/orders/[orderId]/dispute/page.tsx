'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { api } from '../../../../../lib/api';
import { authHeader, getAccessTokenFromCookies } from '../../../../../lib/auth';
import { Card } from '../../../../../components/Card';
import { Button } from '../../../../../components/Button';

const REASONS = [
  { value: 'not_received', label: 'منتج لم يصل' },
  { value: 'product_issue', label: 'منتج تالف' },
  { value: 'wrong_item', label: 'منتج مختلف عن الوصف' },
  { value: 'other', label: 'أخرى' },
];

export default function DisputePage({ params }: { params: { orderId: string } }) {
  const router = useRouter();
  const orderId = params.orderId;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const [type, setType] = useState('not_received');
  const [description, setDescription] = useState('');

  const canSubmit = useMemo(() => description.trim().length >= 10, [description]);

  const guard = () => {
    const token = getAccessTokenFromCookies();
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(`/account/orders/${orderId}/dispute`)}`);
      return false;
    }
    return true;
  };

  const load = async () => {
    if (!guard()) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.get(`/orders/${orderId}`, { headers: { ...authHeader(), 'x-client': 'web' } });
      setOrder(res?.data?.data);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(`/account/orders/${orderId}/dispute`)}`);
        return;
      }
      setMsg({ type: 'error', text: e?.response?.data?.message || 'تعذر تحميل الطلب' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const submit = async () => {
    if (!canSubmit) {
      setMsg({ type: 'error', text: 'وصف المشكلة لازم يكون 10 أحرف على الأقل' });
      return;
    }

    setSubmitting(true);
    setMsg(null);
    try {
      // Preferred (existing backend): POST /orders/:orderId/disputes
      await api.post(
        `/disputes`,
        { orderId, reason: type, description: description.trim() },
        { headers: { ...authHeader(), 'x-client': 'web' } }
      );

      setMsg({ type: 'success', text: 'تم إرسال نزاعك بنجاح، سيتم مراجعته خلال 48 ساعة' });
      setTimeout(() => router.push('/account/orders'), 1200);
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'فشل إرسال النزاع' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-kaffza-primary">فتح نزاع</h1>
          <p className="mt-1 text-sm text-kaffza-text/80">أرسل تفاصيل المشكلة وسنراجعها خلال 48 ساعة.</p>
        </div>
        <Link href={`/account/orders/${orderId}`}>
          <Button variant="secondary">رجوع</Button>
        </Link>
      </div>

      {msg ? (
        <div className={
          'rounded-xl border p-4 text-sm ' +
          (msg.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700')
        }>
          {msg.text}
        </div>
      ) : null}

      {loading || !order ? (
        <Card className="p-6"><div className="text-sm text-kaffza-text/70">{loading ? 'جاري التحميل...' : 'لا توجد بيانات'}</div></Card>
      ) : (
        <Card className="p-6">
          <div className="text-sm font-extrabold text-kaffza-primary">ملخص الطلب</div>
          <div className="mt-2 text-xs text-kaffza-text/70">{order.orderNumber} • {formatDate(order.createdAt)} • {order.store?.subdomain}</div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl bg-kaffza-bg p-4 text-sm">
              <div className="font-bold">الإجمالي</div>
              <div className="mt-1 text-sm font-extrabold text-kaffza-primary">{formatOMR(Number(order.totalAmount))}</div>
            </div>
            <div className="rounded-xl bg-kaffza-bg p-4 text-sm">
              <div className="font-bold">الحالة</div>
              <div className="mt-1"><StatusBadge status={order.status} /></div>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="text-sm font-extrabold text-kaffza-primary">بيانات النزاع</div>

        <div className="mt-4 grid gap-4">
          <label className="grid gap-1">
            <span className="text-sm font-bold text-kaffza-text">سبب النزاع</span>
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-kaffza-primary"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-bold text-kaffza-text">وصف المشكلة (إلزامي)</span>
            <textarea
              className="min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-kaffza-primary"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اشرح المشكلة بالتفصيل..."
            />
            <span className="text-xs text-kaffza-text/60">حد أدنى 10 أحرف</span>
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-bold text-kaffza-text">رفع صور كدليل (Placeholder)</span>
            <input type="file" multiple accept="image/*" className="w-full text-sm" disabled />
            <span className="text-xs text-kaffza-text/60">رفع الملفات غير مربوط حالياً، UI فقط.</span>
          </label>

          <Button onClick={submit} disabled={submitting || !canSubmit}>
            {submitting ? 'جارٍ الإرسال...' : 'إرسال النزاع'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = String(status || '').toLowerCase();
  const base = 'inline-flex rounded-full px-3 py-1 text-xs font-extrabold';
  if (s === 'pending') return <span className={`${base} bg-yellow-50 text-yellow-700`}>معلق</span>;
  if (s === 'confirmed') return <span className={`${base} bg-blue-50 text-blue-700`}>مؤكد</span>;
  if (s === 'shipped') return <span className={`${base} bg-orange-50 text-orange-700`}>تم الشحن</span>;
  if (s === 'delivered') return <span className={`${base} bg-green-50 text-green-700`}>تم التسليم</span>;
  if (s === 'cancelled') return <span className={`${base} bg-red-50 text-red-700`}>ملغي</span>;
  return <span className={`${base} bg-gray-100 text-gray-700`}>{status}</span>;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('ar', { year: 'numeric', month: 'short', day: '2-digit' });
  } catch {
    return iso;
  }
}

function formatOMR(v: number) {
  const n = Number.isFinite(v) ? v : 0;
  return `${n.toFixed(3)} ر.ع`;
}
