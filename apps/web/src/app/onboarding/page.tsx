'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { api } from '../../lib/api';
import { authHeader, getAccessTokenFromCookies } from '../../lib/auth';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

const SUBDOMAIN_RE = /^[a-z0-9-]+$/;

const PLANS = [
  {
    id: 1,
    key: 'starter',
    name: 'Starter',
    price: 5,
    descAr: 'بداية مناسبة للمتاجر الصغيرة',
    descEn: 'A solid start for small stores',
  },
  {
    id: 2,
    key: 'growth',
    name: 'Growth',
    price: 8,
    descAr: 'الأكثر شعبية للمتاجر المتنامية',
    descEn: 'Most popular for growing stores',
    popular: true,
  },
  {
    id: 3,
    key: 'pro',
    name: 'Pro',
    price: 35,
    descAr: 'للشركات والمتاجر الكبيرة',
    descEn: 'For enterprises and larger stores',
  },
];

function OnboardingPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const isEn = sp.get('lang') === 'en';
  const withLang = (path: string) =>
    isEn ? `${path}${path.includes('?') ? '&' : '?'}lang=en` : path;

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');

  const [subdomain, setSubdomain] = useState('');
  const [subdomainStatus, setSubdomainStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  >('idle');

  const [planId, setPlanId] = useState<number>(2);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    const token = getAccessTokenFromCookies();
    if (!token) {
      router.replace(isEn ? '/en/merchant/login' : '/merchant/login');
      return;
    }

    (async () => {
      try {
        const res = await api.get('/stores/my', {
          headers: { ...authHeader(), 'x-client': 'web' },
        });
        const arr = res?.data?.data || [];
        if (Array.isArray(arr) && arr.length > 0) router.replace(withLang('/dashboard'));
      } catch {
        // ignore
      }
    })();
     
  }, []);

  const step1Ok = useMemo(
    () => nameAr.trim().length >= 2 && nameEn.trim().length >= 2,
    [nameAr, nameEn]
  );
  const subdomainOk = useMemo(() => {
    const s = subdomain.trim();
    return s.length >= 3 && s.length <= 50 && SUBDOMAIN_RE.test(s);
  }, [subdomain]);

  const checkSubdomain = async () => {
    setMsg(null);
    const s = subdomain.trim();
    if (!subdomainOk) {
      setSubdomainStatus('invalid');
      setMsg({
        type: 'error',
        text: isEn
          ? 'Subdomain is invalid (lowercase letters, numbers, and hyphens only)'
          : 'النطاق الفرعي غير صالح (أحرف صغيرة/أرقام/شرطة فقط)',
      });
      return;
    }

    setSubdomainStatus('checking');
    try {
      const res = await api.get(`/stores/check-subdomain/${encodeURIComponent(s)}`);
      const available = !!res?.data?.data?.available;
      setSubdomainStatus(available ? 'available' : 'taken');
      setMsg({
        type: available ? 'success' : 'error',
        text: available
          ? isEn
            ? 'Available ✅'
            : 'متوفر ✅'
          : isEn
            ? 'Unavailable ❌'
            : 'غير متوفر ❌',
      });
    } catch {
      try {
        await api.get(`/stores/subdomain/${encodeURIComponent(s)}`);
        setSubdomainStatus('taken');
        setMsg({ type: 'error', text: isEn ? 'Unavailable ❌' : 'غير متوفر ❌' });
      } catch {
        setSubdomainStatus('available');
        setMsg({ type: 'success', text: isEn ? 'Available ✅' : 'متوفر ✅' });
      }
    }
  };

  const createStore = async () => {
    setMsg(null);
    if (!step1Ok) {
      setMsg({
        type: 'error',
        text: isEn
          ? 'Please provide both Arabic and English store names'
          : 'الرجاء تعبئة اسم المتجر بالعربي والإنجليزي',
      });
      setStep(1);
      return;
    }
    if (!subdomainOk) {
      setMsg({
        type: 'error',
        text: isEn ? 'Please choose a valid subdomain' : 'الرجاء اختيار نطاق فرعي صحيح',
      });
      setStep(2);
      return;
    }
    if (subdomainStatus !== 'available') {
      setMsg({
        type: 'error',
        text: isEn ? 'Check subdomain availability first' : 'تحقق من توفر النطاق الفرعي أولاً',
      });
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      await api.post(
        '/stores',
        {
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim(),
          descriptionAr: descriptionAr.trim() || undefined,
          descriptionEn: descriptionEn.trim() || undefined,
          subdomain: subdomain.trim(),
          planId,
        },
        { headers: { ...authHeader(), 'x-client': 'web' } }
      );

      router.replace(withLang('/dashboard?welcome=1'));
    } catch (e: any) {
      setMsg({
        type: 'error',
        text: e?.response?.data?.message || (isEn ? 'Failed to create store' : 'فشل إنشاء المتجر'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir={isEn ? 'ltr' : 'rtl'} className="mx-auto max-w-4xl px-6 py-10">
      <div>
        <div className="text-kaffza-text/70 text-xs">
          {isEn ? 'Merchant setup' : 'إعدادات التاجر'}
        </div>
        <h1 className="text-kaffza-primary text-2xl font-extrabold">
          {isEn ? 'Create your store' : 'إنشاء متجرك'}
        </h1>
        <p className="text-kaffza-text/80 mt-1 text-sm">
          {isEn
            ? '3 simple steps to start selling on Kaffza.'
            : '3 خطوات بسيطة لتبدأ البيع على Kaffza.'}
        </p>
      </div>

      <Stepper step={step} isEn={isEn} />

      {msg ? (
        <div
          className={
            'mt-4 rounded-xl border p-4 text-sm ' +
            (msg.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700')
          }
        >
          {msg.text}
        </div>
      ) : null}

      {step === 1 ? (
        <Card className="mt-6 p-6">
          <div className="text-kaffza-primary text-sm font-extrabold">
            {isEn ? 'Step 1 — Store details' : 'الخطوة 1 — معلومات المتجر'}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label={isEn ? 'Store name in Arabic (required)' : 'اسم المتجر بالعربي (إلزامي)'}>
              <Input
                value={nameAr}
                onChange={(e: any) => setNameAr(e.target.value)}
                placeholder="متجري"
              />
            </Field>
            <Field
              label={isEn ? 'Store name in English (required)' : 'اسم المتجر بالإنجليزي (إلزامي)'}
            >
              <Input
                value={nameEn}
                onChange={(e: any) => setNameEn(e.target.value)}
                placeholder="My Store"
              />
            </Field>
            <Field
              label={
                isEn ? 'Store description in Arabic (optional)' : 'وصف المتجر بالعربي (اختياري)'
              }
            >
              <textarea
                className="focus:border-kaffza-primary min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                value={descriptionAr}
                onChange={(e) => setDescriptionAr(e.target.value)}
              />
            </Field>
            <Field
              label={
                isEn ? 'Store description in English (optional)' : 'وصف المتجر بالإنجليزي (اختياري)'
              }
            >
              <textarea
                className="focus:border-kaffza-primary min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
              />
            </Field>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!step1Ok}>
              {isEn ? 'Next' : 'التالي'}
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="mt-6 p-6">
          <div className="text-kaffza-primary text-sm font-extrabold">
            {isEn ? 'Step 2 — URL & identity' : 'الخطوة 2 — الرابط والهوية'}
          </div>
          <div className="mt-4 grid gap-3">
            <Field label={isEn ? 'Subdomain (store URL)' : 'subdomain (رابط المتجر)'}>
              <Input
                value={subdomain}
                onChange={(e: any) => {
                  setSubdomain(e.target.value.toLowerCase().replace(/\s+/g, ''));
                  setSubdomainStatus('idle');
                }}
                placeholder="mystore"
              />
              <div className="text-kaffza-text/70 mt-1 text-xs">
                {isEn ? 'Preview:' : 'المعاينة:'}{' '}
                <span className="text-kaffza-primary font-bold">
                  {subdomain || '...'} .kaffza.com
                </span>
              </div>
              <div className="text-kaffza-text/60 mt-1 text-xs">
                {isEn
                  ? 'Only lowercase letters, numbers, and hyphens (-), no spaces'
                  : 'فقط أحرف إنجليزية صغيرة وأرقام وشرطة (-) بدون مسافات'}
              </div>
            </Field>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={checkSubdomain}
                disabled={subdomainStatus === 'checking' || !subdomainOk}
              >
                {subdomainStatus === 'checking'
                  ? isEn
                    ? 'Checking...'
                    : 'جارٍ التحقق...'
                  : isEn
                    ? 'Check availability'
                    : 'تحقق من التوفر'}
              </Button>
              <Button variant="secondary" onClick={() => setStep(1)}>
                {isEn ? 'Back' : 'رجوع'}
              </Button>
              <Button onClick={() => setStep(3)} disabled={subdomainStatus !== 'available'}>
                {isEn ? 'Next' : 'التالي'}
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {step === 3 ? (
        <div className="mt-6 space-y-4">
          <Card className="p-6">
            <div className="text-kaffza-primary text-sm font-extrabold">
              {isEn ? 'Step 3 — Pick a plan' : 'الخطوة 3 — اختيار الخطة'}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {PLANS.map((p) => (
                <PlanCard
                  key={p.id}
                  plan={p}
                  selected={planId === p.id}
                  onSelect={() => setPlanId(p.id)}
                  isEn={isEn}
                />
              ))}
            </div>

            <div className="mt-6 flex flex-wrap justify-between gap-2">
              <Button variant="secondary" onClick={() => setStep(2)}>
                {isEn ? 'Back' : 'رجوع'}
              </Button>

              <div className="flex gap-2">
                <Button variant="secondary" onClick={createStore} disabled={loading}>
                  {loading
                    ? isEn
                      ? 'Creating...'
                      : 'جارٍ الإنشاء...'
                    : isEn
                      ? 'Start free for 14 days'
                      : 'ابدأ مجاناً لمدة 14 يوم'}
                </Button>
                <Button onClick={createStore} disabled={loading}>
                  {loading
                    ? isEn
                      ? 'Creating...'
                      : 'جارٍ الإنشاء...'
                    : isEn
                      ? 'Create store'
                      : 'إنشاء المتجر'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingPageInner />
    </Suspense>
  );
}

function Stepper({ step, isEn }: { step: 1 | 2 | 3; isEn: boolean }) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      <Step
        active={step === 1}
        done={step > 1}
        title="1"
        label={isEn ? 'Store details' : 'معلومات المتجر'}
      />
      <Step
        active={step === 2}
        done={step > 2}
        title="2"
        label={isEn ? 'URL & identity' : 'الرابط والهوية'}
      />
      <Step active={step === 3} done={false} title="3" label={isEn ? 'Plan' : 'الخطة'} />
    </div>
  );
}

function Step({ active, done, title, label }: any) {
  return (
    <div
      className={
        'rounded-xl border p-4 ' +
        (active ? 'border-kaffza-primary bg-white' : 'border-black/10 bg-white')
      }
    >
      <div className="flex items-center justify-between">
        <div
          className={
            'flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold ' +
            (done
              ? 'bg-green-50 text-green-700'
              : active
                ? 'bg-kaffza-primary text-white'
                : 'bg-kaffza-bg text-kaffza-text')
          }
        >
          {done ? '✓' : title}
        </div>
        <div className="text-kaffza-text text-sm font-bold">{label}</div>
      </div>
    </div>
  );
}

function PlanCard({ plan, selected, onSelect, isEn }: any) {
  const border = selected ? 'border-kaffza-primary' : 'border-black/10';
  const bg = plan.popular ? 'bg-[#F5A623]/10' : 'bg-white';
  return (
    <button
      onClick={onSelect}
      className={`rounded-2xl border text-right ${border} ${bg} hover:border-kaffza-primary p-5 transition`}
    >
      <div className="flex items-center justify-between">
        <div className="text-kaffza-primary text-sm font-extrabold">{plan.name}</div>
        {plan.popular ? (
          <span className="rounded-full bg-[#F5A623] px-3 py-1 text-[11px] font-extrabold text-white">
            {isEn ? 'Most popular' : 'الأكثر شعبية'}
          </span>
        ) : null}
      </div>
      <div className="text-kaffza-info mt-2 text-2xl font-extrabold">
        {plan.price} ر.ع
        <span className="text-kaffza-text/70 text-sm font-bold">/{isEn ? 'month' : 'شهر'}</span>
      </div>
      <div className="text-kaffza-text/70 mt-2 text-xs">{isEn ? plan.descEn : plan.descAr}</div>
      {selected ? (
        <div className="text-kaffza-primary mt-3 text-xs font-bold">
          {isEn ? 'Selected ✓' : 'مختارة ✓'}
        </div>
      ) : (
        <div className="text-kaffza-text/60 mt-3 text-xs">
          {isEn ? 'Click to select' : 'اضغط للاختيار'}
        </div>
      )}
    </button>
  );
}

function Field({ label, children }: any) {
  return (
    <label className="grid gap-1">
      <span className="text-kaffza-text text-sm font-bold">{label}</span>
      {children}
    </label>
  );
}
