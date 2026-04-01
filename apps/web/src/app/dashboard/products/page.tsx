'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '../../../lib/api';
import { authHeader } from '../../../lib/auth';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { useStore } from '../store-context';

type Product = {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
  stock: number;
  isActive: boolean;
};

export default function ProductsPage() {
  const { storeId, loading: storesLoading } = useStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Product[]>([]);

  const [showCreate, setShowCreate] = useState(false);
  const [create, setCreate] = useState({ nameAr: '', nameEn: '', price: '', stock: '', isActive: true });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState({ nameAr: '', nameEn: '', price: '', stock: '', isActive: true });

  async function load() {
    if (!storeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/stores/${storeId}/products?includeInactive=true&limit=200&page=1`, {
        headers: { ...authHeader(), 'x-client': 'web' },
      });
      const data: any[] = res?.data?.data || [];
      setItems(
        data.map((p) => ({
          id: String(p.id),
          nameAr: p.nameAr,
          nameEn: p.nameEn,
          price: Number(p.price),
          stock: Number(p.stock),
          isActive: Boolean(p.isActive),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const hasItems = useMemo(() => items.length > 0, [items]);

  async function createProduct() {
    if (!storeId) return;
    setError(null);
    try {
      const payload: any = {
        nameAr: create.nameAr.trim(),
        nameEn: create.nameEn.trim(),
        price: Number(create.price),
        stock: Number(create.stock),
        isActive: create.isActive,
      };
      if (!payload.nameAr || !payload.nameEn) throw new Error('اسم المنتج بالعربية والإنجليزية مطلوب');
      if (!Number.isFinite(payload.price) || payload.price <= 0) throw new Error('السعر غير صحيح');
      if (!Number.isFinite(payload.stock) || payload.stock < 0) throw new Error('المخزون غير صحيح');

      await api.post(`/stores/${storeId}/products`, payload, { headers: { ...authHeader(), 'x-client': 'web' } });
      setShowCreate(false);
      setCreate({ nameAr: '', nameEn: '', price: '', stock: '', isActive: true });
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'فشل إنشاء المنتج');
    }
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setEdit({ nameAr: p.nameAr, nameEn: p.nameEn, price: String(p.price), stock: String(p.stock), isActive: p.isActive });
  }

  async function saveEdit(productId: string) {
    if (!storeId) return;
    setError(null);
    try {
      const payload: any = {
        nameAr: edit.nameAr.trim(),
        nameEn: edit.nameEn.trim(),
        price: Number(edit.price),
        stock: Number(edit.stock),
        isActive: edit.isActive,
      };
      if (!payload.nameAr || !payload.nameEn) throw new Error('الاسم مطلوب');
      await api.patch(`/stores/${storeId}/products/${productId}`, payload, { headers: { ...authHeader(), 'x-client': 'web' } });
      setEditingId(null);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'فشل تعديل المنتج');
    }
  }

  async function deleteProduct(productId: string) {
    if (!storeId) return;
    if (!confirm('هل أنت متأكد من حذف/تعطيل المنتج؟')) return;
    setError(null);
    try {
      await api.delete(`/stores/${storeId}/products/${productId}`, { headers: { ...authHeader(), 'x-client': 'web' } });
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'فشل حذف المنتج');
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-kaffza-primary">المنتجات</h1>
          <p className="mt-1 text-sm text-kaffza-text/80">إدارة منتجات المتجر (عرض، إضافة، تعديل، حذف).</p>
          {!storeId && !storesLoading ? <p className="mt-1 text-xs text-red-700">لا يوجد متجر محدد.</p> : null}
        </div>
        <Button variant="premium" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? 'إغلاق' : 'إضافة منتج جديد'}
        </Button>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      {showCreate ? (
        <section className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="اسم المنتج (عربي)">
              <Input value={create.nameAr} onChange={(e: any) => setCreate((s) => ({ ...s, nameAr: e.target.value }))} placeholder="مثال: حذاء" />
            </Field>
            <Field label="اسم المنتج (English)">
              <Input value={create.nameEn} onChange={(e: any) => setCreate((s) => ({ ...s, nameEn: e.target.value }))} placeholder="Example: Shoes" />
            </Field>
            <Field label="السعر (OMR)">
              <Input value={create.price} onChange={(e: any) => setCreate((s) => ({ ...s, price: e.target.value }))} placeholder="10.000" />
            </Field>
            <Field label="المخزون">
              <Input value={create.stock} onChange={(e: any) => setCreate((s) => ({ ...s, stock: e.target.value }))} placeholder="20" />
            </Field>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-kaffza-text">
              <input type="checkbox" checked={create.isActive} onChange={(e) => setCreate((s) => ({ ...s, isActive: e.target.checked }))} />
              المنتج متاح
            </label>

            <Button onClick={createProduct}>حفظ المنتج</Button>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-kaffza-bg">
              <tr className="text-right">
                <th className="px-4 py-3 font-bold text-kaffza-text">الاسم</th>
                <th className="px-4 py-3 font-bold text-kaffza-text">السعر</th>
                <th className="px-4 py-3 font-bold text-kaffza-text">المخزون</th>
                <th className="px-4 py-3 font-bold text-kaffza-text">الحالة</th>
                <th className="px-4 py-3 font-bold text-kaffza-text">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-center text-kaffza-text/70" colSpan={5}>
                    جاري التحميل...
                  </td>
                </tr>
              ) : !hasItems ? (
                <tr>
                  <td className="px-4 py-6 text-center text-kaffza-text/70" colSpan={5}>
                    لا يوجد منتجات بعد.
                  </td>
                </tr>
              ) : (
                items.map((p) => {
                  const editing = editingId === p.id;
                  return (
                    <tr key={p.id} className="border-t border-black/5">
                      <td className="px-4 py-3">
                        {editing ? (
                          <div className="grid gap-2">
                            <Input value={edit.nameAr} onChange={(e: any) => setEdit((s) => ({ ...s, nameAr: e.target.value }))} />
                            <Input value={edit.nameEn} onChange={(e: any) => setEdit((s) => ({ ...s, nameEn: e.target.value }))} />
                          </div>
                        ) : (
                          <div className="font-semibold text-kaffza-text">
                            {p.nameAr}
                            <div className="text-xs text-kaffza-text/60">{p.nameEn}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editing ? (
                          <Input value={edit.price} onChange={(e: any) => setEdit((s) => ({ ...s, price: e.target.value }))} />
                        ) : (
                          <span className="font-bold text-kaffza-primary">{Number(p.price).toFixed(3)} ر.ع</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editing ? (
                          <Input value={edit.stock} onChange={(e: any) => setEdit((s) => ({ ...s, stock: e.target.value }))} />
                        ) : (
                          <span className="font-semibold text-kaffza-text">{p.stock}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editing ? (
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={edit.isActive} onChange={(e) => setEdit((s) => ({ ...s, isActive: e.target.checked }))} />
                            {edit.isActive ? 'متاح' : 'غير متاح'}
                          </label>
                        ) : (
                          <span className={'inline-flex rounded-full px-3 py-1 text-xs font-bold ' + (p.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700')}>
                            {p.isActive ? 'متاح' : 'غير متاح'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editing ? (
                          <div className="flex flex-wrap gap-2">
                            <Button onClick={() => saveEdit(p.id)}>حفظ</Button>
                            <Button variant="secondary" onClick={() => setEditingId(null)}>
                              إلغاء
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <Button onClick={() => startEdit(p)}>تعديل</Button>
                            <Button variant="secondary" onClick={() => deleteProduct(p.id)}>
                              حذف
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
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
