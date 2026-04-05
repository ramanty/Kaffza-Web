'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { authHeader } from '../../../lib/auth';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { useStore } from '../store-context';

type Category = { id: string; nameAr?: string; nameEn?: string };

type Product = {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
  stock: number;
  isActive: boolean;
  category?: Category | null;
  images?: string[];
};

export default function ProductsPage() {
  const { storeId, loading: storesLoading } = useStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Product[]>([]);

  async function load() {
    if (!storeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(
        `/stores/${storeId}/products?includeInactive=true&limit=200&page=1`,
        {
          headers: { ...authHeader(), 'x-client': 'web' },
        }
      );
      const data: any[] = res?.data?.data || [];
      setItems(
        data.map((p) => ({
          id: String(p.id),
          nameAr: p.nameAr,
          nameEn: p.nameEn,
          price: Number(p.price),
          stock: Number(p.stock),
          isActive: Boolean(p.isActive),
          category: p.category ?? null,
          images: Array.isArray(p.images) ? p.images : [],
        }))
      );
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'حدث خطأ أثناء تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!storeId) {
      setLoading(false);
      return;
    }
    load();
  }, [storeId]);

  async function deleteProduct(productId: string) {
    if (!storeId) return;
    if (!confirm('هل أنت متأكد من حذف المنتج؟')) return;
    setError(null);
    try {
      await api.delete(`/stores/${storeId}/products/${productId}`, {
        headers: { ...authHeader(), 'x-client': 'web' },
      });
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'فشل حذف المنتج');
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-kaffza-primary text-2xl font-extrabold">المنتجات</h1>
          <p className="text-kaffza-text/80 mt-1 text-sm">
            إدارة منتجات المتجر – عرض، إضافة، تعديل وحذف.
          </p>
          {!storeId && !storesLoading ? (
            <p className="mt-1 text-xs text-red-700">
              لا يوجد متجر محدد. يرجى اختيار متجر من الأعلى.
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={load} disabled={loading}>
            تحديث
          </Button>
          <Link href="/dashboard/products/new">
            <Button disabled={!storeId}>+ إضافة منتج جديد</Button>
          </Link>
        </div>
      </header>

      {/* Error Banner */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Products Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-kaffza-bg">
              <tr className="text-right">
                <th className="text-kaffza-primary px-4 py-3 font-extrabold">الصورة</th>
                <th className="text-kaffza-primary px-4 py-3 font-extrabold">اسم المنتج</th>
                <th className="text-kaffza-primary px-4 py-3 font-extrabold">التصنيف</th>
                <th className="text-kaffza-primary px-4 py-3 font-extrabold">السعر</th>
                <th className="text-kaffza-primary px-4 py-3 font-extrabold">المخزون</th>
                <th className="text-kaffza-primary px-4 py-3 font-extrabold">الحالة</th>
                <th className="text-kaffza-primary px-4 py-3 font-extrabold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="text-kaffza-text/70 px-4 py-10 text-center" colSpan={7}>
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl">⏳</span>
                      <span>جاري التحميل...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-4 py-12" colSpan={7}>
                    <EmptyState storeId={storeId} />
                  </td>
                </tr>
              ) : (
                items.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-kaffza-bg/50 border-t border-black/5 transition-colors"
                  >
                    {/* Image */}
                    <td className="px-4 py-3">
                      {p.images && p.images.length > 0 ? (
                        <img
                          src={p.images[0]}
                          alt={p.nameAr}
                          className="h-12 w-12 rounded-lg border border-black/5 object-cover"
                        />
                      ) : (
                        <div className="bg-kaffza-bg flex h-12 w-12 items-center justify-center rounded-lg border border-black/5 text-2xl">
                          📦
                        </div>
                      )}
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="text-kaffza-text font-bold">{p.nameAr}</div>
                      <div className="text-kaffza-text/60 text-xs">{p.nameEn}</div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      {p.category ? (
                        <span className="bg-kaffza-bg text-kaffza-primary inline-flex rounded-lg px-2 py-1 text-xs font-semibold">
                          {p.category.nameAr || p.category.nameEn || '-'}
                        </span>
                      ) : (
                        <span className="text-kaffza-text/50 text-xs">—</span>
                      )}
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3">
                      <span className="text-kaffza-primary font-bold">
                        {Number(p.price).toFixed(3)} ر.ع
                      </span>
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold ${p.stock === 0 ? 'text-red-600' : 'text-kaffza-text'}`}
                      >
                        {p.stock}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3">
                      <span
                        className={
                          'inline-flex rounded-full px-3 py-1 text-xs font-bold ' +
                          (p.isActive
                            ? 'border border-green-200 bg-green-50 text-green-700'
                            : 'border border-red-200 bg-red-50 text-red-700')
                        }
                      >
                        {p.isActive ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => deleteProduct(p.id)}>
                          حذف
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function EmptyState({ storeId }: { storeId: string | null }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <div className="bg-kaffza-bg flex h-20 w-20 items-center justify-center rounded-2xl text-5xl">
        📦
      </div>
      <div>
        <h3 className="text-kaffza-text text-base font-extrabold">لا توجد منتجات بعد</h3>
        <p className="text-kaffza-text/60 mt-1 text-sm">ابدأ بإضافة أول منتج لمتجرك وسيظهر هنا.</p>
      </div>
      {storeId ? (
        <Link href="/dashboard/products/new">
          <Button>+ إضافة أول منتج</Button>
        </Link>
      ) : null}
    </div>
  );
}
