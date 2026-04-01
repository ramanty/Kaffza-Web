'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { api } from '../../lib/api';
import { authHeader, getAccessTokenFromCookies } from '../../lib/auth';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

const SUBDOMAIN_RE = /^[a-z0-9-]+$/;

const PLANS = [
  { id: 1, key: 'starter', name: 'Starter', price: 5, desc: 'بداية مناسبة للمتاجر الصغيرة' },
  { id: 2, key: 'growth', name: 'Growth', price: 8, desc: 'الأكثر شعبية للمتاجر المتنامية', popular: true },
  { id: 3, key: 'pro', name: 'Pro', price: 35, desc: 'للشركات والمتاجر الكبيرة' },
];

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');

  // Step 2
  const [subdomain, setSubdomain] = useState('');
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');

  // Step 3
  const [planId, setPlanId] = useState<number>(2);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    const token = getAccessTokenFromCookies();
    if (!token) {
      router.replace(`/merchant/login`);
      return;
    }

    // If already has stores, skip onboarding
    (async () => {
      try {
        const res = await api.get('/stores/my', { headers: { ...authHeader(), 'x-client': 'web' } });
        const arr = res?.data?.data || [];
        if (Array.isArray(arr) && arr.length > 0) router.replace('/dashboard');
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step1Ok = useMemo(() => nameAr.trim().length >= 2 && nameEn.trim().length >= 2, [nameAr, nameEn]);
  const subdomainOk = useMemo(() => {
    const s = subdomain.trim();
    return s.length >= 3 && s.length <= 50 && SUBDOMAIN_RE.test(s);
  }, [subdomain]);

  const checkSubdomain = async () => {
    setMsg(null);
    const s = subdomain.trim();
    if (!subdomainOk) {
      setSubdomainStatus('invalid');
      setMsg({ type: 'error', text: 'النطاق الفرعي غير صالح (أحرف صغيرة/أرقام/شرطة فقط)' });
      return;
    }

    setSubdomainStatus('checking');
    try {
      // Preferred endpoint
      const res = await api.get(`/stores/check-subdomain/${encodeURIComponent(s)}`);
      const available = !!res?.data?.data?.available;
      setSubdomainStatus(available ? 'available' : 'taken');
      setMsg({ type: available ? 'success' : 'error', text: available ? 'متوفر ✅' : 'غير متوفر ❌' });
    } catch {
      // fallback: try get store by subdomain
      try {
        await api.get(`/stores/subdomain/${encodeURIComponent(s)}`);
        setSubdomainStatus('taken');
        setMsg({ type: 'error', text: 'غير متوفر ❌' });
      } catch {
        setSubdomainStatus('available');
        setMsg({ type: 'success', text: 'متوفر ✅' });
      }
    }
  };

  const createStore = async () => {
    setMsg(null);
    if (!step1Ok) {
      setMsg({ type: 'error', text: 'الرجاء تعبئة اسم المتجر بالعربي والإنجليزي' });
      setStep(1);
      return;
    }
    if (!subdomainOk) {
      setMsg({ type: 'error', text: 'الرجاء اختيار نطاق فرعي صحيح' });
      setStep(2);
      return;
    }
    if (subdomainStatus !== 'available') {
      setMsg({ type: 'error', text: 'تحقق من توفر النطاق الفرعي أولاً' });
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

      router.replace('/dashboard?welcome=1');
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'فشل إنشاء المتجر' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir="rtl" className="mx-auto max-w-4xl px-6 py-10">
      <div>
        <div className="text-xs text-kaffza-text/70">إعدادات التاجر</div>
        <h1 className="text-2xl font-extrabold text-kaffza-primary">إنشاء متجرك</h1>
        <p className="mt-1 text-sm text-kaffza-text/80">3 خطوات بسيطة لتبدأ البيع على Kaffza.</p>
      </div>

      <Stepper step={step} />

      {msg ? (
        <div className={'mt-4 rounded-xl border p-4 text-sm ' + (msg.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700')}>
          {msg.text}
        </div>
      ) : null}

      {step === 1 ? (
        <Card className="mt-6 p-6">
          <div className="text-sm font-extrabold text-kaffza-primary">الخطوة 1 — معلومات المتجر</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="اسم المتجر بالعربي (إلزامي)">
              <Input value={nameAr} onChange={(e: any) => setNameAr(e.target.value)} placeholder="متجري" />
            </Field>
            <Field label="اسم المتجر بالإنجليزي (إلزامي)">
              <Input value={nameEn} onChange={(e: any) => setNameEn(e.target.value)} placeholder="My Store" />
            </Field>
            <Field label="وصف المتجر بالعربي (اختياري)">
              <textarea className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-kaffza-primary" value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} />
            </Field>
            <Field label="وصف المتجر بالإنجليزي (اختياري)">
              <textarea className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-kaffza-primary" value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} />
            </Field>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!step1Ok}>
              التالي
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="mt-6 p-6">
          <div className="text-sm font-extrabold text-kaffza-primary">الخطوة 2 — الرابط والهوية</div>
          <div className="mt-4 grid gap-3">
            <Field label="subdomain (رابط المتجر)">
              <Input
                value={subdomain}
                onChange={(e: any) => {
                  setSubdomain(e.target.value.toLowerCase().replace(/\s+/g, ''));
                  setSubdomainStatus('idle');
                }}
                placeholder="mystore"
              />
              <div className="mt-1 text-xs text-kaffza-text/70">المعاينة: <span className="font-bold text-kaffza-primary">{subdomain || '...'} .kaffza.com</span></div>
              <div className="mt-1 text-xs text-kaffza-text/60">فقط أحرف إنجليزية صغيرة وأرقام وشرطة (-) بدون مسافات</div>
            </Field>

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={checkSubdomain} disabled={subdomainStatus === 'checking' || !subdomainOk}>
                {subdomainStatus === 'checking' ? 'جارٍ التحقق...' : 'تحقق من التوفر'}
              </Button>
              <Button variant="secondary" onClick={() => setStep(1)}>
                رجوع
              </Button>
              <Button onClick={() => setStep(3)} disabled={subdomainStatus !== 'available'}>
                التالي
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {step === 3 ? (
        <div className="mt-6 space-y-4">
          <Card className="p-6">
            <div className="text-sm font-extrabold text-kaffza-primary">الخطوة 3 — اختيار الخطة</div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {PLANS.map((p) => (
                <PlanCard key={p.id} plan={p} selected={planId === p.id} onSelect={() => setPlanId(p.id)} />
              ))}
            </div>

            <div className="mt-6 flex flex-wrap justify-between gap-2">
              <Button variant="secondary" onClick={() => setStep(2)}>
                رجوع
              </Button>

              <div className="flex gap-2">
                <Button variant="secondary" onClick={createStore} disabled={loading}>
                  {loading ? 'جارٍ الإنشاء...' : 'ابدأ مجاناً لمدة 14 يوم'}
                </Button>
                <Button onClick={createStore} disabled={loading}>
                  {loading ? 'جارٍ الإنشاء...' : 'إنشاء المتجر'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </main>
  );
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      <Step active={step === 1} done={step > 1} title="1" label="معلومات المتجر" />
      <Step active={step === 2} done={step > 2} title="2" label="الرابط والهوية" />
      <Step active={step === 3} done={false} title="3" label="الخطة" />
    </div>
  );
}

function Step({ active, done, title, label }: any) {
  return (
    <div className={'rounded-xl border p-4 ' + (active ? 'border-kaffza-primary bg-white' : 'border-black/10 bg-white') }>
      <div className="flex items-center justify-between">
        <div className={'h-8 w-8 rounded-full flex items-center justify-center text-sm font-extrabold ' + (done ? 'bg-green-50 text-green-700' : active ? 'bg-kaffza-primary text-white' : 'bg-kaffza-bg text-kaffza-text') }>
          {done ? '✓' : title}
        </div>
        <div className="text-sm font-bold text-kaffza-text">{label}</div>
      </div>
    </div>
  );
}

function PlanCard({ plan, selected, onSelect }: any) {
  const border = selected ? 'border-kaffza-primary' : 'border-black/10';
  const bg = plan.popular ? 'bg-[#F5A623]/10' : 'bg-white';
  return (
    <button onClick={onSelect} className={`text-right rounded-2xl border ${border} ${bg} p-5 hover:border-kaffza-primary transition`}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-extrabold text-kaffza-primary">{plan.name}</div>
        {plan.popular ? <span className="rounded-full bg-[#F5A623] px-3 py-1 text-[11px] font-extrabold text-white">الأكثر شعبية</span> : null}
      </div>
      <div className="mt-2 text-2xl font-extrabold text-kaffza-info">{plan.price} ر.ع<span className="text-sm font-bold text-kaffza-text/70">/شهر</span></div>
      <div className="mt-2 text-xs text-kaffza-text/70">{plan.desc}</div>
      {selected ? <div className="mt-3 text-xs font-bold text-kaffza-primary">مختارة ✓</div> : <div className="mt-3 text-xs text-kaffza-text/60">اضغط للاختيار</div>}
    </button>
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
