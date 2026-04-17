'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { api } from '../../lib/api';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { PhoneInput } from '../../components/PhoneInput';
import { SocialAuthButtons } from '../../components/SocialAuthButtons';
import { isValidE164Phone } from '../../lib/phone';
import { extractApiErrorMessage } from '../../lib/api-error';

type RegisterMethod = 'phone' | 'email';

function RegisterPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/';

  const [method, setMethod] = useState<RegisterMethod>('phone');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const emailOk = useMemo(() => !email.trim() || /.+@.+\..+/.test(email.trim()), [email]);

  const canSubmit = useMemo(() => {
    return (
      name.trim().length >= 2 &&
      (method === 'email' || isValidE164Phone(phone)) &&
      (method === 'phone' || !!email.trim()) &&
      emailOk &&
      password.trim().length >= 8
    );
  }, [name, phone, email, emailOk, method, password]);

  const canVerify = useMemo(() => /^[0-9]{6}$/.test(otp.trim()), [otp]);

  const submit = async () => {
    setMsg(null);
    const n = name.trim();
    const p = phone.trim();
    const e = email.trim();
    const pw = password.trim();

    if (n.length < 2) return setMsg('الاسم لازم يكون حرفين على الأقل');
    if (method === 'phone' && !isValidE164Phone(p)) return setMsg('رقم الهاتف غير صحيح');
    if (method === 'email' && !e) return setMsg('البريد الإلكتروني مطلوب لهذه الطريقة');
    if (!emailOk) return setMsg('البريد الإلكتروني غير صحيح');
    if (pw.length < 8) return setMsg('كلمة المرور لازم تكون 8 أحرف/أرقام على الأقل');

    setLoading(true);
    try {
      await api.post(
        '/auth/register',
        {
          name: n,
          method,
          phone: method === 'phone' ? p : undefined,
          email: method === 'email' ? e : e || undefined,
          password: pw,
          role: 'customer',
          locale: 'ar',
        },
        { headers: { 'x-client': 'web' } }
      );
      setStep('verify');
      setMsg('تم إرسال OTP، أدخل الرمز لتفعيل الحساب');
    } catch (e: any) {
      setMsg(extractApiErrorMessage(e, 'فشل إنشاء الحساب'));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setMsg(null);
    const p = phone.trim();
    const code = otp.trim();
    if (method === 'phone' && !isValidE164Phone(p)) return setMsg('رقم الهاتف غير صحيح');
    if (method === 'email' && !email.trim()) return setMsg('البريد الإلكتروني غير صحيح');
    if (!/^[0-9]{6}$/.test(code)) return setMsg('الرمز يجب أن يكون 6 أرقام');

    setLoading(true);
    try {
      const res = await api.post(
        '/auth/otp/verify',
        {
          method,
          phone: method === 'phone' ? p : undefined,
          email: method === 'email' ? email.trim() : undefined,
          otp: code,
        },
        { headers: { 'x-client': 'web' } }
      );
      const token = res?.data?.data?.tokens?.accessToken;
      if (!token) throw new Error('لم يتم استلام access token');

      document.cookie = `kaffza_access=${encodeURIComponent(token)}; Path=/; SameSite=Lax`;
      router.replace(next);
    } catch (e: any) {
      setMsg(extractApiErrorMessage(e, 'فشل التحقق من الرمز'));
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setMsg(null);
    const p = phone.trim();
    if (method === 'phone' && !isValidE164Phone(p)) return setMsg('رقم الهاتف غير صحيح');
    if (method === 'email')
      return setMsg('إعادة إرسال OTP عبر البريد ستكون متاحة في صفحة تسجيل الدخول قريباً');
    setLoading(true);
    try {
      await api.post('/auth/otp/resend', { phone: p }, { headers: { 'x-client': 'web' } });
      setMsg('تمت إعادة إرسال OTP');
    } catch (e: any) {
      setMsg(extractApiErrorMessage(e, 'تعذر إعادة إرسال OTP'));
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
          اختر طريقة التسجيل المناسبة. سيتم إرسال OTP للهاتف لتفعيل الحساب.
        </div>

        {msg ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {msg}
          </div>
        ) : null}

        {step === 'register' ? (
          <div className="mt-5 grid gap-3">
            <div className="grid gap-2">
              <span className="text-kaffza-text text-sm font-bold">طريقة التسجيل</span>
              <div className="flex gap-2">
                <TabButton active={method === 'phone'} onClick={() => setMethod('phone')}>
                  برقم الهاتف
                </TabButton>
                <TabButton active={method === 'email'} onClick={() => setMethod('email')}>
                  بالبريد الإلكتروني
                </TabButton>
              </div>
            </div>

            <Field label="الاسم الكامل">
              <Input
                value={name}
                onChange={(e: any) => setName(e.target.value)}
                placeholder="محمد"
              />
            </Field>

            {method === 'email' ? (
              <Field label="البريد الإلكتروني">
                <Input
                  value={email}
                  onChange={(e: any) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </Field>
            ) : null}

            {method === 'phone' ? (
              <Field label="رقم الهاتف">
                <PhoneInput value={phone} onChange={setPhone} />
                <Hint>اختر الدولة ثم اكتب رقم الهاتف بدون رمز الدولة</Hint>
              </Field>
            ) : null}

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
              className="w-full !text-white"
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
            <SocialAuthButtons
              locale="ar"
              onError={(text) => setMsg(text)}
              onAuthSuccess={(token) => {
                document.cookie = `kaffza_access=${encodeURIComponent(token)}; Path=/; SameSite=Lax`;
                router.replace(next);
              }}
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            <div className="bg-kaffza-bg text-kaffza-text rounded-xl p-3 text-xs">
              <span className="font-bold">{method === 'email' ? 'البريد:' : 'الهاتف:'}</span>{' '}
              {method === 'email' ? email.trim() : phone.trim()}
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
              className="w-full !text-white"
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
                onClick={() => {
                  setStep('register');
                  setOtp('');
                }}
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

function TabButton({ active, onClick, children }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex-1 rounded-xl px-4 py-2 text-sm font-extrabold transition ' +
        (active ? 'bg-kaffza-primary text-white' : 'bg-kaffza-bg text-kaffza-text hover:bg-black/5')
      }
    >
      {children}
    </button>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterPageInner />
    </Suspense>
  );
}
