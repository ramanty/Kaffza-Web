'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { api } from '../../../../lib/api';
import { authHeader, getAccessTokenFromCookies } from '../../../../lib/auth';
import { Card } from '../../../../components/Card';
import { Button } from '../../../../components/Button';

export default function OrderDetailsPage({ params }: { params: { orderId: string } }) {
  const router = useRouter();
  const orderId = params.orderId;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const guard = () => {
    const token = getAccessTokenFromCookies();
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(`/account/orders/${orderId}`)}`);
      return false;
    }
    return true;
  };

  const load = async () => {
    if (!guard()) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.get(`/orders/${orderId}`, {
        headers: { ...authHeader(), 'x-client': 'web' },
      });
      setOrder(res?.data?.data);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(`/account/orders/${orderId}`)}`);
        return;
      }
      setMsg(e?.response?.data?.message || 'تعذر تحميل تفاصيل الطلب');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
     
  }, [orderId]);

  const status = String(order?.status || '').toLowerCase();
  const canDispute = status === 'shipped' || status === 'delivered';

  const confirmReceipt = async () => {
    if (!guard()) return;
    setConfirming(true);
    setMsg(null);
    try {
      await api.patch(
        `/orders/${orderId}/confirm-receipt`,
        {},
        { headers: { ...authHeader(), 'x-client': 'web' } }
      );
      setMsg('تم تأكيد الاستلام بنجاح');
      await load();
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'فشل تأكيد الاستلام');
    } finally {
      setConfirming(false);
    }
  };

  const timeline = useMemo(() => {
    const steps = [
      { key: 'ordered', label: 'تم الطلب' },
      { key: 'confirmed', label: 'تأكيد' },
      { key: 'shipped', label: 'شحن' },
      { key: 'delivered', label: 'تسليم' },
    ];
    const idx =
      status === 'pending'
        ? 0
        : status === 'confirmed'
          ? 1
          : status === 'shipped'
            ? 2
            : status === 'delivered'
              ? 3
              : 0;
    return { steps, activeIndex: idx };
  }, [status]);

  const totals = useMemo(() => {
    return {
      subtotal: Number(order?.subtotal ?? 0),
      shipping: Number(order?.shippingCost ?? 0),
      total: Number(order?.totalAmount ?? 0),
    };
  }, [order]);

  const reorder = async () => {
    if (!order?.store?.id) return;
    const storeId = String(order.store.id);
    const subdomain = String(order.store.subdomain || '');

    try {
      const items = order.items || [];
      for (const it of items) {
        await api.post(
          `/stores/${storeId}/cart/items`,
          {
            productId: String(it.productId),
            variantId: it.variantId ? String(it.variantId) : undefined,
            quantity: Number(it.quantity),
          },
          { headers: { ...authHeader(), 'x-client': 'web' } }
        );
      }
      router.push(`/store/${encodeURIComponent(subdomain)}/cart`);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'تعذر إعادة الشراء');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-kaffza-primary text-2xl font-extrabold">تفاصيل الطلب</h1>
          <p className="text-kaffza-text/80 mt-1 text-sm">رقم الطلب ومحتوياته وحالة الشحن.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/account/orders">
            <Button variant="secondary">رجوع</Button>
          </Link>
          <Button variant="secondary" onClick={load} disabled={loading}>
            تحديث
          </Button>
        </div>
      </div>

      {msg ? <Alert kind="error" text={msg} /> : null}

      {loading || !order ? (
        <Card className="p-6">
          <div className="text-kaffza-text/70 text-sm">
            {loading ? 'جاري التحميل...' : 'لا توجد بيانات'}
          </div>
        </Card>
      ) : (
        <>
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-kaffza-text/70 text-xs">رقم الطلب</div>
                <div className="text-kaffza-primary text-xl font-extrabold">
                  {order.orderNumber}
                </div>
                <div className="text-kaffza-text/70 mt-1 text-xs">
                  {formatDate(order.createdAt)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={order.status} />

                {status === 'shipped' ? (
                  <Button variant="secondary" onClick={confirmReceipt} disabled={confirming}>
                    {confirming ? 'جارٍ التأكيد...' : 'تأكيد الاستلام'}
                  </Button>
                ) : null}

                {canDispute ? (
                  <Link href={`/account/orders/${orderId}/dispute`}>
                    <Button variant="secondary">فتح نزاع</Button>
                  </Link>
                ) : null}
                <Button onClick={reorder}>إعادة الشراء</Button>
              </div>
            </div>

            <div className="mt-5">
              <Timeline steps={timeline.steps} activeIndex={timeline.activeIndex} />
            </div>
          </Card>

          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <div className="text-kaffza-primary text-sm font-extrabold">المنتجات</div>
              <div className="mt-4 space-y-3">
                {(order.items || []).map((it: any) => (
                  <div
                    key={String(it.id)}
                    className="flex items-start justify-between gap-3 rounded-xl border border-black/5 p-4"
                  >
                    <div className="flex gap-3">
                      <div className="bg-kaffza-bg h-14 w-14 overflow-hidden rounded-xl border border-black/10">
                        {it.product?.images?.[0] ? (
                           
                          <img
                            src={it.product?.images?.[0]}
                            alt="img"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="text-kaffza-text/60 flex h-full w-full items-center justify-center text-[10px] font-bold">
                            No Image
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-kaffza-text text-sm font-bold">{it.productName}</div>
                        <div className="text-kaffza-text/70 mt-1 text-xs">
                          الكمية: {it.quantity}
                        </div>
                        <div className="text-kaffza-text/70 mt-1 text-xs">
                          سعر الوحدة: {formatOMR(Number(it.unitPrice))}
                        </div>
                      </div>
                    </div>
                    <div className="text-kaffza-primary text-sm font-extrabold">
                      {formatOMR(Number(it.totalPrice))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="space-y-5 lg:col-span-1">
              <Card className="p-6">
                <div className="text-kaffza-primary text-sm font-extrabold">عنوان الشحن</div>
                <div className="bg-kaffza-bg text-kaffza-text mt-3 rounded-xl p-4 text-sm">
                  <div className="font-bold">{order.shippingAddress?.fullName}</div>
                  <div className="text-kaffza-text/70 mt-1 text-xs">
                    {order.shippingAddress?.phone}
                  </div>
                  <div className="mt-2">
                    {order.shippingAddress?.state} - {order.shippingAddress?.city}
                  </div>
                  <div className="mt-1">{order.shippingAddress?.addressLine1}</div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="text-kaffza-primary text-sm font-extrabold">الملخص المالي</div>
                <div className="mt-4 space-y-2 text-sm">
                  <Row label="Subtotal" value={formatOMR(totals.subtotal)} />
                  <Row label="Shipping" value={formatOMR(totals.shipping)} />
                  <div className="border-t border-black/10 pt-3">
                    <Row label="Total" value={formatOMR(totals.total)} strong />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
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

function Timeline({
  steps,
  activeIndex,
}: {
  steps: { key: string; label: string }[];
  activeIndex: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {steps.map((s, i) => {
        const active = i <= activeIndex;
        return (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={'h-3 w-3 rounded-full ' + (active ? 'bg-kaffza-primary' : 'bg-black/10')}
            />
            <div
              className={
                'text-xs font-bold ' + (active ? 'text-kaffza-primary' : 'text-kaffza-text/60')
              }
            >
              {s.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-kaffza-text/70">{label}</span>
      <span
        className={strong ? 'text-kaffza-primary font-extrabold' : 'text-kaffza-text font-bold'}
      >
        {value}
      </span>
    </div>
  );
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
