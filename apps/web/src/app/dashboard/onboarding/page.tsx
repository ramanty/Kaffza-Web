'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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

export default function OnboardingPage() {
  const { storeId } = useStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData | null>(null);

  const title = useMemo(() => {
    if (!data) return 'خطة الانطلاقة';
    return `خطة الانطلاقة (${data.completedCount}/${data.totalSteps})`;
  }, [data]);

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
      setError(e?.response?.data?.message || e?.message || 'تعذر تحميل خطة الانطلاقة');
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
      setError(e?.response?.data?.message || e?.message || 'تعذر حفظ التقدم');
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
          نفّذ الخطوات التالية لتجهيز متجرك ورفع فرص أول 5 طلبات.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {data ? (
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-kaffza-text text-sm font-bold">نسبة الإنجاز</div>
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
              الخطوة التالية المقترحة:{' '}
              <span className="font-extrabold">{data.nextStep.labelAr}</span>
            </div>
          ) : null}
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {(data?.steps || []).map((step) => (
          <Card key={step.key} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-kaffza-primary text-base font-extrabold">{step.labelAr}</h2>
                <p className="text-kaffza-text/70 mt-1 text-xs">{step.labelEn}</p>
              </div>
              <span
                className={
                  'rounded-full px-2.5 py-1 text-xs font-bold ' +
                  (step.completed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')
                }
              >
                {step.completed ? 'مكتملة' : 'بانتظار التنفيذ'}
              </span>
            </div>

            <div className="mt-4 flex gap-2">
              <Link href={step.route}>
                <Button variant="secondary">فتح الصفحة</Button>
              </Link>
              {!step.completed ? (
                <Button onClick={() => completeStep(step.key)} disabled={saving === step.key}>
                  {saving === step.key ? 'جارٍ الحفظ...' : 'تم التنفيذ'}
                </Button>
              ) : null}
            </div>
          </Card>
        ))}
      </div>

      {loading ? <div className="text-kaffza-text/60 text-sm">جارٍ التحميل...</div> : null}
    </div>
  );
}
