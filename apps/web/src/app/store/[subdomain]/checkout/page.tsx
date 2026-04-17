'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { api } from '../../../../lib/api';
import { authHeader, getAccessTokenFromCookies } from '../../../../lib/auth';
import { Card } from '../../../../components/Card';
import { Button } from '../../../../components/Button';
import { Input } from '../../../../components/Input';

type PaymentMethod = 'card' | 'cod' | 'wallet' | 'bnpl';

type PaymentSettings = {
  cardEnabled?: boolean;
  codEnabled?: boolean;
  walletEnabled?: boolean;
  bnplEnabled?: boolean;
};

type Store = {
  id: string;
  nameAr?: string;
  nameEn?: string;
  subdomain: string;
  paymentSettings?: PaymentSettings;
};

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
  payment?: { gateway?: string };
};

const METHOD_LABELS: Record<PaymentMethod, { ar: string; en: string }> = {
  card: { ar: 'بطاقة', en: 'Card' },
  cod: { ar: 'الدفع عند الاستلام', en: 'Cash on Delivery' },
  wallet: { ar: 'المحفظة (قريباً)', en: 'Wallet (Soon)' },
  bnpl: { ar: 'اشتر الآن وادفع لاحقاً (قريباً)', en: 'BNPL (Soon)' },
};

