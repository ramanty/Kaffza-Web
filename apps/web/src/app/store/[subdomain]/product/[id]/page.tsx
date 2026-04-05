'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '../../../../../lib/api';
import { authHeader } from '../../../../../lib/auth';
import { Card } from '../../../../../components/Card';
import { Button } from '../../../../../components/Button';

type Variant = {
  id: string;
  nameAr?: string;
  nameEn?: string;
  price: number;
  stock: number;
  sku?: string;
};

type Product = {
  id: string;
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  images: string[];
  isActive: boolean;
  sku?: string;
  variants?: Variant[];
  categoryId?: string | null;
};

type Store = {
  id: string;
  nameAr?: string;
  nameEn?: string;
  subdomain: string;
  logoUrl?: string;
};

// Typed mock product for graceful fallback
const MOCK_PRODUCT: Product = {
  id: 'mock',
  nameAr: 'منتج تجريبي',
  nameEn: 'Sample Product',
  descriptionAr: 'هذا منتج تجريبي يعرض كيف تبدو صفحة تفاصيل المنتج.',
  descriptionEn: 'This is a sample product showing how the product detail page looks.',
  price: 9.9,
  compareAtPrice: 14.9,
  stock: 25,
  images: [],
  isActive: true,
  variants: [],
};

export default function ProductDetailPage({
  params,
}: {
  params: { subdomain: string; id: string };
}) {
  const { subdomain, id } = params;

  const [store, setStore] = useState<Store | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);
  const [msg, setMsg] = useState<string>('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('error');
  const [isMock, setIsMock] = useState(false);

  const load = async () => {
    setLoading(true);
    setMsg('');
    try {
      // 1) Resolve store by subdomain
      const s = await api.get(`/stores/subdomain/${subdomain}`);
      const st = s?.data?.data;
      const storeId = String(st?.id);
      setStore({
        id: storeId,
        nameAr: st?.nameAr,
        nameEn: st?.nameEn,
        subdomain,
        logoUrl: st?.logoUrl,
      });

      // 2) Fetch product details
      const p = await api.get(`/stores/${storeId}/products/${id}`);
      const raw = p?.data?.data;
      const mapped: Product = {
        id: String(raw.id),
        nameAr: raw.nameAr,
        nameEn: raw.nameEn,
        descriptionAr: raw.descriptionAr,
        descriptionEn: raw.descriptionEn,
        price: Number(raw.price),
        compareAtPrice: raw.compareAtPrice ? Number(raw.compareAtPrice) : null,
        stock: Number(raw.stock),
        images: Array.isArray(raw.images) ? raw.images : [],
        isActive: Boolean(raw.isActive),
        sku: raw.sku,
        variants: Array.isArray(raw.variants)
          ? raw.variants.map((v: any) => ({
              id: String(v.id),
              nameAr: v.nameAr,
              nameEn: v.nameEn,
              price: Number(v.price),
              stock: Number(v.stock),
              sku: v.sku,
            }))
          : [],
      };
      setProduct(mapped);
      setSelectedImage(0);
      setSelectedVariant(null);
      setIsMock(false);
    } catch {
      // Graceful fallback to mock data when API is unreachable
      setProduct(MOCK_PRODUCT);
      setIsMock(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [subdomain, id]);

  const displayPrice = selectedVariant ? selectedVariant.price : (product?.price ?? 0);
  const displayStock = selectedVariant ? selectedVariant.stock : (product?.stock ?? 0);
  const inStock = displayStock > 0 && (product?.isActive ?? false);

  const addToCart = async () => {
    if (!store || !product || isMock) return;
    setCartLoading(true);
    setMsg('');
    try {
      await api.post(
        `/stores/${store.id}/cart/items`,
        {
          productId: product.id,
          variantId: selectedVariant?.id ?? undefined,
          quantity: 1,
        },
        { headers: { ...authHeader(), 'x-client': 'web' } }
      );
      setMsg('تمت الإضافة للسلة ✅');
      setMsgType('success');
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) {
        setMsg('يجب تسجيل الدخول لإضافة المنتج للسلة.');
      } else {
        setMsg(e?.response?.data?.message || 'فشل الإضافة للسلة');
      }
      setMsgType('error');
    } finally {
      setCartLoading(false);
    }
  };

  if (loading) {
    return (
      <main dir="rtl" className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex justify-center">
          <div className="text-kaffza-text/70 text-sm">جاري التحميل...</div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main dir="rtl" className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-center">
          <div className="text-4xl">🔍</div>
          <div className="text-kaffza-text mt-3 text-lg font-bold">المنتج غير موجود</div>
          <div className="mt-4">
            <Link href={`/store/${subdomain}`}>
              <Button variant="secondary">العودة للمتجر</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const hasImages = product.images.length > 0;
  const hasVariants = (product.variants?.length ?? 0) > 0;

  return (
    <main dir="rtl" className="mx-auto max-w-5xl px-6 py-10">
      {/* Breadcrumb */}
      <nav className="text-kaffza-text/70 mb-6 flex items-center gap-2 text-sm">
        <Link href={`/store/${subdomain}`} className="hover:text-kaffza-primary underline">
          {store?.nameAr || store?.nameEn || 'المتجر'}
        </Link>
        <span>›</span>
        <span className="text-kaffza-text">{product.nameAr || product.nameEn}</span>
      </nav>

      {isMock && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚠️ تعذر الاتصال بالخادم – يتم عرض بيانات تجريبية.
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* ── Images Column ── */}
        <div className="flex flex-col gap-4">
          {/* Main image */}
          <div
            className="bg-kaffza-bg overflow-hidden rounded-2xl border border-black/10"
            style={{ aspectRatio: '1/1' }}
          >
            {hasImages ? (
              <img
                src={product.images[selectedImage]}
                alt={product.nameAr || product.nameEn || 'product'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-kaffza-text/30 flex h-full w-full items-center justify-center text-6xl">
                📦
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                    idx === selectedImage
                      ? 'border-kaffza-primary'
                      : 'hover:border-kaffza-primary/40 border-transparent'
                  }`}
                >
                  <img src={img} alt={`صورة ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Details Column ── */}
        <div className="flex flex-col gap-5">
          {/* Product title */}
          <div>
            <h1 className="text-kaffza-primary text-2xl font-extrabold">
              {product.nameAr || product.nameEn}
            </h1>
            {product.nameEn && product.nameAr && (
              <div className="text-kaffza-text/60 mt-1 text-sm">{product.nameEn}</div>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="text-kaffza-primary text-3xl font-extrabold">
              {Number(displayPrice).toFixed(3)} ر.ع
            </span>
            {product.compareAtPrice && product.compareAtPrice > displayPrice && (
              <span className="text-kaffza-text/50 text-base line-through">
                {Number(product.compareAtPrice).toFixed(3)} ر.ع
              </span>
            )}
            {product.compareAtPrice && product.compareAtPrice > displayPrice && (
              <span className="bg-kaffza-premium rounded-full px-2 py-0.5 text-xs font-bold text-white">
                خصم{' '}
                {Math.round(
                  ((product.compareAtPrice - displayPrice) / product.compareAtPrice) * 100
                )}
                ٪
              </span>
            )}
          </div>

          {/* Stock status */}
          <div>
            {inStock ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                متوفر في المخزون ({displayStock} قطعة)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                غير متوفر حالياً
              </span>
            )}
          </div>

          {/* Variants */}
          {hasVariants && (
            <Card className="p-4">
              <div className="text-kaffza-text mb-3 text-sm font-bold">اختر الخيار</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedVariant(null)}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                    selectedVariant === null
                      ? 'border-kaffza-primary bg-kaffza-primary text-white'
                      : 'text-kaffza-text hover:border-kaffza-primary border-slate-200 bg-white'
                  }`}
                >
                  الأساسي
                </button>
                {product.variants?.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    disabled={v.stock <= 0}
                    className={`rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:opacity-40 ${
                      selectedVariant?.id === v.id
                        ? 'border-kaffza-primary bg-kaffza-primary text-white'
                        : 'text-kaffza-text hover:border-kaffza-primary border-slate-200 bg-white'
                    }`}
                  >
                    {v.nameAr || v.nameEn}
                    {v.stock <= 0 ? ' (نفد)' : ''}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="flex-1"
              onClick={addToCart}
              disabled={!inStock || cartLoading || isMock}
            >
              {cartLoading ? 'جارٍ الإضافة...' : 'أضف إلى السلة'}
            </Button>

            {store && !isMock && (
              <Link href={`/store/${subdomain}/cart`} className="flex-1">
                <Button
                  variant="premium"
                  className="text-kaffza-dark-blue w-full"
                  disabled={!inStock}
                >
                  اشتر الآن
                </Button>
              </Link>
            )}
          </div>

          {/* Feedback message */}
          {msg && (
            <div
              className={`rounded-xl px-4 py-3 text-sm font-medium ${
                msgType === 'success'
                  ? 'border border-green-200 bg-green-50 text-green-700'
                  : 'border border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {msg}
            </div>
          )}

          {/* SKU */}
          {product.sku && <div className="text-kaffza-text/50 text-xs">رمز SKU: {product.sku}</div>}
        </div>
      </div>

      {/* Description */}
      {(product.descriptionAr || product.descriptionEn) && (
        <Card className="mt-8 p-6">
          <h2 className="text-kaffza-primary mb-3 text-base font-extrabold">وصف المنتج</h2>
          {product.descriptionAr && (
            <p className="text-kaffza-text whitespace-pre-wrap text-sm leading-relaxed">
              {product.descriptionAr}
            </p>
          )}
          {product.descriptionEn && product.descriptionAr && (
            <hr className="my-4 border-black/10" />
          )}
          {product.descriptionEn && (
            <p
              dir="ltr"
              className="text-kaffza-text/80 whitespace-pre-wrap text-sm leading-relaxed"
            >
              {product.descriptionEn}
            </p>
          )}
        </Card>
      )}

      {/* Back to store */}
      <div className="mt-8">
        <Link href={`/store/${subdomain}`}>
          <Button variant="secondary">← العودة للمتجر</Button>
        </Link>
      </div>
    </main>
  );
}
