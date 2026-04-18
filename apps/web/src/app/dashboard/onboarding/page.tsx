'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { authHeader } from '../../../lib/auth';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { useStore } from '../store-context';

type OnboardingStep = {
  key: string;
  labelAr: string;
  labelEn: string;
  route: string;
  completed: boolean;
};

type OnboardingData = {
  steps: OnboardingStep[];
  completedCount: number;
  totalSteps: number;
  completionRate: number;
  nextStep: OnboardingStep | null;
};

function withLang(path: string, isEn: boolean) {
  return isEn ? `${path}${path.includes('?') ? '&' : '?'}lang=en` : path;
}

function OnboardingPageInner() {
  const sp = useSearchParams();
  const isEn = sp.get('lang') === 'en';
  const { storeId } = useStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData | null>(null);

  const stepHint = (route: string) => {
    if (route.includes('/products')) {
      return isEn
        ? 'Aim for at least 3 products with clear images and prices.'
        : 'استهدف إضافة 3 منتجات على الأقل مع صور وأسعار واضحة.';
    }
    if (route.includes('/shipping')) {
      return isEn
        ? 'Set zones and rates now to avoid checkout drop-offs later.'
        : 'حدّد المناطق والأسعار الآن لتجنب إلغاء الشراء لاحقاً.';
    }
    if (route.includes('/settings')) {
      return isEn
        ? 'Complete store identity to build trust before first purchase.'
        : 'أكمل هوية المتجر لرفع الثقة قبل أول عملية شراء.';
    }
    if (route.includes('/payments')) {
      return isEn
        ? 'Enable suitable methods so customers can finish checkout.'
        : 'فعّل طرق الدفع المناسبة لإكمال العملاء لعملية الشراء.';
    }
    return isEn
      ? 'Complete this step to improve launch readiness.'
      : 'إكمال هذه الخطوة يعزز جاهزية الإطلاق.';
  };

  const title = useMemo(() => {
    if (!data) return isEn ? 'Launch checklist' : 'خطة الانطلاقة';
    return isEn
      ? `Launch checklist (${data.completedCount}/${data.totalSteps})`
      : `خطة الانطلاقة (${data.completedCount}/${data.totalSteps})`;
  }, [data, isEn]);

  async function load() {
    if (!storeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/stores/${storeId}/onboarding`, {
        headers: { ...authHeader(), 'x-client': 'web' },
      });
      setData(res?.data?.data || null);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          (isEn ? 'Failed to load checklist' : 'تعذر تحميل خطة الانطلاقة')
      );
    } finally {
      setLoading(false);
    }
  }

  async function completeStep(step: string) {
    if (!storeId) return;
    setSaving(step);
    setError(null);
    try {
      const res = await api.post(
        `/stores/${storeId}/onboarding/complete`,
        { step },
        { headers: { ...authHeader(), 'x-client': 'web' } }
      );
      setData(res?.data?.data || null);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          (isEn ? 'Failed to save progress' : 'تعذر حفظ التقدم')
      );
    } finally {
      setSaving(null);
    }
  }

  useEffect(() => {
    load();
  }, [storeId]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-kaffza-primary text-2xl font-extrabold">{title}</h1>
        <p className="text-kaffza-text/70 mt-1 text-sm">
          {isEn
            ? 'Complete the checklist to activate store operations and increase first-order conversion.'
            : 'نفّذ الخطوات التالية لتجهيز متجرك ورفع فرص أول 5 طلبات.'}
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <div className="mt-3">
            <Button variant="secondary" onClick={load}>
              {isEn ? 'Retry checklist' : 'إعادة تحميل الخطة'}
            </Button>
          </div>
        </div>
      ) : null}

      {!storeId ? (
        <Card className="border-black/10 p-6 text-sm">
          <div className="text-kaffza-primary text-base font-extrabold">
            {isEn ? 'Select a store first' : 'اختر متجراً أولاً'}
          </div>
          <p className="text-kaffza-text/70 mt-1">
            {isEn
              ? 'Checklist appears after selecting or creating a merchant store.'
              : 'ستظهر الخطة بعد اختيار متجر التاجر أو إنشاء متجر جديد.'}
          </p>
        </Card>
      ) : null}

      {data ? (
        <Card className="border-black/10 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-kaffza-text text-sm font-bold">
              {isEn ? 'Completion rate' : 'نسبة الإنجاز'}
            </div>
            <div className="text-kaffza-primary text-sm font-extrabold">{data.completionRate}%</div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="bg-kaffza-primary h-full transition-all"
              style={{ width: `${Math.min(100, Math.max(0, data.completionRate))}%` }}
            />
          </div>
          {data.nextStep ? (
            <div className="bg-kaffza-bg mt-4 rounded-xl p-3 text-sm">
              {isEn ? 'Recommended next step:' : 'الخطوة التالية المقترحة:'}{' '}
              <span className="font-extrabold">
                {isEn ? data.nextStep.labelEn : data.nextStep.labelAr}
              </span>
            </div>
          ) : null}
        </Card>
      ) : null}

      {!loading && (!data?.steps || data.steps.length === 0) ? (
        <Card className="border-black/10 p-6 text-sm">
          <div className="text-kaffza-primary text-base font-extrabold">
            {isEn ? 'Checklist is not ready yet' : 'الخطة غير جاهزة حالياً'}
          </div>
          <p className="text-kaffza-text/70 mt-1">
            {isEn
              ? 'Try refreshing or visit settings and products to continue preparing your store.'
              : 'حاول التحديث أو انتقل للإعدادات والمنتجات للمتابعة.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={withLang('/dashboard/settings', isEn)}>
              <Button variant="secondary">{isEn ? 'Store settings' : 'إعدادات المتجر'}</Button>
            </Link>
            <Link href={withLang('/dashboard/products', isEn)}>
              <Button variant="secondary">{isEn ? 'Products' : 'المنتجات'}</Button>
            </Link>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {(data?.steps || []).map((step) => (
          <Card key={step.key} className="border-black/10 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-kaffza-primary text-base font-extrabold">
                  {isEn ? step.labelEn : step.labelAr}
                </h2>
                <p className="text-kaffza-text/70 mt-1 text-xs">{stepHint(step.route)}</p>
              </div>
              <span
                className={
                  'rounded-full px-2.5 py-1 text-xs font-bold ' +
                  (step.completed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')
                }
              >
                {step.completed
                  ? isEn
                    ? 'Completed'
                    : 'مكتملة'
                  : isEn
                    ? 'Pending'
                    : 'بانتظار التنفيذ'}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={withLang(step.route, isEn)}>
                <Button variant="secondary">{isEn ? 'Open page' : 'فتح الصفحة'}</Button>
              </Link>
              {!step.completed ? (
                <Button onClick={() => completeStep(step.key)} disabled={saving === step.key}>
                  {saving === step.key
                    ? isEn
                      ? 'Saving...'
                      : 'جارٍ الحفظ...'
                    : isEn
                      ? 'Mark done'
                      : 'تم التنفيذ'}
                </Button>
              ) : null}
            </div>
          </Card>
        ))}
      </div>

      {loading ? (
        <Card className="border-black/10 p-4 text-sm">
          <div className="text-kaffza-text/60">
            {isEn ? 'Loading checklist...' : 'جارٍ تحميل الخطة...'}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingPageInner />
    </Suspense>
  );
}
