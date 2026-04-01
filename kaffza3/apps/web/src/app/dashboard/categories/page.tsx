'use client';

import { useEffect, useMemo, useState } from 'react';

import { api } from '../../../lib/api';
import { authHeader } from '../../../lib/auth';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { useStore } from '../store-context';

type Category = {
  id: string;
  nameAr?: string;
  nameEn?: string;
  parentId?: string | null;
  children?: Category[];
};

type FlatRow = { cat: Category; depth: number; parent?: Category | null };

export default function DashboardCategoriesPage() {
  const { storeId } = useStore();

  const [tree, setTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // modal state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [parentId, setParentId] = useState<string>('');

  const flat = useMemo(() => flatten(tree), [tree]);
  const parentOptions = useMemo(() => {
    const all = flatten(tree).map((r) => r.cat);
    const excludeId = editing?.id;
    return all.filter((c) => c.id !== excludeId);
  }, [tree, editing]);

  const valid = useMemo(() => nameAr.trim().length >= 2 && nameEn.trim().length >= 2, [nameAr, nameEn]);

  const load = async () => {
    if (!storeId) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.get(`/stores/${storeId}/categories/tree`, { headers: { ...authHeader(), 'x-client': 'web' } });
      setTree(res?.data?.data || []);
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'فشل تحميل التصنيفات' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const openCreate = () => {
    setEditing(null);
    setNameAr('');
    setNameEn('');
    setParentId('');
    setOpen(true);
    setMsg(null);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setNameAr(c.nameAr || '');
    setNameEn(c.nameEn || '');
    setParentId(c.parentId ? String(c.parentId) : '');
    setOpen(true);
    setMsg(null);
  };

  const save = async () => {
    if (!storeId) return;
    if (!valid) {
      setMsg({ type: 'error', text: 'اسم عربي وإنجليزي مطلوبين (حرفين على الأقل)' });
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      if (editing) {
        await api.patch(
          `/stores/${storeId}/categories/${editing.id}`,
          { nameAr: nameAr.trim(), nameEn: nameEn.trim(), parentId: parentId ? parentId : null },
          { headers: { ...authHeader(), 'x-client': 'web' } }
        );
        setMsg({ type: 'success', text: 'تم تحديث التصنيف' });
      } else {
        await api.post(
          `/stores/${storeId}/categories`,
          { nameAr: nameAr.trim(), nameEn: nameEn.trim(), parentId: parentId || undefined },
          { headers: { ...authHeader(), 'x-client': 'web' } }
        );
        setMsg({ type: 'success', text: 'تم إضافة التصنيف' });
      }

      setOpen(false);
      await load();
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'فشل حفظ التصنيف' });
    } finally {
      setLoading(false);
    }
  };

  const remove = async (c: Category) => {
    if (!storeId) return;
    const ok = window.confirm('تأكيد حذف التصنيف؟');
    if (!ok) return;

    setLoading(true);
    setMsg(null);

    try {
      await api.delete(`/stores/${storeId}/categories/${c.id}`, { headers: { ...authHeader(), 'x-client': 'web' } });
      setMsg({ type: 'success', text: 'تم حذف التصنيف' });
      await load();
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'فشل حذف التصنيف' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-kaffza-primary">التصنيفات</h1>
          <p className="mt-1 text-sm text-kaffza-text/80">إدارة التصنيفات كهيكل شجرة (Parent → Children).</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={load} disabled={loading}>
            تحديث
          </Button>
          <Button onClick={openCreate} disabled={!storeId}>
            + إضافة تصنيف
          </Button>
        </div>
      </div>

      {msg ? <Alert kind={msg.type} text={msg.text} /> : null}

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-kaffza-bg">
              <tr className="text-right">
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">الاسم (AR)</th>
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">الاسم (EN)</th>
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">الأب</th>
                <th className="px-4 py-3 font-extrabold text-kaffza-primary">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-kaffza-text/70" colSpan={4}>
                    جاري التحميل...
                  </td>
                </tr>
              ) : flat.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-kaffza-text/70" colSpan={4}>
                    لا يوجد تصنيفات بعد.
                  </td>
                </tr>
              ) : (
                flat.map((r) => (
                  <tr key={r.cat.id} className="border-t border-black/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-kaffza-text/60" style={{ width: r.depth * 16 }} />
                        {r.depth > 0 ? <span className="text-kaffza-text/50">↳</span> : null}
                        <span className="font-bold text-kaffza-text">{r.cat.nameAr || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-kaffza-text/80">{r.cat.nameEn || '-'}</td>
                    <td className="px-4 py-3 text-kaffza-text/70">{r.parent ? (r.parent.nameAr || r.parent.nameEn) : '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => openEdit(r.cat)}>
                          تعديل
                        </Button>
                        <Button variant="secondary" onClick={() => remove(r.cat)}>
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

      {open ? (
        <Modal title={editing ? 'تعديل تصنيف' : 'إضافة تصنيف'} onClose={() => setOpen(false)}>
          <div className="grid gap-3">
            <Field label="اسم عربي">
              <Input value={nameAr} onChange={(e: any) => setNameAr(e.target.value)} placeholder="أحذية" />
            </Field>
            <Field label="اسم إنجليزي">
              <Input value={nameEn} onChange={(e: any) => setNameEn(e.target.value)} placeholder="Shoes" />
            </Field>

            <Field label="الأب (اختياري)">
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-kaffza-primary"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
              >
                <option value="">بدون</option>
                {parentOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameAr || c.nameEn}
                  </option>
                ))}
              </select>
            </Field>

            <div className="mt-2 flex gap-2">
              <Button onClick={save} disabled={loading || !valid}>
                {loading ? 'جارٍ الحفظ...' : 'حفظ'}
              </Button>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                إلغاء
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function flatten(nodes: Category[], depth: number = 0, parent: Category | null = null): FlatRow[] {
  const out: FlatRow[] = [];
  for (const n of nodes || []) {
    out.push({ cat: n, depth, parent });
    if (n.children?.length) out.push(...flatten(n.children, depth + 1, n));
  }
  return out;
}

function Alert({ kind, text }: { kind: 'error' | 'success'; text: string }) {
  const cls = kind === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700';
  return <div className={`rounded-xl border p-4 text-sm ${cls}`}>{text}</div>;
}

function Modal({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div className="text-lg font-extrabold text-kaffza-primary">{title}</div>
          <button className="text-sm font-bold text-kaffza-text/70" onClick={onClose}>
            إغلاق
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-bold text-kaffza-text">{label}</span>
      {children}
    </label>
  );
}
