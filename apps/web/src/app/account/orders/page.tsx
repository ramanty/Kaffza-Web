'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { api } from '../../../lib/api';
import { authHeader, getAccessTokenFromCookies } from '../../../lib/auth';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { formatCurrency } from '@/lib/utils';

type Order = any;

type Meta = { page: number; limit: number; total: number; hasPrev: boolean; hasNext: boolean };

function extractErrorMessage(error: any, fallback: string) {
  const raw = error?.response?.data?.message;
  if (Array.isArray(raw)) return raw.join(' ');
  if (typeof raw === 'string' && raw.trim().length > 0) return raw;
  if (typeof error?.message === 'string' && error.message.trim().length > 0) return error.message;
  return fallback;
}

function AccountOrdersPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const page = Math.max(1, Number(sp.get('page') || '1') || 1);

  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<Meta>({
    page,
    limit: 10,
    total: 0,
    hasPrev: false,
    hasNext: false,
  });
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
      const res = await api.get(`/orders?page=${page}&limit=10`, {
        headers: { ...authHeader(), 'x-client': 'web' },
      });
      setOrders(res?.data?.data || []);
      setMeta(res?.data?.meta || { page, limit: 10, total: 0, hasPrev: false, hasNext: false });
    } catch (e: any) {
      if (e?.response?.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(`/account/orders?page=${page}`)}`);
        return;
      }
      setMsg(extractErrorMessage(e, 'تعذر تحميل الطلبات حالياً. حاول مرة أخرى.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
     
  }, [page]);

  const empty = useMemo(() => !loading && orders.length === 0, [loading, orders.length]);

  const prevHref = useMemo(() => `/account/orders?page=${Math.max(1, page - 1)}`, [page]);
  const nextHref = useMemo(() => `/account/orders?page=${page + 1}`, [page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-primary text-2xl font-extrabold">سجل الطلبات</h1>
          <p className="text-foreground/80 mt-1 text-sm">
            تابع كل طلب من التأكيد حتى التسليم من مكان واحد.
          </p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          تحديث
        </Button>
      </div>

      {msg ? <Alert kind="error" text={msg} /> : null}

      {empty ? (
        <Card className="p-6">
          <div className="text-primary text-sm font-bold">لا توجد طلبات حتى الآن</div>
          <div className="text-muted-foreground mt-1 text-sm">
            ابدأ التسوق الآن، وستظهر طلباتك هنا مع كل تحديث للحالة.
          </div>
          <div className="mt-4">
            <Link href="/store">
              <Button>تسوق الآن</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {loading ? (
            <>
              {[1, 2].map((key) => (
                <Card key={key} className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 w-32 animate-pulse rounded bg-black/10" />
                    <div className="h-3 w-52 animate-pulse rounded bg-black/10" />
                    <div className="h-3 w-20 animate-pulse rounded bg-black/10" />
                  </div>
                </Card>
              ))}
            </>
          ) : (
            orders.map((o) => (
              <Card key={String(o.id)} className="p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-muted-foreground text-sm">رقم الطلب</div>
                    <div className="text-primary text-lg font-extrabold">
                      {o.orderNumber}
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      {formatDate(o.createdAt)} • متجر:{' '}
                      {o.store?.nameAr || o.store?.nameEn || o.store?.subdomain}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-muted-foreground text-xs">الإجمالي</div>
                      <div className="text-primary text-sm font-extrabold">
                        {formatOMR(Number(o.totalAmount))}
                      </div>
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
        <Link
          href={prevHref}
          aria-disabled={!meta.hasPrev || loading}
          className={!meta.hasPrev || loading ? 'pointer-events-none opacity-50' : ''}
        >
          <Button variant="secondary">السابق</Button>
        </Link>

        <div className="text-muted-foreground text-xs">
          صفحة {meta.page} • {meta.total} طلب
        </div>

        <Link
          href={nextHref}
          aria-disabled={!meta.hasNext || loading}
          className={!meta.hasNext || loading ? 'pointer-events-none opacity-50' : ''}
        >
          <Button variant="secondary">التالي</Button>
        </Link>
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

function StatusBadge({ status }: { status: string }) {
  const s = String(status || '').toLowerCase();
  const base = 'inline-flex rounded-full px-3 py-1 text-xs font-extrabold';
  if (s === 'pending') return <span className={`${base} bg-yellow-50 text-yellow-700`}>معلق</span>;
  if (s === 'confirmed') return <span className={`${base} bg-blue-50 text-blue-700`}>مؤكد</span>;
  if (s === 'shipped')
    return <span className={`${base} bg-orange-50 text-orange-700`}>تم الشحن</span>;
  if (s === 'delivered')
    return <span className={`${base} bg-green-50 text-green-700`}>تم التسليم</span>;
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
  return `${formatCurrency(n)}`;
}

export default function AccountOrdersPage() {
  return (
    <Suspense>
      <AccountOrdersPageInner />
    </Suspense>
  );
}
