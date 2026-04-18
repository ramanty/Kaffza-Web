'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  payment?: { gateway?: string; status?: string };
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
  const isEn = sp.get('lang') === 'en';
  const withLang = (path: string) =>
    isEn ? `${path}${path.includes('?') ? '&' : '?'}lang=en` : path;

  const retryOrderId = sp.get('orderId');

  const [store, setStore] = useState<Store | null>(null);
  const [cart, setCart] = useState<CartData | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgKind, setMsgKind] = useState<'error' | 'info'>('error');
  const [retryPaymentOrderId, setRetryPaymentOrderId] = useState<string | null>(null);
  const submitLockRef = useRef(false);

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
      title: `${isEn ? it.product?.nameEn || it.product?.nameAr : it.product?.nameAr || it.product?.nameEn}${it.variant ? ` - ${isEn ? it.variant.nameEn || it.variant.nameAr : it.variant.nameAr || it.variant.nameEn}` : ''}`,
      qty: it.quantity,
      unitPrice: Number(it.unitPrice),
      lineTotal: Number(it.lineTotal),
    }));
  }, [cart, isEn, order]);

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
    setRetryPaymentOrderId(null);
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
        if (loadedOrder?.payment?.status === 'paid') {
          setMsgKind('info');
          setMsg(
            isEn
              ? 'This order is already paid. You can track it from My Account.'
              : 'هذا الطلب مدفوع بالفعل. يمكنك متابعته من صفحة حسابي.'
          );
        }
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
        const loginPath = isEn ? '/en/login' : '/login';
        router.replace(
          `${loginPath}?next=${encodeURIComponent(withLang(`/store/${subdomain}/checkout`))}`
        );
        return;
      }
      setMsgKind('error');
      setMsg(
        readApiError(e, isEn ? 'Failed to load checkout data' : 'فشل تحميل بيانات الدفع', isEn)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getAccessTokenFromCookies();
    if (!token) {
      const loginPath = isEn ? '/en/login' : '/login';
      router.replace(
        `${loginPath}?next=${encodeURIComponent(withLang(`/store/${subdomain}/checkout`))}`
      );
      return;
    }
    load();
  }, [isEn, subdomain, retryOrderId]);

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
    if (!paymentUrl || !sessionId)
      throw new Error(isEn ? 'Failed to create payment session' : 'فشل إنشاء جلسة الدفع');
    return { paymentUrl, sessionId };
  }

  const placeOrder = async () => {
    if (!store || submitLockRef.current) return;

    const isRetry = !!retryOrderId;
    if (!isRetry) {
      const validationErrors = validateCheckoutInput({
        fullName,
        phone,
        state,
        addressLine1,
        hasItems: !!cart?.items?.length,
        isEn,
      });
      if (validationErrors.length) {
        setMsgKind('error');
        setMsg(validationErrors.join(' '));
        return;
      }
    }

    submitLockRef.current = true;
    setLoading(true);
    setMsg(null);
    setRetryPaymentOrderId(null);

    try {
      let orderId = retryOrderId;
      const activeMethod = isRetry
        ? paymentMethodFromGateway(order?.payment?.gateway)
        : paymentMethod;

      if (isRetry && activeMethod !== 'card') {
        setMsgKind('info');
        setMsg(
          isEn
            ? 'This order does not require online payment retry. Open order details to track it.'
            : 'هذا الطلب لا يحتاج إعادة محاولة دفع إلكتروني. افتح تفاصيل الطلب لمتابعته.'
        );
        router.push(withLang(`/account/orders/${retryOrderId}`));
        return;
      }

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
        if (!orderId) throw new Error(isEn ? 'Could not create order' : 'تعذر إنشاء الطلب');
      }

      if (activeMethod === 'card') {
        try {
          const { paymentUrl } = await createThawaniSession(store.id, String(orderId));
          window.location.href = paymentUrl;
        } catch {
          setRetryPaymentOrderId(String(orderId));
          setMsgKind('error');
          setMsg(
            isEn
              ? `Order was created, but payment session could not be created. You can retry payment for order #${orderId}.`
              : `تم إنشاء الطلب، لكن تعذر إنشاء جلسة الدفع. يمكنك إعادة المحاولة للطلب رقم ${orderId}.`
          );
        }
        return;
      }

      setMsgKind('info');
      setMsg(
        isEn
          ? 'Order placed successfully. We will now take you to order tracking.'
          : 'تم إنشاء الطلب بنجاح. سيتم تحويلك الآن إلى صفحة متابعة الطلب.'
      );
      router.push(withLang(`/account/orders/${orderId}`));
    } catch (e: any) {
      setMsgKind('error');
      setMsg(readApiError(e, isEn ? 'Could not complete order' : 'تعذر إكمال الطلب', isEn));
    } finally {
      setLoading(false);
      submitLockRef.current = false;
    }
  };

  return (
    <main dir={isEn ? 'ltr' : 'rtl'} className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-kaffza-primary text-2xl font-extrabold">
            {isEn ? 'Checkout' : 'إتمام الشراء'}
          </div>
          <div className="text-kaffza-text/80 mt-1 text-sm">
            {retryOrderId
              ? isEn
                ? 'Retry payment for your existing order.'
                : 'إعادة محاولة الدفع للطلب السابق.'
              : isEn
                ? 'Enter shipping details to complete your order.'
                : 'أدخل عنوان الشحن ثم أكمل الطلب.'}
          </div>
          {!retryOrderId ? (
            <div className="text-kaffza-text/70 mt-2 text-xs">
              {isEn
                ? 'Step 2 of 2: confirm delivery details, choose payment, and place your order.'
                : 'الخطوة 2 من 2: أكد بيانات التوصيل، اختر طريقة الدفع، ثم أكد الطلب.'}
            </div>
          ) : null}
          {msg ? (
            <div
              className={`mt-3 rounded-xl border p-3 text-sm ${msgKind === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-kaffza-primary/20 bg-kaffza-primary/5 text-kaffza-primary'}`}
            >
              {msg}
            </div>
          ) : null}
          {retryPaymentOrderId ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={withLang(
                  `/store/${subdomain}/checkout?orderId=${encodeURIComponent(retryPaymentOrderId)}`
                )}
              >
                <Button>{isEn ? 'Retry payment session' : 'إعادة محاولة جلسة الدفع'}</Button>
              </Link>
              <Link href={withLang(`/account/orders/${retryPaymentOrderId}`)}>
                <Button variant="secondary">
                  {isEn ? 'Open order details' : 'فتح تفاصيل الطلب'}
                </Button>
              </Link>
            </div>
          ) : null}
        </div>

        <div className="flex gap-2">
          <Link href={withLang(`/store/${subdomain}/cart`)}>
            <Button variant="secondary">{isEn ? 'Back to cart' : 'رجوع للسلة'}</Button>
          </Link>
          <Button variant="secondary" onClick={load} disabled={loading}>
            {isEn ? 'Refresh' : 'تحديث'}
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="text-kaffza-primary text-sm font-extrabold">
            {isEn ? 'Shipping address' : 'عنوان الشحن'}
          </div>
          {retryOrderId ? (
            <div className="bg-kaffza-bg text-kaffza-text mt-3 rounded-xl p-4 text-sm">
              {isEn
                ? 'This order already exists. You can retry if payment method is card.'
                : 'هذا الطلب تم إنشاؤه مسبقاً. يمكنك إعادة المحاولة إذا كانت طريقة الدفع بطاقة.'}
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label={isEn ? 'Full name' : 'الاسم الكامل'}>
                <Input
                  value={fullName}
                  onChange={(e: any) => setFullName(e.target.value)}
                  placeholder={isEn ? 'John Doe' : 'محمد'}
                />
                <Hint>
                  {isEn ? 'Name shown to courier on delivery' : 'الاسم الذي يظهر لمندوب التوصيل'}
                </Hint>
              </Field>
              <Field label={isEn ? 'Phone number' : 'رقم الهاتف'}>
                <Input
                  value={phone}
                  onChange={(e: any) => setPhone(e.target.value)}
                  placeholder="+9689xxxxxxx"
                />
                <Hint>
                  {isEn
                    ? 'Use reachable number in international format for delivery updates'
                    : 'استخدم رقماً متاحاً بصيغة دولية لتحديثات التوصيل'}
                </Hint>
              </Field>
              <Field label={isEn ? 'State' : 'المحافظة'}>
                <Input
                  value={state}
                  onChange={(e: any) => setState(e.target.value)}
                  placeholder={isEn ? 'Muscat' : 'مسقط'}
                />
              </Field>
              <Field label={isEn ? 'City (optional)' : 'الولاية / المدينة (اختياري)'}>
                <Input
                  value={city}
                  onChange={(e: any) => setCity(e.target.value)}
                  placeholder={isEn ? 'Seeb' : 'السيب'}
                />
              </Field>
              <Field label={isEn ? 'Address' : 'العنوان'}>
                <Input
                  value={addressLine1}
                  onChange={(e: any) => setAddressLine1(e.target.value)}
                  placeholder={isEn ? 'Street, building...' : 'شارع ...، مبنى ...'}
                />
                <Hint>
                  {isEn
                    ? 'Add street + building/landmark for faster delivery'
                    : 'أضف الشارع + المبنى أو أقرب معلم لتوصيل أسرع'}
                </Hint>
              </Field>
              <Field label={isEn ? 'Notes (optional)' : 'ملاحظات (اختياري)'}>
                <Input
                  value={notes}
                  onChange={(e: any) => setNotes(e.target.value)}
                  placeholder={isEn ? 'Call before delivery' : 'اتصل قبل التوصيل'}
                />
              </Field>
            </div>
          )}

          {!retryOrderId ? (
            <div className="mt-5 space-y-2">
              <div className="text-kaffza-primary text-sm font-extrabold">
                {isEn ? 'Payment method' : 'طريقة الدفع'}
              </div>
              <div className="grid gap-2">
                {availableMethods.map((method) => (
                  <label
                    key={method}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                      paymentMethod === method
                        ? 'border-kaffza-primary bg-kaffza-primary/5'
                        : 'border-black/10 bg-white'
                    }`}
                  >
                    <span>{isEn ? METHOD_LABELS[method].en : METHOD_LABELS[method].ar}</span>
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
                ? isEn
                  ? 'Preparing...'
                  : 'جارٍ التحضير...'
                : paymentMethod === 'card'
                  ? isEn
                    ? 'Pay securely with Thawani'
                    : 'ادفع الآن بأمان عبر Thawani'
                  : isEn
                    ? 'Place order'
                    : 'تأكيد الطلب'}
            </Button>
            <div className="text-kaffza-text/70 mt-2 text-xs">
              {paymentMethod === 'card'
                ? isEn
                  ? 'You will be redirected to Thawani to complete payment securely.'
                  : 'سيتم تحويلك إلى Thawani لإكمال الدفع بشكل آمن.'
                : isEn
                  ? 'Order will be created immediately after confirmation.'
                  : 'سيتم إنشاء الطلب مباشرة بعد التأكيد.'}
            </div>
            <div className="border-kaffza-primary/20 bg-kaffza-primary/5 text-kaffza-text/80 mt-3 rounded-xl border p-3 text-xs">
              {isEn
                ? 'Trust cues: encrypted payment handoff • order tracking in My Account'
                : 'مؤشرات الثقة: تحويل دفع مشفّر • متابعة الطلب من صفحة حسابي'}
            </div>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-1">
          <div className="text-kaffza-primary text-sm font-extrabold">
            {isEn ? 'Order summary' : 'ملخص الطلب'}
          </div>
          <div className="text-kaffza-text/70 mt-1 text-xs">
            {store
              ? isEn
                ? `Store: ${store.nameEn || store.nameAr || store.subdomain}`
                : `متجر: ${store.nameAr || store.nameEn || store.subdomain}`
              : ''}
            {retryOrderId ? (
              <span className={isEn ? 'ml-2' : 'mr-2'}>
                • {isEn ? 'Order ID' : 'رقم الطلب'}: {retryOrderId}
              </span>
            ) : null}
          </div>

          <div className="mt-4 space-y-2">
            {loading && items.length === 0 ? (
              <div className="text-kaffza-text/70 text-sm">
                {isEn ? 'Loading...' : 'جاري التحميل...'}
              </div>
            ) : items.length === 0 ? (
              <div className="text-kaffza-text/70 text-sm">
                {isEn ? 'No items.' : 'لا يوجد عناصر.'}
              </div>
            ) : (
              items.map((it) => (
                <div
                  key={it.key}
                  className="bg-kaffza-bg flex items-start justify-between gap-3 rounded-lg px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="text-kaffza-text truncate text-xs font-bold">{it.title}</div>
                    <div className="text-kaffza-text/70 mt-0.5 text-[11px]">
                      {it.qty} × {formatOMR(it.unitPrice, isEn)}
                    </div>
                  </div>
                  <div className="text-kaffza-primary shrink-0 text-xs font-extrabold">
                    {formatOMR(it.lineTotal, isEn)}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 space-y-2 text-sm">
            <Row
              label={isEn ? 'Subtotal' : 'المجموع الفرعي'}
              value={formatOMR(totals.subtotal, isEn)}
            />
            <Row label={isEn ? 'Shipping' : 'الشحن'} value={formatOMR(totals.shipping, isEn)} />
            <div className="border-t border-black/10 pt-3">
              <Row
                label={isEn ? 'Total' : 'الإجمالي'}
                value={formatOMR(totals.total, isEn)}
                strong
              />
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

function validateCheckoutInput(input: {
  fullName: string;
  phone: string;
  state: string;
  addressLine1: string;
  hasItems: boolean;
  isEn: boolean;
}) {
  const errors: string[] = [];
  if (input.fullName.trim().length < 2) {
    errors.push(
      input.isEn
        ? 'Recipient name is required (at least 2 characters).'
        : 'اسم المستلم مطلوب (حرفان على الأقل).'
    );
  }
  if (!/^\+?[0-9]{8,15}$/.test(input.phone.trim())) {
    errors.push(
      input.isEn
        ? 'Enter a valid phone in international format (8–15 digits).'
        : 'أدخل رقم هاتف صحيح بصيغة دولية (8 إلى 15 رقم).'
    );
  }
  if (input.state.trim().length < 2) {
    errors.push(input.isEn ? 'State/region is required.' : 'المحافظة / المنطقة مطلوبة.');
  }
  if (input.addressLine1.trim().length < 5) {
    errors.push(input.isEn ? 'Address should be more detailed.' : 'يرجى كتابة عنوان أكثر تفصيلاً.');
  }
  if (!input.hasItems) {
    errors.push(input.isEn ? 'Your cart is empty.' : 'السلة فارغة.');
  }
  return errors;
}

function readApiError(err: any, fallback: string, isEn: boolean) {
  const raw = err?.response?.data?.message;
  const text = Array.isArray(raw) ? raw.join(' ') : raw || err?.message || fallback;
  if (!isEn || typeof text !== 'string') return text;

  if (text.includes('السلة فارغة'))
    return 'Your cart is empty. Please return to cart and add items.';
  if (text.includes('طريقة الدفع غير متاحة'))
    return 'Selected payment method is not available for this store.';
  if (text.includes('إعدادات Thawani ناقصة'))
    return 'Payment gateway is temporarily unavailable. Please retry shortly or choose another method.';
  if (text.includes('غير متوفر بالكمية المطلوبة'))
    return 'Some items are no longer available in requested quantity. Update cart and try again.';
  if (text.includes('الحد الأدنى للطلب'))
    return 'Order amount is below the minimum allowed for this store.';
  if (text.includes('الحد الأعلى للطلب'))
    return 'Order amount exceeds the maximum allowed for this store.';
  if (text.includes('تم الدفع مسبقاً')) return 'This order has already been paid.';
  if (text.includes('رقم الهاتف')) return 'Please check the phone number format and try again.';
  if (text.includes('العنوان'))
    return 'Delivery address is incomplete. Add more details and retry.';
  return text;
}

function Field({ label, children }: { label: string; children: any }) {
  return (
    <label className="grid gap-1">
      <span className="text-kaffza-text text-sm font-bold">{label}</span>
      {children}
    </label>
  );
}

function Hint({ children }: { children: any }) {
  return <span className="text-kaffza-text/60 text-xs">{children}</span>;
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

function formatOMR(v: number, isEn = false) {
  const n = Number.isFinite(v) ? v : 0;
  return isEn ? `OMR ${n.toFixed(3)}` : `${n.toFixed(3)} ر.ع`;
}

export default function StoreCheckout({ params }: { params: { subdomain: string } }) {
  return (
    <Suspense>
      <StoreCheckoutInner params={params} />
    </Suspense>
  );
}
