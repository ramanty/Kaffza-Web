'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../../lib/api';
import { authHeader } from '../../../lib/auth';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';

type Store = {
  id: string;
  nameAr?: string;
  nameEn?: string;
  subdomain: string;
  logoUrl?: string;
};

type Product = {
  id: string;
  nameAr?: string;
  nameEn?: string;
  price: number;
  stock: number;
  isActive: boolean;
  images: string[];
  categoryId?: string | null;
};

type Category = {
  id: string;
  nameAr?: string;
  nameEn?: string;
  children?: Category[];
};

function labelAr(obj: any) {
  return obj?.nameAr || obj?.nameEn || obj?.slug || obj?.id || '';
}

function flattenCategories(nodes: Category[]): Category[] {
  const out: Category[] = [];
  const walk = (arr: Category[]) => {
    for (const c of arr) {
      out.push(c);
      if (c.children?.length) walk(c.children);
    }
  };
  walk(nodes);
  return out;
}

async function tryGet<T = any>(url: string, config?: any): Promise<{ ok: true; data: T } | { ok: false; error: any }> {
  try {
    const res = await api.get(url, config);
    return { ok: true, data: res?.data };
  } catch (e: any) {
    return { ok: false, error: e };
  }
}

export default function StoreFront({ params }: { params: { subdomain: string } }) {
  const subdomain = params.subdomain;

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>('');

  const categoryOptions = useMemo(() => flattenCategories(categories), [categories]);

  const load = async () => {
    setLoading(true);
    setMsg('');

    try {
      // 1) Get store by subdomain (available in API)
      const s = await api.get(`/stores/subdomain/${subdomain}`);
      const st = s?.data?.data;
      const storeId = String(st?.id);
      const storeObj: Store = {
        id: storeId,
        nameAr: st?.nameAr,
        nameEn: st?.nameEn,
        subdomain,
        logoUrl: st?.logoUrl,
      };
      setStore(storeObj);

      // 2) Categories: requested endpoint is /stores/:subdomain/categories
      // Fallback to /stores/:storeId/categories/tree
      const cat1 = await tryGet(`/stores/${subdomain}/categories`);
      if (cat1.ok && cat1.data?.data) {
        setCategories(cat1.data.data);
      } else {
        const cat2 = await api.get(`/stores/${storeId}/categories/tree`);
        setCategories(cat2?.data?.data || []);
      }

      // 3) Products: requested endpoint is /stores/:subdomain/products
      // Fallback to /stores/:storeId/products
      const q = selectedCategory !== 'all' ? `?categoryId=${encodeURIComponent(selectedCategory)}&limit=200&page=1` : '?limit=200&page=1';
      const prod1 = await tryGet(`/stores/${subdomain}/products${q}`);
      if (prod1.ok) {
        const list = prod1.data?.data || [];
        setProducts(normalizeProducts(list));
      } else {
        const prod2 = await api.get(`/stores/${storeId}/products${q}`);
        const list = prod2?.data?.data || [];
        setProducts(normalizeProducts(list));
      }
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'فشل تحميل المتجر');
      setStore(null);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // reset filters when subdomain changes
    setSelectedCategory('all');
  }, [subdomain]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subdomain, selectedCategory]);

  const addToCart = async (productId: string) => {
    if (!store) return;
    setLoading(true);
    setMsg('');
    try {
      await api.post(
        `/stores/${store.id}/cart/items`,
        { productId, quantity: 1 },
        { headers: { ...authHeader(), 'x-client': 'web' } }
      );
      setMsg('تمت الإضافة للسلة ✅');
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) {
        setMsg('لازم تسجل دخول قبل إضافة للسلة.');
      } else {
        setMsg(e?.response?.data?.message || 'فشل الإضافة للسلة');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir="rtl" className="mx-auto max-w-6xl px-6 py-10">
      {/* Store header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-2xl border border-black/10 bg-white">
            {store?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.logoUrl} alt="logo" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-kaffza-text/60">
                LOGO
              </div>
            )}
          </div>

          <div>
            <div className="text-3xl font-extrabold text-kaffza-primary">
              {store ? (store.nameAr || store.nameEn || 'المتجر') : 'المتجر'}
            </div>
            <div className="mt-1 text-sm text-kaffza-text">
              <span className="text-kaffza-text/70">subdomain:</span>{' '}
              <span className="font-semibold text-kaffza-primary">{subdomain}</span>
            </div>
            {msg ? <div className="mt-2 text-sm text-kaffza-text">{msg}</div> : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={load} disabled={loading}>
            تحديث
          </Button>
          <Link href={`/store/${subdomain}/cart`}>
            <Button variant="premium">السلة</Button>
          </Link>
        </div>
      </div>

      {/* Links */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-kaffza-text">
        <Link className="underline" href="/legal/terms">الشروط</Link>
        <Link className="underline" href="/legal/privacy">الخصوصية</Link>
        <Link className="underline" href="/en/legal/terms">Terms</Link>
        <Link className="underline" href="/en/legal/privacy">Privacy</Link>
      </div>

      {/* Filters */}
      <Card className="mt-6 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-extrabold text-kaffza-primary">فلترة المنتجات</div>
            <div className="mt-1 text-xs text-kaffza-text/70">اختر تصنيف لعرض منتجاته.</div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-bold text-kaffza-text">التصنيف</label>
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-kaffza-primary"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={loading}
            >
              <option value="all">كل التصنيفات</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {labelAr(c)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Products grid */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading && products.length === 0 ? (
          <Card className="p-6 sm:col-span-2 lg:col-span-3">
            <div className="text-sm text-kaffza-text/70">جاري التحميل...</div>
          </Card>
        ) : products.length === 0 ? (
          <Card className="p-6 sm:col-span-2 lg:col-span-3">
            <div className="text-sm text-kaffza-text/70">لا يوجد منتجات حالياً.</div>
          </Card>
        ) : (
          products.map((p) => (
            <Card key={p.id} className="overflow-hidden p-0">
              <div className="relative h-44 w-full bg-kaffza-bg">
                {p.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt={p.nameAr || p.nameEn || 'product'} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-bold text-kaffza-text/60">
                    No Image
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="text-lg font-extrabold text-kaffza-info">{p.nameAr || p.nameEn}</div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm font-bold text-kaffza-primary">{Number(p.price).toFixed(3)} ر.ع</div>
                  <div className="text-xs text-kaffza-text/70">المخزون: {p.stock}</div>
                </div>

                <div className="mt-4">
                  <Button className="w-full" onClick={() => addToCart(p.id)} disabled={loading || !p.isActive || p.stock <= 0}>
                    {p.stock <= 0 ? 'غير متوفر' : p.isActive ? 'أضف للسلة' : 'غير متاح'}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </main>
  );
}

function normalizeProducts(list: any[]): Product[] {
  return (list || []).map((p) => ({
    id: String(p.id),
    nameAr: p.nameAr,
    nameEn: p.nameEn,
    price: Number(p.price),
    stock: Number(p.stock),
    isActive: Boolean(p.isActive),
    images: Array.isArray(p.images) ? p.images : [],
    categoryId: p.categoryId ? String(p.categoryId) : null,
  }));
}
