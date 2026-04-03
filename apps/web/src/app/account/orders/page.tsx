'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { api } from '../../../lib/api';
import { authHeader, getAccessTokenFromCookies } from '../../../lib/auth';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';

type Order = any;

type Meta = { page: number; limit: number; total: number; hasPrev: boolean; hasNext: boolean };

function AccountOrdersPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const page = Math.max(1, Number(sp.get('page') || '1') || 1);

  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<Meta>({ page, limit: 10, total: 0, hasPrev: false, hasNext: false });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const guard = () => {
    const token = getAccessTokenFromCookies();
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(`/account/orders?page=${page}`)}`);
      return false;
    }
    return true;
  };

  const load = async () => {
    if (!guard()) return;
    setLoading(true);
    setMsg(null);

    try {
      const res = await api.get(`/orders?page=${page}&limit=10`, { headers: { ...authHeader(), 'x-client': 'web' } });
      setOrders(res?.data?.data || []);
      setMeta(res?.data?.meta || { page, limit: 10, total: 0, hasPrev: false, hasNext: false });
    } catch (e: any) {
      if (e?.response?.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(`/account/orders?page=${page}`)}`);
        return;
      }
      setMsg(e?.response?.data?.message || 'تعذر تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const empty = useMemo(() => !loading && orders.length === 0, [loading, orders.length]);

  const prevHref = useMemo(() => `/account/orders?page=${Math.max(1, page - 1)}`, [page]);
  const nextHref = useMemo(() => `/account/orders?page=${page + 1}`, [page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-kaffza-primary">سجل الطلبات</h1>
          <p className="mt-1 text-sm text-kaffza-text/80">تابع طلباتك وحالاتها.</p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          تحديث
        </Button>
      </div>

      {msg ? <Alert kind="error" text={msg} /> : null}

      {empty ? (
        <Card className="p-6">
          <div className="text-sm text-kaffza-text/70">ما عندك طلبات بعد.</div>
          <div className="mt-4">
            <Link href="/store">
              <Button>تسوق الآن</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {loading ? (
            <Card className="p-6">
              <div className="text-sm text-kaffza-text/70">جاري التحميل...</div>
            </Card>
          ) : (
            orders.map((o) => (
              <Card key={String(o.id)} className="p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm text-kaffza-text/70">رقم الطلب</div>
                    <div className="text-lg font-extrabold text-kaffza-primary">{o.orderNumber}</div>
                    <div className="mt-1 text-xs text-kaffza-text/70">
                      {formatDate(o.createdAt)} • متجر: {o.store?.nameAr || o.store?.nameEn || o.store?.subdomain}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-kaffza-text/70">الإجمالي</div>
                      <div className="text-sm font-extrabold text-kaffza-primary">{formatOMR(Number(o.totalAmount))}</div>
                    </div>

                    <StatusBadge status={o.status} />

                    <Link href={`/account/orders/${o.id}`}>
                      <Button>التفاصيل</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Link href={prevHref} aria-disabled={!meta.hasPrev} className={!meta.hasPrev ? 'pointer-events-none opacity-50' : ''}>
          <Button variant="secondary">السابق</Button>
        </Link>

        <div className="text-xs text-kaffza-text/70">
          صفحة {meta.page} • {meta.total} طلب
        </div>

        <Link href={nextHref} aria-disabled={!meta.hasNext} className={!meta.hasNext ? 'pointer-events-none opacity-50' : ''}>
          <Button variant="secondary">التالي</Button>
        </Link>
      </div>
    </div>
  );
}

function Alert({ kind, text }: { kind: 'error' | 'success'; text: string }) {
  const cls = kind === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700';
  return <div className={`rounded-xl border p-4 text-sm ${cls}`}>{text}</div>;
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

export default function AccountOrdersPage() { return <Suspense><AccountOrdersPageInner /></Suspense>; }