function StoreCheckoutInner({ params }: { params: { subdomain: string } }) {
  const router = useRouter();
  const sp = useSearchParams();
  const subdomain = params.subdomain;

  const retryOrderId = sp.get('orderId');

  const [store, setStore] = useState<Store | null>(null);
  const [cart, setCart] = useState<CartData | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  const availableMethods = useMemo<PaymentMethod[]>(() => {
    const s = store?.paymentSettings;
    const methods: PaymentMethod[] = [];
    if (s?.cardEnabled ?? true) methods.push('card');
    if (s?.codEnabled) methods.push('cod');
    if (s?.walletEnabled) methods.push('wallet');
    if (s?.bnplEnabled) methods.push('bnpl');
    return methods.length ? methods : ['card'];
  }, [store?.paymentSettings]);

  const items = useMemo(() => {
    if (order?.items?.length) {
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
      const s = await api.get(`/stores/subdomain/${subdomain}`);
      const st = s.data.data;
      const storeId = String(st.id);
      setStore({
        id: storeId,
        nameAr: st.nameAr,
        nameEn: st.nameEn,
        subdomain,
        paymentSettings: st.paymentSettings,
      });

      if (retryOrderId) {
        const o = await api.get(`/orders/${retryOrderId}`, {
          headers: { ...authHeader(), 'x-client': 'web' },
        });
        const loadedOrder = o.data.data;
        setOrder(loadedOrder);
        setCart(null);
        if (loadedOrder?.payment?.gateway === 'cod') setPaymentMethod('cod');
        else if (loadedOrder?.payment?.gateway === 'wallet') setPaymentMethod('wallet');
        else if (loadedOrder?.payment?.gateway === 'bnpl') setPaymentMethod('bnpl');
        else setPaymentMethod('card');
        return;
      }

      const c = await api.get(`/stores/${storeId}/cart`, {
        headers: { ...authHeader(), 'x-client': 'web' },
      });
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
     
  }, [subdomain, retryOrderId]);

  useEffect(() => {
    if (!availableMethods.includes(paymentMethod)) {
      setPaymentMethod(availableMethods[0]);
    }
  }, [availableMethods, paymentMethod]);

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

  const placeOrder = async () => {
    if (!store) return;

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
      const activeMethod = isRetry
        ? paymentMethodFromGateway(order?.payment?.gateway)
        : paymentMethod;

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
            paymentMethod: activeMethod,
          },
          { headers: { ...authHeader(), 'x-client': 'web' } }
        );

        orderId = resOrder?.data?.data?.orderId;
        if (!orderId) throw new Error('تعذر إنشاء الطلب');
      }

      if (activeMethod === 'card') {
        const { paymentUrl } = await createThawaniSession(store.id, String(orderId));
        window.location.href = paymentUrl;
        return;
      }

      setMsg('تم إنشاء الطلب بنجاح. يمكنك متابعة الطلب من صفحة حسابي.');
      router.push(`/account/orders/${orderId}`);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || e?.message || 'تعذر إكمال الطلب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir="rtl" className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-kaffza-primary text-2xl font-extrabold">إتمام الشراء</div>
          <div className="text-kaffza-text/80 mt-1 text-sm">
            {retryOrderId ? 'إعادة محاولة الدفع للطلب السابق.' : 'أدخل عنوان الشحن ثم أكمل الطلب.'}
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
        <Card className="p-6 lg:col-span-2">
          <div className="text-kaffza-primary text-sm font-extrabold">عنوان الشحن</div>
          {retryOrderId ? (
            <div className="bg-kaffza-bg text-kaffza-text mt-3 rounded-xl p-4 text-sm">
              هذا الطلب تم إنشاؤه مسبقاً. يمكنك إعادة المحاولة إذا كانت طريقة الدفع بطاقة.
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="الاسم الكامل">
                <Input
                  value={fullName}
                  onChange={(e: any) => setFullName(e.target.value)}
                  placeholder="محمد"
                />
              </Field>
              <Field label="رقم الهاتف">
                <Input
                  value={phone}
                  onChange={(e: any) => setPhone(e.target.value)}
                  placeholder="+9689xxxxxxx"
                />
              </Field>
              <Field label="المحافظة">
                <Input
                  value={state}
                  onChange={(e: any) => setState(e.target.value)}
                  placeholder="مسقط"
                />
              </Field>
              <Field label="الولاية / المدينة (اختياري)">
                <Input
                  value={city}
                  onChange={(e: any) => setCity(e.target.value)}
                  placeholder="السيب"
                />
              </Field>
              <Field label="العنوان">
                <Input
                  value={addressLine1}
                  onChange={(e: any) => setAddressLine1(e.target.value)}
                  placeholder="شارع ...، مبنى ..."
                />
              </Field>
              <Field label="ملاحظات (اختياري)">
                <Input
                  value={notes}
                  onChange={(e: any) => setNotes(e.target.value)}
                  placeholder="اتصل قبل التوصيل"
                />
              </Field>
            </div>
          )}

          {!retryOrderId ? (
            <div className="mt-5 space-y-2">
              <div className="text-kaffza-primary text-sm font-extrabold">
                طريقة الدفع | Payment Method
              </div>
              <div className="grid gap-2">
                {availableMethods.map((method) => (
                  <label
                    key={method}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-black/10 px-3 py-2 text-sm"
                  >
                    <span>
                      {METHOD_LABELS[method].ar} — {METHOD_LABELS[method].en}
                    </span>
                    <input
                      type="radio"
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method)}
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            <Button
              className="w-full"
              onClick={placeOrder}
              disabled={loading || items.length === 0}
            >
              {loading
                ? 'جارٍ التحضير...'
                : paymentMethod === 'card'
                  ? 'ادفع الآن عبر Thawani'
                  : 'تأكيد الطلب'}
            </Button>
            <div className="text-kaffza-text/70 mt-2 text-xs">
              {paymentMethod === 'card'
                ? 'سيتم إنشاء جلسة دفع في وضع الاختبار (Sandbox) ثم تحويلك لصفحة Thawani.'
                : 'ستتم متابعة الطلب بدون جلسة Thawani.'}
            </div>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-1">
          <div className="text-kaffza-primary text-sm font-extrabold">ملخص الطلب</div>
          <div className="text-kaffza-text/70 mt-1 text-xs">
            {store ? `متجر: ${store.nameAr || store.nameEn || store.subdomain}` : ''}
            {retryOrderId ? <span className="mr-2">• رقم الطلب: {retryOrderId}</span> : null}
          </div>

          <div className="mt-4 space-y-2">
            {loading && items.length === 0 ? (
              <div className="text-kaffza-text/70 text-sm">جاري التحميل...</div>
            ) : items.length === 0 ? (
              <div className="text-kaffza-text/70 text-sm">لا يوجد عناصر.</div>
            ) : (
              items.map((it) => (
                <div
                  key={it.key}
                  className="bg-kaffza-bg flex items-start justify-between gap-3 rounded-lg px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="text-kaffza-text truncate text-xs font-bold">{it.title}</div>
                    <div className="text-kaffza-text/70 mt-0.5 text-[11px]">
                      {it.qty} × {formatOMR(it.unitPrice)}
                    </div>
                  </div>
                  <div className="text-kaffza-primary shrink-0 text-xs font-extrabold">
                    {formatOMR(it.lineTotal)}
                  </div>
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

function paymentMethodFromGateway(gateway?: string): PaymentMethod {
  if (gateway === 'cod') return 'cod';
  if (gateway === 'wallet') return 'wallet';
  if (gateway === 'bnpl') return 'bnpl';
  return 'card';
}

function Field({ label, children }: { label: string; children: any }) {
  return (
    <label className="grid gap-1">
      <span className="text-kaffza-text text-sm font-bold">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-kaffza-text/80">{label}</span>
      <span
        className={strong ? 'text-kaffza-primary font-extrabold' : 'text-kaffza-text font-bold'}
      >
        {value}
      </span>
    </div>
  );
}

function formatOMR(v: number) {
  const n = Number.isFinite(v) ? v : 0;
  return `${n.toFixed(3)} ر.ع`;
}

export default function StoreCheckout({ params }: { params: { subdomain: string } }) {
  return (
    <Suspense>
      <StoreCheckoutInner params={params} />
    </Suspense>
  );
}
