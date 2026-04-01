'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { api } from '../../../../lib/api';
import { authHeader, getAccessTokenFromCookies } from '../../../../lib/auth';
import { Card } from '../../../../components/Card';
import { Button } from '../../../../components/Button';
import { Input } from '../../../../components/Input';

type Store = { id: string; nameAr?: string; nameEn?: string; subdomain: string };

type CartItem = {
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product: { id: string; nameAr?: string; nameEn?: string; images?: string[] };
  variant: { id: string; nameAr?: string; nameEn?: string } | null;
};

type CartData = {
  storeId: string;
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  currency: string;
};

type Order = {
  id: string;
  orderNumber: string;
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  items: any[];
  store: { id: string; subdomain: string };
};

export default function StoreCheckout({ params }: { params: { subdomain: string } }) {
  const router = useRouter();
  const sp = useSearchParams();
  const subdomain = params.subdomain;

  const retryOrderId = sp.get('orderId'); // comes from /pay/cancel

  const [store, setStore] = useState<Store | null>(null);
  const [cart, setCart] = useState<CartData | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState(''); // محافظة
  const [city, setCity] = useState(''); // ولاية / مدينة
  const [addressLine1, setAddressLine1] = useState(''); // عنوان
  const [notes, setNotes] = useState('');

  const items = useMemo(() => {
    if (order?.items?.length) {
      // order item shape
      return order.items.map((it: any) => ({
        key: String(it.id),
        title: it.productName,
        qty: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        lineTotal: Number(it.totalPrice),
      }));
    }
    return (cart?.items || []).map((it) => ({
      key: `${it.productId}:${it.variantId || 'no'}`,
      title: `${it.product?.nameAr || it.product?.nameEn}${it.variant ? ` - ${it.variant.nameAr || it.variant.nameEn}` : ''}`,
      qty: it.quantity,
      unitPrice: Number(it.unitPrice),
      lineTotal: Number(it.lineTotal),
    }));
  }, [cart, order]);

  const totals = useMemo(() => {
    if (order) {
      return {
        subtotal: Number(order.subtotal ?? 0),
        shipping: Number(order.shippingCost ?? 0),
        total: Number(order.totalAmount ?? 0),
      };
    }
    return {
      subtotal: Number(cart?.subtotal ?? 0),
      shipping: Number(cart?.shippingCost ?? 0),
      total: Number(cart?.total ?? 0),
    };
  }, [cart, order]);

  const load = async () => {
    setLoading(true);
    setMsg(null);
    try {
      // 1) store by subdomain
      const s = await api.get(`/stores/subdomain/${subdomain}`);
      const st = s.data.data;
      const storeId = String(st.id);
      setStore({ id: storeId, nameAr: st.nameAr, nameEn: st.nameEn, subdomain });

      // 2) If retry orderId exists, fetch order details.
      if (retryOrderId) {
        const o = await api.get(`/orders/${retryOrderId}`, { headers: { ...authHeader(), 'x-client': 'web' } });
        setOrder(o.data.data);
        setCart(null);
        return;
      }

      // 3) Otherwise load cart
      const c = await api.get(`/stores/${storeId}/cart`, { headers: { ...authHeader(), 'x-client': 'web' } });
      setCart(c.data.data);
      setOrder(null);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) {
        router.replace(`/login?next=${encodeURIComponent(`/store/${subdomain}/checkout`)}`);
        return;
      }
      setMsg(e?.response?.data?.message || 'فشل تحميل بيانات الدفع');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getAccessTokenFromCookies();
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(`/store/${subdomain}/checkout`)}`);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subdomain, retryOrderId]);

  async function createThawaniSession(_storeId: string, orderId: string) {
    const res = await api.post(
      `/stores/${_storeId}/payments/create-session`,
      { orderId },
      { headers: { ...authHeader(), 'x-client': 'web' } }
    );
    const paymentUrl = res?.data?.data?.paymentUrl;
    const sessionId = res?.data?.data?.sessionId;
    if (!paymentUrl || !sessionId) throw new Error('فشل إنشاء جلسة الدفع');
    return { paymentUrl, sessionId };
  }

  const payNow = async () => {
    if (!store) return;

    // Validation if we are creating a NEW order
    const isRetry = !!retryOrderId;
    if (!isRetry) {
      if (!fullName.trim() || !phone.trim() || !state.trim() || !addressLine1.trim()) {
        setMsg('يرجى تعبئة اسم المستلم والهاتف والمحافظة والعنوان.');
        return;
      }
      if (!cart?.items?.length) {
        setMsg('السلة فارغة.');
        return;
      }
    }

    setLoading(true);
    setMsg(null);

    try {
      let orderId = retryOrderId;

      // 1) Create order from cart if not retry
      if (!orderId) {
        const cityValue = city.trim() || state.trim();
        const resOrder = await api.post(
          `/stores/${store.id}/orders/checkout`,
          {
            shippingAddress: {
              fullName: fullName.trim(),
              phone: phone.trim(),
              addressLine1: addressLine1.trim(),
              city: cityValue,
              state: state.trim(),
              country: 'OM',
            },
            customerNotes: notes.trim() || undefined,
          },
          { headers: { ...authHeader(), 'x-client': 'web' } }
        );

        orderId = resOrder?.data?.data?.orderId;
        if (!orderId) throw new Error('تعذر إنشاء الطلب');
      }

      // 2) Create Thawani session + redirect user to Thawani checkout
      const { paymentUrl } = await createThawaniSession(store.id, String(orderId));
      window.location.href = paymentUrl;
    } catch (e: any) {
      setMsg(e?.response?.data?.message || e?.message || 'تعذر فتح صفحة الدفع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir="rtl" className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-2xl font-extrabold text-kaffza-primary">إتمام الشراء</div>
          <div className="mt-1 text-sm text-kaffza-text/80">
            {retryOrderId ? 'إعادة محاولة الدفع للطلب السابق.' : 'أدخل عنوان الشحن ثم اضغط “ادفع الآن” للانتقال إلى Thawani.'}
          </div>
          {msg ? <div className="mt-3 text-sm text-red-700">{msg}</div> : null}
        </div>

        <div className="flex gap-2">
          <Link href={`/store/${subdomain}/cart`}>
            <Button variant="secondary">رجوع للسلة</Button>
          </Link>
          <Button variant="secondary" onClick={load} disabled={loading}>
            تحديث
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {/* Form */}
        <Card className="p-6 lg:col-span-2">
          <div className="text-sm font-extrabold text-kaffza-primary">عنوان الشحن</div>
          {retryOrderId ? (
            <div className="mt-3 rounded-xl bg-kaffza-bg p-4 text-sm text-kaffza-text">
              هذا الطلب تم إنشاؤه مسبقاً، يمكنك الآن إعادة إنشاء جلسة الدفع والانتقال إلى Thawani.
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="الاسم الكامل">
                <Input value={fullName} onChange={(e: any) => setFullName(e.target.value)} placeholder="محمد" />
              </Field>
              <Field label="رقم الهاتف">
                <Input value={phone} onChange={(e: any) => setPhone(e.target.value)} placeholder="+9689xxxxxxx" />
              </Field>
              <Field label="المحافظة">
                <Input value={state} onChange={(e: any) => setState(e.target.value)} placeholder="مسقط" />
              </Field>
              <Field label="الولاية / المدينة (اختياري)">
                <Input value={city} onChange={(e: any) => setCity(e.target.value)} placeholder="السيب" />
              </Field>
              <Field label="العنوان">
                <Input value={addressLine1} onChange={(e: any) => setAddressLine1(e.target.value)} placeholder="شارع ...، مبنى ..." />
              </Field>
              <Field label="ملاحظات (اختياري)">
                <Input value={notes} onChange={(e: any) => setNotes(e.target.value)} placeholder="اتصل قبل التوصيل" />
              </Field>
            </div>
          )}

          <div className="mt-6">
            <Button className="w-full" onClick={payNow} disabled={loading || items.length === 0}>
              {loading ? 'جارٍ التحضير...' : 'ادفع الآن عبر Thawani'}
            </Button>
            <div className="mt-2 text-xs text-kaffza-text/70">
              سيتم إنشاء جلسة دفع في وضع الاختبار (Sandbox) ثم تحويلك لصفحة Thawani.
            </div>
          </div>
        </Card>

        {/* Summary */}
        <Card className="p-6 lg:col-span-1">
          <div className="text-sm font-extrabold text-kaffza-primary">ملخص الطلب</div>
          <div className="mt-1 text-xs text-kaffza-text/70">
            {store ? `متجر: ${store.nameAr || store.nameEn || store.subdomain}` : ''}
            {retryOrderId ? <span className="mr-2">• رقم الطلب: {retryOrderId}</span> : null}
          </div>

          <div className="mt-4 space-y-2">
            {loading && items.length === 0 ? (
              <div className="text-sm text-kaffza-text/70">جاري التحميل...</div>
            ) : items.length === 0 ? (
              <div className="text-sm text-kaffza-text/70">لا يوجد عناصر.</div>
            ) : (
              items.map((it) => (
                <div key={it.key} className="flex items-start justify-between gap-3 rounded-lg bg-kaffza-bg px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-bold text-kaffza-text">{it.title}</div>
                    <div className="mt-0.5 text-[11px] text-kaffza-text/70">
                      {it.qty} × {formatOMR(it.unitPrice)}
                    </div>
                  </div>
                  <div className="shrink-0 text-xs font-extrabold text-kaffza-primary">{formatOMR(it.lineTotal)}</div>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 space-y-2 text-sm">
            <Row label="المجموع الفرعي" value={formatOMR(totals.subtotal)} />
            <Row label="الشحن" value={formatOMR(totals.shipping)} />
            <div className="border-t border-black/10 pt-3">
              <Row label="الإجمالي" value={formatOMR(totals.total)} strong />
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: any }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-bold text-kaffza-text">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-kaffza-text/80">{label}</span>
      <span className={strong ? 'font-extrabold text-kaffza-primary' : 'font-bold text-kaffza-text'}>{value}</span>
    </div>
  );
}

function formatOMR(v: number) {
  const n = Number.isFinite(v) ? v : 0;
  return `${n.toFixed(3)} ر.ع`;
}
