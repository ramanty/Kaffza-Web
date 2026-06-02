'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../../lib/api';
import { authHeader, getAccessTokenFromCookies } from '../../../../lib/auth';
import { Card } from '../../../../components/Card';
import { Button } from '../../../../components/Button';
import { formatCurrency } from '@/lib/utils';

type Store = { id: string; nameAr?: string; nameEn?: string; logoUrl?: string; subdomain: string };

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

function readCartError(err: any, fallback: string, isEn: boolean) {
  const raw = err?.response?.data?.message;
  const text = Array.isArray(raw) ? raw.join(' ') : raw || err?.message || fallback;
  if (!isEn || typeof text !== 'string') return text;
  if (text.includes('السلة فارغة'))
    return 'Your cart is empty. Add products, then continue to checkout.';
  if (text.includes('غير متوفر بالكمية المطلوبة'))
    return 'Some items are no longer available in requested quantity. Update quantities and retry.';
  if (text.includes('غير مصرح') || text.toLowerCase().includes('unauthorized'))
    return 'Your session ended. Please sign in again to continue checkout.';
  return text;
}

export default function StoreCart({ params }: { params: { subdomain: string } }) {
  const router = useRouter();
  const sp = useSearchParams();
  const subdomain = params.subdomain;
  const isEn = sp.get('lang') === 'en';
  const withLang = (path: string) =>
    isEn ? `${path}${path.includes('?') ? '&' : '?'}lang=en` : path;

  const [store, setStore] = useState<Store | null>(null);
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>('');

  const items = cart?.items || [];

  const load = async () => {
    setLoading(true);
    setMsg('');
    try {
      const s = await api.get(`/stores/subdomain/${subdomain}`);
      const st = s.data.data;
      const storeId = String(st.id);
      setStore({
        id: storeId,
        nameAr: st.nameAr,
        nameEn: st.nameEn,
        logoUrl: st.logoUrl,
        subdomain,
      });

      const c = await api.get(`/stores/${storeId}/cart`, {
        headers: { ...authHeader(), 'x-client': 'web' },
      });
      setCart(c.data.data);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) {
        const nextPath = withLang(`/store/${subdomain}/cart`);
        const loginPath = isEn ? '/en/login' : '/login';
        router.replace(`${loginPath}?next=${encodeURIComponent(nextPath)}`);
        return;
      }
      setMsg(
        readCartError(
          e,
          isEn
            ? 'Failed to load cart. Please refresh and try again.'
            : 'فشل تحميل السلة. حدّث الصفحة وحاول مجدداً.',
          isEn
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Require JWT (no guest cart)
    const token = getAccessTokenFromCookies();
    if (!token) {
      const nextPath = withLang(`/store/${subdomain}/cart`);
      const loginPath = isEn ? '/en/login' : '/login';
      router.replace(`${loginPath}?next=${encodeURIComponent(nextPath)}`);
      return;
    }
    load();
     
  }, [subdomain, isEn]);

  const updateQty = async (item: CartItem, nextQty: number) => {
    if (!store) return;
    if (nextQty < 1) return;

    setLoading(true);
    setMsg('');
    try {
      const res = await api.patch(
        `/stores/${store.id}/cart/items`,
        { productId: item.productId, variantId: item.variantId || undefined, quantity: nextQty },
        { headers: { ...authHeader(), 'x-client': 'web' } }
      );
      setCart(res.data.data);
    } catch (e: any) {
      setMsg(
        readCartError(
          e,
          isEn ? 'Failed to update quantity. Try again.' : 'فشل تحديث الكمية. حاول مرة أخرى.',
          isEn
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (item: CartItem) => {
    if (!store) return;
    setLoading(true);
    setMsg('');
    try {
      const qs = new URLSearchParams({ productId: item.productId });
      if (item.variantId) qs.set('variantId', item.variantId);
      const res = await api.delete(`/stores/${store.id}/cart/items?${qs.toString()}`, {
        headers: { ...authHeader(), 'x-client': 'web' },
      });
      setCart(res.data.data);
    } catch (e: any) {
      setMsg(
        readCartError(
          e,
          isEn ? 'Failed to remove item. Please retry.' : 'فشل حذف العنصر. حاول مجدداً.',
          isEn
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const title = store
    ? isEn
      ? store.nameEn || store.nameAr || 'Store'
      : store.nameAr || store.nameEn || 'المتجر'
    : isEn
      ? 'Cart'
      : 'السلة';

  const totals = useMemo(() => {
    const subtotal = Number(cart?.subtotal ?? 0);
    const shipping = Number(cart?.shippingCost ?? 0);
    const total = Number(cart?.total ?? 0);
    return { subtotal, shipping, total };
  }, [cart]);

  return (
    <main dir={isEn ? 'ltr' : 'rtl'} className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-primary text-2xl font-extrabold">
            {isEn ? (store ? `${title} Cart` : 'Cart') : `سلة ${title}`}
          </div>
          <div className="text-foreground/80 mt-1 text-sm">
            {isEn
              ? 'Review your cart items before checkout.'
              : 'راجع عناصر السلة وعدّل الكميات قبل الدفع.'}
          </div>
          <div className="text-muted-foreground mt-2 text-xs">
            {isEn
              ? 'Step 1 of 2: confirm items now, then finish shipping and payment in checkout.'
              : 'الخطوة 1 من 2: أكد العناصر الآن، ثم أكمل العنوان والدفع في صفحة إتمام الشراء.'}
          </div>
          {msg ? (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {msg}
            </div>
          ) : null}
        </div>

        <div className="flex gap-2">
          <Link href={withLang(`/store/${subdomain}`)}>
            <Button variant="secondary">{isEn ? 'Continue shopping' : 'متابعة التسوق'}</Button>
          </Link>
          <Button variant="secondary" onClick={load} disabled={loading}>
            {isEn ? 'Refresh' : 'تحديث'}
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {/* Items */}
        <div className="space-y-4 lg:col-span-2">
          {loading && !cart ? (
            <Card className="p-6">
              <div className="text-primary text-sm font-bold">
                {isEn ? 'Loading your cart...' : 'جارٍ تحميل السلة...'}
              </div>
              <div className="mt-2 h-3 w-48 animate-pulse rounded bg-black/10" />
            </Card>
          ) : items.length === 0 ? (
            <Card className="p-6">
              <div className="text-primary text-sm font-bold">
                {isEn ? 'Your cart is empty' : 'السلة فارغة حالياً'}
              </div>
              <div className="text-muted-foreground mt-1 text-sm">
                {isEn
                  ? 'Add products to continue to checkout in just a few steps.'
                  : 'أضف منتجات الآن لإكمال الطلب بخطوات بسيطة.'}
              </div>
              <div className="mt-4">
                <Link href={withLang(`/store/${subdomain}`)}>
                  <Button>{isEn ? 'Browse products' : 'تصفح المنتجات'}</Button>
                </Link>
              </div>
            </Card>
          ) : (
            items.map((it) => (
              <Card key={`${it.productId}:${it.variantId || 'no'}`} className="p-4">
                <div className="flex gap-4">
                  <div className="bg-background h-20 w-20 overflow-hidden rounded-xl border border-border">
                    {it.product?.images?.[0] ? (
                       
                      <img
                        src={it.product.images[0]}
                        alt="item"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs font-bold">
                        {isEn ? 'No image' : 'بدون صورة'}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-kaffza-info truncate text-sm font-extrabold">
                          {isEn
                            ? it.product?.nameEn || it.product?.nameAr
                            : it.product?.nameAr || it.product?.nameEn}
                        </div>
                        {it.variant ? (
                          <div className="text-muted-foreground mt-0.5 text-xs">
                            {isEn
                              ? it.variant.nameEn || it.variant.nameAr
                              : it.variant.nameAr || it.variant.nameEn}
                          </div>
                        ) : null}
                        <div className="text-muted-foreground mt-2 text-xs">
                          {isEn ? 'Unit price: ' : 'سعر الوحدة: '}
                          <span className="text-primary font-bold">
                            {formatOMR(it.unitPrice, isEn)}
                          </span>
                        </div>
                      </div>

                      <button
                        className="shrink-0 rounded-lg border border-border bg-card text-card-foreground px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                        onClick={() => removeItem(it)}
                        disabled={loading}
                      >
                        {isEn ? 'Remove' : 'حذف'}
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          className="text-primary h-9 w-9 rounded-xl border border-border bg-card text-card-foreground text-lg font-extrabold disabled:opacity-50"
                          onClick={() => updateQty(it, it.quantity - 1)}
                          disabled={loading || it.quantity <= 1}
                          aria-label={isEn ? 'decrease' : 'نقص'}
                        >
                          −
                        </button>
                        <div className="bg-background text-foreground min-w-[44px] rounded-xl px-3 py-2 text-center text-sm font-extrabold">
                          {it.quantity}
                        </div>
                        <button
                          className="text-primary h-9 w-9 rounded-xl border border-border bg-card text-card-foreground text-lg font-extrabold disabled:opacity-50"
                          onClick={() => updateQty(it, it.quantity + 1)}
                          disabled={loading}
                          aria-label={isEn ? 'increase' : 'زيد'}
                        >
                          +
                        </button>
                      </div>

                      <div className="text-primary text-sm font-extrabold">
                        {formatOMR(it.lineTotal, isEn)}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4 p-6">
            <div className="text-primary text-sm font-extrabold">
              {isEn ? 'Cart summary' : 'ملخص السلة'}
            </div>
            <div className="border-kaffza-primary/20 bg-primary/5 text-foreground/80 mt-2 rounded-xl border p-3 text-xs">
              {isEn
                ? 'Secure checkout • Final shipping cost shown before payment'
                : 'دفع آمن • التكلفة النهائية للشحن تظهر قبل الدفع'}
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <Row
                label={isEn ? 'Subtotal' : 'المجموع الفرعي'}
                value={formatOMR(totals.subtotal, isEn)}
              />
              <Row label={isEn ? 'Shipping' : 'الشحن'} value={formatOMR(totals.shipping, isEn)} />
              <div className="border-t border-border pt-3">
                <Row
                  label={isEn ? 'Total' : 'الإجمالي'}
                  value={formatOMR(totals.total, isEn)}
                  strong
                />
              </div>
            </div>

            <div className="mt-5">
              <Link href={withLang(`/store/${subdomain}/checkout`)}>
                <Button className="w-full" disabled={loading || items.length === 0}>
                  {isEn ? 'Continue to checkout' : 'متابعة إلى إتمام الشراء'}
                </Button>
              </Link>
              <div className="text-muted-foreground mt-2 text-xs">
                {isEn
                  ? 'You can still edit quantities on checkout before placing order.'
                  : 'يمكنك تعديل الكميات أيضاً في صفحة الدفع قبل تأكيد الطلب.'}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-foreground/80">{label}</span>
      <span
        className={strong ? 'text-primary font-extrabold' : 'text-foreground font-bold'}
      >
        {value}
      </span>
    </div>
  );
}

function formatOMR(v: number, isEn = false) {
  const n = Number.isFinite(v) ? v : 0;
  return isEn ? `OMR ${n.toFixed(3)}` : `${formatCurrency(n)}`;
}
