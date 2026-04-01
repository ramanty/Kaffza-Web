'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { authHeader, getAccessTokenFromCookies } from '../../../../lib/auth';
import { Card } from '../../../../components/Card';
import { Button } from '../../../../components/Button';

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

export default function StoreCart({ params }: { params: { subdomain: string } }) {
  const router = useRouter();
  const subdomain = params.subdomain;

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
      setStore({ id: storeId, nameAr: st.nameAr, nameEn: st.nameEn, logoUrl: st.logoUrl, subdomain });

      const c = await api.get(`/stores/${storeId}/cart`, { headers: { ...authHeader(), 'x-client': 'web' } });
      setCart(c.data.data);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) {
        router.replace(`/login?next=${encodeURIComponent(`/store/${subdomain}/cart`)}`);
        return;
      }
      setMsg(e?.response?.data?.message || 'فشل تحميل السلة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Require JWT (no guest cart)
    const token = getAccessTokenFromCookies();
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(`/store/${subdomain}/cart`)}`);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subdomain]);

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
      setMsg(e?.response?.data?.message || 'فشل تحديث الكمية');
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
      const res = await api.delete(`/stores/${store.id}/cart/items?${qs.toString()}`, { headers: { ...authHeader(), 'x-client': 'web' } });
      setCart(res.data.data);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'فشل حذف العنصر');
    } finally {
      setLoading(false);
    }
  };

  const title = store ? (store.nameAr || store.nameEn || 'المتجر') : 'السلة';

  const totals = useMemo(() => {
    const subtotal = Number(cart?.subtotal ?? 0);
    const shipping = Number(cart?.shippingCost ?? 0);
    const total = Number(cart?.total ?? 0);
    return { subtotal, shipping, total };
  }, [cart]);

  return (
    <main dir="rtl" className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-2xl font-extrabold text-kaffza-primary">سلة {title}</div>
          <div className="mt-1 text-sm text-kaffza-text/80">راجع عناصر السلة وعدّل الكميات قبل الدفع.</div>
          {msg ? <div className="mt-3 text-sm text-red-700">{msg}</div> : null}
        </div>

        <div className="flex gap-2">
          <Link href={`/store/${subdomain}`}>
            <Button variant="secondary">متابعة التسوق</Button>
          </Link>
          <Button variant="secondary" onClick={load} disabled={loading}>
            تحديث
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {loading && !cart ? (
            <Card className="p-6">
              <div className="text-sm text-kaffza-text/70">جاري التحميل...</div>
            </Card>
          ) : items.length === 0 ? (
            <Card className="p-6">
              <div className="text-sm text-kaffza-text/70">السلة فارغة.</div>
              <div className="mt-4">
                <Link href={`/store/${subdomain}`}>
                  <Button>تصفح المنتجات</Button>
                </Link>
              </div>
            </Card>
          ) : (
            items.map((it) => (
              <Card key={`${it.productId}:${it.variantId || 'no'}`} className="p-4">
                <div className="flex gap-4">
                  <div className="h-20 w-20 overflow-hidden rounded-xl border border-black/10 bg-kaffza-bg">
                    {it.product?.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.product.images[0]} alt="item" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-kaffza-text/60">No Image</div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-extrabold text-kaffza-info">
                          {it.product?.nameAr || it.product?.nameEn}
                        </div>
                        {it.variant ? (
                          <div className="mt-0.5 text-xs text-kaffza-text/70">
                            {it.variant.nameAr || it.variant.nameEn}
                          </div>
                        ) : null}
                        <div className="mt-2 text-xs text-kaffza-text/70">
                          سعر الوحدة: <span className="font-bold text-kaffza-primary">{formatOMR(it.unitPrice)}</span>
                        </div>
                      </div>

                      <button
                        className="shrink-0 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                        onClick={() => removeItem(it)}
                        disabled={loading}
                      >
                        حذف
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          className="h-9 w-9 rounded-xl border border-black/10 bg-white text-lg font-extrabold text-kaffza-primary disabled:opacity-50"
                          onClick={() => updateQty(it, it.quantity - 1)}
                          disabled={loading || it.quantity <= 1}
                          aria-label="نقص"
                        >
                          −
                        </button>
                        <div className="min-w-[44px] rounded-xl bg-kaffza-bg px-3 py-2 text-center text-sm font-extrabold text-kaffza-text">
                          {it.quantity}
                        </div>
                        <button
                          className="h-9 w-9 rounded-xl border border-black/10 bg-white text-lg font-extrabold text-kaffza-primary disabled:opacity-50"
                          onClick={() => updateQty(it, it.quantity + 1)}
                          disabled={loading}
                          aria-label="زيد"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-sm font-extrabold text-kaffza-primary">{formatOMR(it.lineTotal)}</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-4">
            <div className="text-sm font-extrabold text-kaffza-primary">ملخص السلة</div>

            <div className="mt-4 space-y-2 text-sm">
              <Row label="المجموع الفرعي" value={formatOMR(totals.subtotal)} />
              <Row label="الشحن" value={formatOMR(totals.shipping)} />
              <div className="border-t border-black/10 pt-3">
                <Row label="الإجمالي" value={formatOMR(totals.total)} strong />
              </div>
            </div>

            <div className="mt-5">
              <Link href={`/store/${subdomain}/checkout`}>
                <Button className="w-full" disabled={loading || items.length === 0}>
                  إتمام الشراء
                </Button>
              </Link>
              <div className="mt-2 text-xs text-kaffza-text/70">السلة للمستخدم المسجّل فقط (JWT).</div>
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
      <span className="text-kaffza-text/80">{label}</span>
      <span className={strong ? 'font-extrabold text-kaffza-primary' : 'font-bold text-kaffza-text'}>{value}</span>
    </div>
  );
}

function formatOMR(v: number) {
  const n = Number.isFinite(v) ? v : 0;
  return `${n.toFixed(3)} ر.ع`;
}
