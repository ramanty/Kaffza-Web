'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '../../../lib/api';
import { authHeader } from '../../../lib/auth';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Card } from '../../../components/Card';
import { useStore } from '../store-context';

type Store = {
  id: string;
  nameAr?: string;
  nameEn?: string;
  subdomain?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  customDomain?: string;
  logoUrl?: string;
  bannerUrl?: string;
};

export default function SettingsPage() {
  const { storeId, loading: storesLoading } = useStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [store, setStore] = useState<Store | null>(null);
  const [form, setForm] = useState({
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    customDomain: '',
    logoUrl: '',
    bannerUrl: '',
  });

  async function load() {
    if (!storeId) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.get(`/stores/${storeId}`, { headers: { ...authHeader(), 'x-client': 'web' } });
      const data = res?.data?.data;
      const st: Store = {
        id: storeId,
        nameAr: data?.nameAr,
        nameEn: data?.nameEn,
        subdomain: data?.subdomain,
        descriptionAr: data?.descriptionAr,
        descriptionEn: data?.descriptionEn,
        customDomain: data?.customDomain,
        logoUrl: data?.logoUrl,
        bannerUrl: data?.bannerUrl,
      };

      setStore(st);
      setForm({
        nameAr: st.nameAr || '',
        nameEn: st.nameEn || '',
        descriptionAr: st.descriptionAr || '',
        descriptionEn: st.descriptionEn || '',
        customDomain: st.customDomain || '',
        logoUrl: st.logoUrl || '',
        bannerUrl: st.bannerUrl || '',
      });
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'حدث خطأ أثناء تحميل إعدادات المتجر');
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

  const canSave = useMemo(() => !!storeId && form.nameAr.trim().length >= 2 && form.nameEn.trim().length >= 2, [storeId, form.nameAr, form.nameEn]);

  async function save() {
    if (!storeId) return;
    setError(null);
    setSuccess(null);
    try {
      setSaving(true);
      const payload: any = {
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim(),
        descriptionAr: form.descriptionAr.trim() || undefined,
        descriptionEn: form.descriptionEn.trim() || undefined,
        customDomain: form.customDomain.trim() || undefined,
        logoUrl: form.logoUrl.trim() || undefined,
        bannerUrl: form.bannerUrl.trim() || undefined,
      };

      await api.patch(`/stores/${storeId}`, payload, { headers: { ...authHeader(), 'x-client': 'web' } });
      setSuccess('تم حفظ الإعدادات بنجاح');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'فشل حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-kaffza-primary">الإعدادات</h1>
        <p className="mt-1 text-sm text-kaffza-text/80">تحديث بيانات المتجر (اسم، وصف، دومين، شعار...)</p>
        {!storeId && !storesLoading ? <p className="mt-1 text-xs text-red-700">لا يوجد متجر محدد.</p> : null}
      </header>

      {error ? <Alert kind="error" text={error} /> : null}
      {success ? <Alert kind="success" text={success} /> : null}

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm font-extrabold text-kaffza-primary">بيانات المتجر</div>
            <div className="mt-1 text-xs text-kaffza-text/70">subdomain للعرض فقط (غير قابل للتعديل عبر هذا الـ endpoint).</div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={load}>
              تحديث
            </Button>
            <Button onClick={save} disabled={!canSave || saving}>
              {saving ? 'جارٍ الحفظ...' : 'حفظ'}
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="اسم المتجر (عربي)">
            <Input value={form.nameAr} onChange={(e: any) => setForm((s) => ({ ...s, nameAr: e.target.value }))} />
          </Field>

          <Field label="اسم المتجر (English)">
            <Input value={form.nameEn} onChange={(e: any) => setForm((s) => ({ ...s, nameEn: e.target.value }))} />
          </Field>

          <Field label="Subdomain">
            <Input value={store?.subdomain || ''} disabled />
          </Field>

          <Field label="Custom Domain (اختياري)">
            <Input value={form.customDomain} onChange={(e: any) => setForm((s) => ({ ...s, customDomain: e.target.value }))} placeholder="example.com" />
          </Field>

          <Field label="وصف المتجر (عربي)">
            <textarea
              className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-kaffza-primary"
              value={form.descriptionAr}
              onChange={(e) => setForm((s) => ({ ...s, descriptionAr: e.target.value }))}
              placeholder="اكتب وصفاً مختصراً..."
            />
          </Field>

          <Field label="Store Description (English)">
            <textarea
              className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-kaffza-primary"
              value={form.descriptionEn}
              onChange={(e) => setForm((s) => ({ ...s, descriptionEn: e.target.value }))}
              placeholder="Write a short description..."
            />
          </Field>

          <Field label="Logo URL (رابط الشعار)">
            <Input value={form.logoUrl} onChange={(e: any) => setForm((s) => ({ ...s, logoUrl: e.target.value }))} placeholder="https://..." />
          </Field>

          <Field label="Banner URL (رابط البنر)">
            <Input value={form.bannerUrl} onChange={(e: any) => setForm((s) => ({ ...s, bannerUrl: e.target.value }))} placeholder="https://..." />
          </Field>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-kaffza-bg p-4">
            <div className="text-sm font-extrabold text-kaffza-primary">معاينة الشعار</div>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-16 w-16 overflow-hidden rounded-xl border border-black/10 bg-white">
                {form.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logoUrl} alt="logo" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-kaffza-text/60">لا يوجد</div>
                )}
              </div>
              <div className="text-xs text-kaffza-text/70">
                رفع الملف إلى MinIO غير متوفر حالياً لأن المشروع لا يحتوي endpoint رفع جاهز. يمكنك وضع رابط مباشر للشعار.
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-black/5 bg-white p-4">
            <div className="text-sm font-extrabold text-kaffza-primary">رفع شعار (قريباً)</div>
            <p className="mt-1 text-xs text-kaffza-text/70">عند إضافة endpoint رفع (MinIO/S3) سنربطه مباشرة هنا.</p>
            <input disabled type="file" className="mt-3 w-full text-sm" />
          </div>
        </div>
      </Card>
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

function Alert({ kind, text }: { kind: 'error' | 'success'; text: string }) {
  const cls = kind === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700';
  return <div className={`rounded-xl border p-4 text-sm ${cls}`}>{text}</div>;
}
