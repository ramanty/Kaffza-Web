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
import { TurnstileChallenge } from '../../components/TurnstileChallenge';
import { isValidE164Phone } from '../../lib/phone';
import { extractApiErrorMessage } from '../../lib/api-error';

type RegisterMethod = 'phone' | 'email';

function normalizeRegisterError(text: string) {
  const raw = String(text || '');
  if (raw.includes('already exists') || raw.includes('مستخدم موجود')) {
    return 'يوجد حساب بهذه البيانات بالفعل. جرّب تسجيل الدخول أو استعادة كلمة المرور.';
  }
  if (raw.includes('Too many requests') || raw.includes('محاولات كثيرة')) {
    return 'محاولات كثيرة خلال وقت قصير. انتظر دقيقة ثم أعد المحاولة.';
  }
  if (raw.includes('OTP') && raw.includes('expired')) {
    return 'انتهت صلاحية الرمز. اطلب OTP جديداً لإكمال التفعيل.';
  }
  return raw;
}

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
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<'error' | 'success'>('error');

  const emailOk = useMemo(() => !email.trim() || /.+@.+\..+/.test(email.trim()), [email]);

  const canSubmit = useMemo(() => {
    return (
      name.trim().length >= 2 &&
      (method === 'email' || isValidE164Phone(phone)) &&
      (method === 'phone' || !!email.trim()) &&
      emailOk &&
      password.trim().length >= 8 &&
      acceptedPolicies &&
      (!turnstileEnabled || turnstileToken.trim().length > 0)
    );
  }, [
    name,
    phone,
    email,
    emailOk,
    method,
    password,
    acceptedPolicies,
    turnstileEnabled,
    turnstileToken,
  ]);

  const canVerify = useMemo(() => /^[0-9]{6}$/.test(otp.trim()), [otp]);

  const submit = async () => {
    setMsg(null);
    setMsgType('error');
    const n = name.trim();
    const p = phone.trim();
    const e = email.trim();
    const pw = password.trim();

    if (n.length < 2) return setMsg('الاسم لازم يكون حرفين على الأقل');
    if (method === 'phone' && !isValidE164Phone(p)) return setMsg('رقم الهاتف غير صحيح');
    if (method === 'email' && !e) return setMsg('البريد الإلكتروني مطلوب لهذه الطريقة');
    if (!emailOk) return setMsg('البريد الإلكتروني غير صحيح');
    if (pw.length < 8) return setMsg('كلمة المرور لازم تكون 8 أحرف/أرقام على الأقل');
    if (!acceptedPolicies) return setMsg('لازم توافق على الشروط وسياسة الخصوصية قبل المتابعة');
    if (turnstileEnabled && !turnstileToken.trim()) return setMsg('أكمل تحقق لست روبوت أولاً');

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
          turnstileToken: turnstileEnabled ? turnstileToken : undefined,
        },
        { headers: { 'x-client': 'web' } }
      );
      setStep('verify');
      setMsgType('success');
      setMsg(
        method === 'email'
          ? 'تم إرسال OTP للبريد الإلكتروني. أدخل الرمز خلال دقائق لتفعيل الحساب.'
          : 'تم إرسال OTP للهاتف. أدخل الرمز خلال دقائق لتفعيل الحساب.'
      );
    } catch (e: any) {
      setMsg(normalizeRegisterError(extractApiErrorMessage(e, 'فشل إنشاء الحساب. حاول مجدداً.')));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setMsg(null);
    setMsgType('error');
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
      setMsg(
        normalizeRegisterError(
          extractApiErrorMessage(e, 'فشل التحقق من الرمز. تحقق من الرمز ثم حاول مجدداً.')
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setMsg(null);
    setMsgType('error');
    const p = phone.trim();
    const e = email.trim();
    if (method === 'phone' && !isValidE164Phone(p)) return setMsg('رقم الهاتف غير صحيح');
    if (method === 'email' && !e) return setMsg('البريد الإلكتروني غير صحيح');
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
      setMsgType('success');
      setMsg('تمت إعادة إرسال OTP. أدخل آخر رمز وصل لك لإكمال التفعيل.');
    } catch (e: any) {
      setMsg(
        normalizeRegisterError(extractApiErrorMessage(e, 'تعذر إعادة إرسال OTP. حاول مرة أخرى.'))
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir="rtl" className="mx-auto max-w-lg px-6 py-12">
      <div className="flex items-center justify-between">
        <div className="text-primary text-2xl font-extrabold">إنشاء حساب</div>
        <Link className="text-muted-foreground text-sm font-bold underline" href="/">
          الرئيسية
        </Link>
      </div>

      <Card className="mt-6 p-6">
        <div className="border-kaffza-primary/20 bg-primary/5 text-foreground/80 mb-4 rounded-xl border p-3 text-xs">
          <span className="text-primary font-bold">تسجيل سريع وآمن:</span> لن نستخدم بياناتك
          إلا لإدارة حسابك وطلباتك.
        </div>
        <div className="text-foreground/80 text-sm">
          اختر طريقة التسجيل المناسبة. سيتم إرسال OTP حسب الطريقة التي تختارها.
        </div>

        {msg ? (
          <div
            className={
              'mt-4 rounded-xl border p-3 text-sm ' +
              (msgType === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700')
            }
          >
            {msg}
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
              <Hint>كما سيظهر في فاتورة الطلب</Hint>
            </Field>

            {method === 'email' ? (
              <Field label="البريد الإلكتروني">
                <Input
                  value={email}
                  onChange={(e: any) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
                <Hint>سنرسل رمز التفعيل إلى هذا البريد</Hint>
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
              {loading ? 'جارٍ الإنشاء...' : 'إنشاء حساب وتأكيد الهوية'}
            </Button>

            <div className="text-sm">
              عندك حساب؟{' '}
              <Link
                className="text-primary font-bold underline"
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
              {loading ? 'جارٍ التحقق...' : 'تأكيد الرمز وتفعيل الحساب'}
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
        (active ? 'bg-primary text-white' : 'bg-background text-foreground hover:bg-black/5')
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
