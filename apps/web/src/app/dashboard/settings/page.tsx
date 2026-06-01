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
  plan?: any;
};

type PaymentSettings = {
  cardEnabled: boolean;
  codEnabled: boolean;
  walletEnabled: boolean;
  bnplEnabled: boolean;
  minOrderAmount: number | null;
  maxOrderAmount: number | null;
  codMinOrderAmount: number | null;
  codMaxOrderAmount: number | null;
  codMaxWeightKg: number | null;
};

const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  cardEnabled: true,
  codEnabled: false,
  walletEnabled: false,
  bnplEnabled: false,
  minOrderAmount: null,
  maxOrderAmount: null,
  codMinOrderAmount: null,
  codMaxOrderAmount: null,
  codMaxWeightKg: null,
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

  const [paymentRules, setPaymentRules] = useState<PaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
  const [paymentRulesSaving, setPaymentRulesSaving] = useState(false);
  const [paymentRulesSuccess, setPaymentRulesSuccess] = useState<string | null>(null);
  const [paymentRulesError, setPaymentRulesError] = useState<string | null>(null);

  async function load() {
    if (!storeId) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const [storeRes, paymentRes] = await Promise.all([
        api.get(`/stores/${storeId}`, { headers: { ...authHeader(), 'x-client': 'web' } }),
        api.get(`/stores/${storeId}/payment-settings`, {
          headers: { ...authHeader(), 'x-client': 'web' },
        }),
      ]);
      const data = storeRes?.data?.data;
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
        plan: data?.plan,
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

      setPaymentRules({ ...DEFAULT_PAYMENT_SETTINGS, ...(paymentRes?.data?.data || {}) });
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
  }, [storeId]);

  const canSave = useMemo(
    () => !!storeId && form.nameAr.trim().length >= 2 && form.nameEn.trim().length >= 2,
    [storeId, form.nameAr, form.nameEn]
  );

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

      await api.patch(`/stores/${storeId}`, payload, {
        headers: { ...authHeader(), 'x-client': 'web' },
      });
      setSuccess('تم حفظ الإعدادات بنجاح');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'فشل حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  }

  async function savePaymentRules() {
    if (!storeId) return;
    const enabledMethods = [
      paymentRules.cardEnabled,
      paymentRules.codEnabled,
      paymentRules.walletEnabled,
      paymentRules.bnplEnabled,
    ].filter(Boolean).length;
    if (enabledMethods === 0) {
      setPaymentRulesError('يجب تفعيل طريقة دفع واحدة على الأقل.');
      return;
    }
    if (
      paymentRules.minOrderAmount !== null &&
      paymentRules.maxOrderAmount !== null &&
      paymentRules.minOrderAmount > paymentRules.maxOrderAmount
    ) {
      setPaymentRulesError('الحد الأدنى للطلب يجب أن يكون أصغر من الحد الأعلى.');
      return;
    }
    if (
      paymentRules.codMinOrderAmount !== null &&
      paymentRules.codMaxOrderAmount !== null &&
      paymentRules.codMinOrderAmount > paymentRules.codMaxOrderAmount
    ) {
      setPaymentRulesError('حدود COD غير صحيحة: الحد الأدنى أكبر من الحد الأعلى.');
      return;
    }
    setPaymentRulesError(null);
    setPaymentRulesSaving(true);
    setPaymentRulesSuccess(null);
    setError(null);
    try {
      const payload = {
        ...paymentRules,
        minOrderAmount: toNullableNumber(paymentRules.minOrderAmount),
        maxOrderAmount: toNullableNumber(paymentRules.maxOrderAmount),
        codMinOrderAmount: toNullableNumber(paymentRules.codMinOrderAmount),
        codMaxOrderAmount: toNullableNumber(paymentRules.codMaxOrderAmount),
        codMaxWeightKg: toNullableNumber(paymentRules.codMaxWeightKg),
      };
      const res = await api.patch(`/stores/${storeId}/payment-settings`, payload, {
        headers: { ...authHeader(), 'x-client': 'web' },
      });
      setPaymentRules({ ...DEFAULT_PAYMENT_SETTINGS, ...(res?.data?.data || payload) });
      setPaymentRulesSuccess('تم حفظ إعدادات طرق الدفع');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'فشل حفظ إعدادات الدفع');
    } finally {
      setPaymentRulesSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-gray-900 text-2xl font-extrabold">الإعدادات</h1>
        <p className="text-gray-900 mt-1 text-sm">
          تحديث بيانات المتجر (اسم، وصف، دومين، شعار...)
        </p>
        {!storeId && !storesLoading ? (
          <p className="mt-1 text-xs text-red-700">لا يوجد متجر محدد.</p>
        ) : null}
      </header>

      {error ? <Alert kind="error" text={error} /> : null}
      {success ? <Alert kind="success" text={success} /> : null}

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-gray-900 text-sm font-extrabold">بيانات المتجر</div>
            <div className="text-gray-900 mt-1 text-xs">
              subdomain للعرض فقط (غير قابل للتعديل عبر هذا الـ endpoint).
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={load}>
              تحديث
            </Button>
            <Button onClick={save} disabled={!canSave || saving || loading}>
              {saving ? 'جارٍ الحفظ...' : 'حفظ'}
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="اسم المتجر (عربي)">
            <Input
              value={form.nameAr}
              onChange={(e: any) => setForm((s) => ({ ...s, nameAr: e.target.value }))}
            />
          </Field>

          <Field label="اسم المتجر (English)">
            <Input
              value={form.nameEn}
              onChange={(e: any) => setForm((s) => ({ ...s, nameEn: e.target.value }))}
            />
          </Field>

          <Field label="Subdomain">
            <Input value={store?.subdomain || ''} disabled />
          </Field>

          {store?.plan?.name === 'Free' || !store?.plan ? (
            <div className="col-span-full md:col-span-1 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="text-sm font-bold text-blue-900">الدومين الخاص (Custom Domain)</div>
              <div className="mt-1 text-xs text-blue-800">
                هل تريد ربط متجرك بدومين خاص؟ (مثال: mystore.com). اشترك في باقة 'النمو' أو 'المحترف' لتفعيل هذه الميزة.
              </div>
              <a href="/dashboard/plans" className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">
                الترقية الآن
              </a>
            </div>
          ) : (
            <Field label="Custom Domain (اختياري)">
              <Input
                value={form.customDomain}
                onChange={(e: any) => setForm((s) => ({ ...s, customDomain: e.target.value }))}
                placeholder="example.com"
              />
              <div className="mt-1 text-xs text-gray-500">أضف CNAME Record يشير إلى shops.kaffza.me في إعدادات الـ DNS الخاصة بك.</div>
            </Field>
          )}

          <Field label="وصف المتجر (عربي)">
            <textarea
              className="focus:border-kaffza-primary min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
              value={form.descriptionAr}
              onChange={(e) => setForm((s) => ({ ...s, descriptionAr: e.target.value }))}
              placeholder="اكتب وصفاً مختصراً..."
            />
          </Field>

          <Field label="Store Description (English)">
            <textarea
              className="focus:border-kaffza-primary min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
              value={form.descriptionEn}
              onChange={(e) => setForm((s) => ({ ...s, descriptionEn: e.target.value }))}
              placeholder="Write a short description..."
            />
          </Field>

          <Field label="Logo URL (رابط الشعار)">
            <Input
              value={form.logoUrl}
              onChange={(e: any) => setForm((s) => ({ ...s, logoUrl: e.target.value }))}
              placeholder="https://..."
            />
          </Field>

          <Field label="Banner URL (رابط البنر)">
            <Input
              value={form.bannerUrl}
              onChange={(e: any) => setForm((s) => ({ ...s, bannerUrl: e.target.value }))}
              placeholder="https://..."
            />
          </Field>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-gray-900 text-sm font-extrabold">
              طرق الدفع | Payment Methods
            </div>
            <div className="text-gray-900 mt-1 text-xs">
              تفعيل/تعطيل طرق الدفع ووضع قيود الطلب بأمان.
            </div>
          </div>
          <Button onClick={savePaymentRules} disabled={!storeId || paymentRulesSaving}>
            {paymentRulesSaving ? 'جارٍ الحفظ...' : 'حفظ إعدادات الدفع'}
          </Button>
        </div>

        {paymentRulesSuccess ? <Alert kind="success" text={paymentRulesSuccess} /> : null}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Toggle
            label="بطاقة / Card"
            checked={paymentRules.cardEnabled}
            onChange={(v) => setPaymentRules((s) => ({ ...s, cardEnabled: v }))}
          />
          <Toggle
            label="الدفع عند الاستلام / COD"
            checked={paymentRules.codEnabled}
            onChange={(v) => setPaymentRules((s) => ({ ...s, codEnabled: v }))}
          />
          <Toggle
            label="المحفظة / Wallet"
            checked={paymentRules.walletEnabled}
            onChange={(v) => setPaymentRules((s) => ({ ...s, walletEnabled: v }))}
          />
          <Toggle
            label="اشتر الآن وادفع لاحقاً / BNPL"
            checked={paymentRules.bnplEnabled}
            onChange={(v) => setPaymentRules((s) => ({ ...s, bnplEnabled: v }))}
          />
        </div>
        {paymentRulesError ? <Alert kind="error" text={paymentRulesError} /> : null}

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Field label="الحد الأدنى للطلب | Min Order (OMR)">
            <Input
              value={toInput(paymentRules.minOrderAmount)}
              onChange={(e: any) =>
                setPaymentRules((s) => ({ ...s, minOrderAmount: toNullableNumber(e.target.value) }))
              }
              placeholder="فارغ = بدون حد"
            />
          </Field>
          <Field label="الحد الأعلى للطلب | Max Order (OMR)">
            <Input
              value={toInput(paymentRules.maxOrderAmount)}
              onChange={(e: any) =>
                setPaymentRules((s) => ({ ...s, maxOrderAmount: toNullableNumber(e.target.value) }))
              }
              placeholder="فارغ = بدون حد"
            />
          </Field>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            يتم تطبيق القيود في مسار Checkout فقط. إذا تركت الحقول فارغة فلن تتغير السلوكيات
            الحالية.
          </div>
          <Field label="COD Min (OMR)">
            <Input
              value={toInput(paymentRules.codMinOrderAmount)}
              onChange={(e: any) =>
                setPaymentRules((s) => ({
                  ...s,
                  codMinOrderAmount: toNullableNumber(e.target.value),
                }))
              }
              placeholder="اختياري"
            />
          </Field>
          <Field label="COD Max (OMR)">
            <Input
              value={toInput(paymentRules.codMaxOrderAmount)}
              onChange={(e: any) =>
                setPaymentRules((s) => ({
                  ...s,
                  codMaxOrderAmount: toNullableNumber(e.target.value),
                }))
              }
              placeholder="اختياري"
            />
          </Field>
          <Field label="COD Max Weight (KG)">
            <Input
              value={toInput(paymentRules.codMaxWeightKg)}
              onChange={(e: any) =>
                setPaymentRules((s) => ({ ...s, codMaxWeightKg: toNullableNumber(e.target.value) }))
              }
              placeholder="اختياري"
            />
          </Field>
        </div>
      </Card>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-black/10 px-3 py-2 text-sm">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function Field({ label, children }: { label: string; children: any }) {
  return (
    <label className="grid gap-1">
      <span className="text-gray-900 text-sm font-bold">{label}</span>
      {children}
    </label>
  );
}

function Alert({ kind, text }: { kind: 'error' | 'success'; text: string }) {
  const cls =
    kind === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-green-200 bg-green-50 text-green-700';
  return <div className={`rounded-xl border p-4 text-sm ${cls}`}>{text}</div>;
}

function toNullableNumber(v: unknown): number | null {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n;
}

function toInput(v: number | null) {
  return v === null ? '' : String(v);
}
