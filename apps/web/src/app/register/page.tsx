'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { api } from '../../lib/api';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

const OMAN_PHONE_RE = /^\+968[0-9]{8}$/;

function normalizeOmanPhone(raw: string) {
  const compact = raw.trim().replace(/\s+/g, '');
  if (/^[0-9]{8}$/.test(compact)) return `+968${compact}`;
  if (/^968[0-9]{8}$/.test(compact)) return `+${compact}`;
  return compact;
}

function RegisterPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      name.trim().length >= 2 &&
      OMAN_PHONE_RE.test(normalizeOmanPhone(phone)) &&
      password.trim().length >= 8
    );
  }, [name, phone, password]);

  const canVerify = useMemo(() => /^[0-9]{6}$/.test(otp.trim()), [otp]);

  const submit = async () => {
    setMsg(null);
    const n = name.trim();
    const p = normalizeOmanPhone(phone);
    const pw = password.trim();

    if (n.length < 2) return setMsg('الاسم لازم يكون حرفين على الأقل');
    if (!OMAN_PHONE_RE.test(p))
      return setMsg('رقم الهاتف لازم يكون بصيغة عُمانية صحيحة: +968XXXXXXXX');
    if (pw.length < 8) return setMsg('كلمة المرور لازم تكون 8 أحرف/أرقام على الأقل');

    setLoading(true);
    try {
      await api.post(
        '/auth/register',
        { name: n, phone: p, password: pw, role: 'customer', locale: 'ar' },
        { headers: { 'x-client': 'web' } }
      );
      setStep('verify');
      setMsg('تم إرسال OTP، أدخل الرمز لتفعيل الحساب');
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'فشل إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setMsg(null);
    const p = normalizeOmanPhone(phone);
    const code = otp.trim();
    if (!OMAN_PHONE_RE.test(p)) return setMsg('رقم الهاتف غير صحيح');
    if (!/^[0-9]{6}$/.test(code)) return setMsg('الرمز يجب أن يكون 6 أرقام');

    setLoading(true);
    try {
      const res = await api.post(
        '/auth/otp/verify',
        { phone: p, otp: code },
        { headers: { 'x-client': 'web' } }
      );
      const token = res?.data?.data?.tokens?.accessToken;
      if (!token) throw new Error('لم يتم استلام access token');

      document.cookie = `kaffza_access=${encodeURIComponent(token)}; Path=/; SameSite=Lax`;
      router.replace(next);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'فشل التحقق من الرمز');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setMsg(null);
    const p = normalizeOmanPhone(phone);
    if (!OMAN_PHONE_RE.test(p)) return setMsg('رقم الهاتف غير صحيح');
    setLoading(true);
    try {
      await api.post('/auth/otp/resend', { phone: p }, { headers: { 'x-client': 'web' } });
      setMsg('تمت إعادة إرسال OTP');
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'تعذر إعادة إرسال OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir="rtl" className="mx-auto max-w-lg px-6 py-12">
      <div className="flex items-center justify-between">
        <div className="text-kaffza-primary text-2xl font-extrabold">إنشاء حساب</div>
        <Link className="text-kaffza-text/70 text-sm font-bold underline" href="/">
          الرئيسية
        </Link>
      </div>

      <Card className="mt-6 p-6">
        <div className="text-kaffza-text/80 text-sm">
          سجّل كعميل جديد. سيتم إرسال OTP لتفعيل حسابك.
        </div>

        {msg ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {msg}
          </div>
        ) : null}

        {step === 'register' ? (
          <div className="mt-5 grid gap-3">
            <Field label="الاسم الكامل">
              <Input
                value={name}
                onChange={(e: any) => setName(e.target.value)}
                placeholder="محمد"
              />
            </Field>

            <Field label="رقم الهاتف">
              <Input
                value={phone}
                onChange={(e: any) => setPhone(e.target.value)}
                placeholder="+96891234567"
              />
              <Hint>صيغة عمانية: +968XXXXXXXX</Hint>
            </Field>

            <Field label="كلمة المرور">
              <Input
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                placeholder="********"
                type="password"
              />
              <Hint>8 أحرف/أرقام على الأقل</Hint>
            </Field>

            <Button
              className="bg-kaffza-primary w-full text-white"
              onClick={submit}
              disabled={!canSubmit || loading}
            >
              {loading ? 'جارٍ الإنشاء...' : 'إنشاء حساب'}
            </Button>

            <div className="text-sm">
              عندك حساب؟{' '}
              <Link
                className="text-kaffza-primary font-bold underline"
                href={`/login?next=${encodeURIComponent(next)}`}
              >
                تسجيل الدخول
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            <div className="bg-kaffza-bg text-kaffza-text rounded-xl p-3 text-xs">
              <span className="font-bold">الهاتف:</span> {normalizeOmanPhone(phone)}
            </div>

            <Field label="OTP (6 أرقام)">
              <Input
                value={otp}
                onChange={(e: any) => setOtp(e.target.value)}
                placeholder="123456"
                inputMode="numeric"
              />
            </Field>

            <Button
              className="bg-kaffza-primary w-full text-white"
              onClick={verifyOtp}
              disabled={!canVerify || loading}
            >
              {loading ? 'جارٍ التحقق...' : 'تأكيد وتفعيل الحساب'}
            </Button>

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <button
                className="text-kaffza-primary font-bold underline disabled:opacity-50"
                onClick={resendOtp}
                disabled={loading}
              >
                إعادة إرسال OTP
              </button>
              <button
                className="text-kaffza-text/70 text-xs font-bold underline"
                onClick={() => setStep('register')}
              >
                تعديل البيانات
              </button>
            </div>
          </div>
        )}
      </Card>

      <div className="text-kaffza-text mt-6 flex flex-wrap gap-3 text-xs">
        <Link className="underline" href="/legal/terms">
          الشروط
        </Link>
        <Link className="underline" href="/legal/privacy">
          الخصوصية
        </Link>
      </div>
    </main>
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

function Hint({ children }: any) {
  return <span className="text-kaffza-text/60 text-xs">{children}</span>;
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterPageInner />
    </Suspense>
  );
}
