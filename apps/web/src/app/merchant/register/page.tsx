'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { api } from '../../../lib/api';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { PhoneInput } from '../../../components/PhoneInput';
import { SocialAuthButtons } from '../../../components/SocialAuthButtons';
import { TurnstileChallenge } from '../../../components/TurnstileChallenge';
import { isValidE164Phone } from '../../../lib/phone';
import { extractApiErrorMessage } from '../../../lib/api-error';

export default function MerchantRegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const emailOk = useMemo(() => /.+@.+\..+/.test(email.trim()), [email]);
  const canSubmit = useMemo(() => {
    return (
      name.trim().length >= 2 &&
      (method === 'phone' ? isValidE164Phone(phone) : emailOk) &&
      password.trim().length >= 8 &&
      password.trim() === confirm.trim() &&
      acceptedPolicies &&
      (!turnstileEnabled || turnstileToken.trim().length > 0)
    );
  }, [
    name,
    method,
    phone,
    password,
    confirm,
    emailOk,
    acceptedPolicies,
    turnstileEnabled,
    turnstileToken,
  ]);
  const canVerify = useMemo(() => /^[0-9]{6}$/.test(otp.trim()), [otp]);

  const submit = async () => {
    setMsg(null);
    const n = name.trim();
    const p = phone.trim();
    const e = email.trim();
    const pw = password.trim();

    if (n.length < 2) return setMsg({ type: 'error', text: 'الاسم لازم يكون حرفين على الأقل' });
    if (method === 'phone' && !isValidE164Phone(p)) {
      return setMsg({ type: 'error', text: 'رقم الهاتف غير صحيح' });
    }
    if (method === 'email' && !emailOk) {
      return setMsg({ type: 'error', text: 'البريد الإلكتروني غير صحيح' });
    }
    if (pw.length < 8)
      return setMsg({ type: 'error', text: 'كلمة المرور لازم تكون 8 أحرف/أرقام على الأقل' });
    if (pw !== confirm.trim())
      return setMsg({ type: 'error', text: 'تأكيد كلمة المرور غير مطابق' });
    if (!acceptedPolicies) {
      return setMsg({ type: 'error', text: 'لازم توافق على الشروط وسياسة الخصوصية قبل المتابعة' });
    }
    if (turnstileEnabled && !turnstileToken.trim()) {
      return setMsg({ type: 'error', text: 'أكمل تحقق لست روبوت أولاً' });
    }

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
          role: 'merchant',
          locale: 'ar',
          turnstileToken: turnstileEnabled ? turnstileToken : undefined,
        },
        { headers: { 'x-client': 'web' } }
      );

      setStep('verify');
      setMsg({ type: 'success', text: 'تم إرسال OTP، أدخل الرمز لتفعيل حساب التاجر' });
    } catch (e: any) {
      setMsg({ type: 'error', text: extractApiErrorMessage(e, 'فشل إنشاء الحساب') });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setMsg(null);
    const p = phone.trim();
    const code = otp.trim();
    if (method === 'phone' && !isValidE164Phone(p)) {
      return setMsg({ type: 'error', text: 'رقم الهاتف غير صحيح' });
    }
    if (method === 'email' && !email.trim()) {
      return setMsg({ type: 'error', text: 'البريد الإلكتروني غير صحيح' });
    }
    if (!/^[0-9]{6}$/.test(code))
      return setMsg({ type: 'error', text: 'الرمز يجب أن يكون 6 أرقام' });

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
      router.replace('/onboarding');
    } catch (e: any) {
      setMsg({ type: 'error', text: extractApiErrorMessage(e, 'فشل التحقق من الرمز') });
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setMsg(null);
    const p = phone.trim();
    const e = email.trim();
    if (method === 'phone' && !isValidE164Phone(p)) {
      return setMsg({ type: 'error', text: 'رقم الهاتف غير صحيح' });
    }
    if (method === 'email' && !e) {
      return setMsg({ type: 'error', text: 'البريد الإلكتروني غير صحيح' });
    }
    setLoading(true);
    try {
      await api.post(
        '/auth/otp/resend',
        {
          method,
          phone: method === 'phone' ? p : undefined,
          email: method === 'email' ? e : undefined,
        },
        { headers: { 'x-client': 'web' } }
      );
      setMsg({ type: 'success', text: 'تمت إعادة إرسال OTP' });
    } catch (e: any) {
      setMsg({ type: 'error', text: extractApiErrorMessage(e, 'تعذر إعادة إرسال OTP') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir="rtl" className="mx-auto max-w-lg px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-muted-foreground text-xs">منطقة التاجر</div>
          <div className="text-primary text-2xl font-extrabold">تسجيل تاجر جديد</div>
        </div>
        <Link className="text-muted-foreground text-sm font-bold underline" href="/">
          الرئيسية
        </Link>
      </div>

      <Card className="mt-6 p-6">
        <p className="text-foreground/80 text-sm">
          يمكنك التسجيل عبر البريد أو الهاتف. قبل نشر المنتجات يجب ربط الاثنين معاً.
        </p>

        {msg ? (
          <div
            className={
              'mt-4 rounded-xl border p-3 text-sm ' +
              (msg.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700')
            }
          >
            {msg.text}
          </div>
        ) : null}

        {step === 'register' ? (
          <div className="mt-5 grid gap-3">
            <div className="grid gap-2">
              <span className="text-foreground text-sm font-bold">طريقة التسجيل</span>
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
                  placeholder="merchant@example.com"
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
                type="password"
                placeholder="********"
              />
              <Hint>8 أحرف/أرقام على الأقل</Hint>
            </Field>

            <Field label="تأكيد كلمة المرور">
              <Input
                value={confirm}
                onChange={(e: any) => setConfirm(e.target.value)}
                type="password"
                placeholder="********"
              />
            </Field>

            <label className="flex items-start gap-2 rounded-xl border border-border bg-card text-card-foreground p-3 text-sm">
              <input
                type="checkbox"
                checked={acceptedPolicies}
                onChange={(e) => setAcceptedPolicies(e.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span className="text-foreground/85">
                أوافق على{' '}
                <Link className="text-primary font-bold underline" href="/legal/terms">
                  الشروط والأحكام
                </Link>{' '}
                و{' '}
                <Link className="text-primary font-bold underline" href="/legal/privacy">
                  سياسة الخصوصية
                </Link>
                .
              </span>
            </label>

            {turnstileEnabled ? (
              <div className="rounded-xl border border-border bg-card text-card-foreground p-3">
                <TurnstileChallenge onToken={setTurnstileToken} />
              </div>
            ) : null}

            <Button
              className="w-full !text-white"
              onClick={submit}
              disabled={!canSubmit || loading}
            >
              {loading ? 'جارٍ التسجيل...' : 'تسجيل'}
            </Button>

            <div className="text-sm">
              عندك حساب؟{' '}
              <Link className="text-primary font-bold underline" href="/merchant/login">
                تسجيل الدخول
              </Link>
            </div>
            <SocialAuthButtons
              locale="ar"
              onError={(text) => setMsg({ type: 'error', text })}
              onAuthSuccess={(token) => {
                document.cookie = `kaffza_access=${encodeURIComponent(token)}; Path=/; SameSite=Lax`;
                router.replace('/onboarding');
              }}
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            <div className="bg-background text-foreground rounded-xl p-3 text-xs">
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
                className="text-primary font-bold underline disabled:opacity-50"
                onClick={resendOtp}
                disabled={loading}
              >
                إعادة إرسال OTP
              </button>
              <button
                className="text-muted-foreground text-xs font-bold underline"
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

      <div className="text-foreground mt-6 flex flex-wrap gap-3 text-xs">
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
      <span className="text-foreground text-sm font-bold">{label}</span>
      {children}
    </label>
  );
}

function Hint({ children }: any) {
  return <span className="text-muted-foreground text-xs">{children}</span>;
}

function TabButton({ active, onClick, children }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex-1 rounded-xl px-4 py-2 text-sm font-extrabold transition ' +
        (active ? 'bg-[#16A34A] text-white' : 'bg-[#1B3A6B] text-white hover:bg-[#17345F]')
      }
    >
      {children}
    </button>
  );
}
