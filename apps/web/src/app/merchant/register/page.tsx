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
  const [countryCode, setCountryCode] = useState('+968');
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
    const p = method === 'phone' ? (phone.startsWith('+') ? phone.trim() : `${countryCode}${phone.trim()}`) : phone.trim();
    return (
      name.trim().length >= 2 &&
      (method === 'phone' ? isValidE164Phone(p) : emailOk) &&
      password.trim().length >= 8 &&
      password.trim() === confirm.trim() &&
      acceptedPolicies &&
      (!turnstileEnabled || turnstileToken.trim().length > 0)
    );
  }, [
    name,
    method,
    phone,
    countryCode,
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
    const p = method === 'phone' ? (phone.startsWith('+') ? phone.trim() : `${countryCode}${phone.trim()}`) : phone.trim();
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
    const p = method === 'phone' ? (phone.startsWith('+') ? phone.trim() : `${countryCode}${phone.trim()}`) : phone.trim();
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
    const p = method === 'phone' ? (phone.startsWith('+') ? phone.trim() : `${countryCode}${phone.trim()}`) : phone.trim();
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
    <div className="min-h-screen w-full relative overflow-hidden bg-[#05050f] text-white selection:bg-blue-500/30">
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-center bg-cover bg-no-repeat mix-blend-screen"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2000&auto=format&fit=crop')" }}
      />
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,#1a1a2e_0%,transparent_80%)]" />

      <main dir="rtl" className="mx-auto max-w-lg px-6 py-12 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-muted-foreground text-xs">منطقة التاجر</div>
            <div className="text-primary text-2xl font-extrabold">تسجيل تاجر جديد</div>
          </div>
          <Link className="text-muted-foreground text-sm font-bold underline" href="/">
            الرئيسية
          </Link>
        </div>

        <Card className="mt-6 p-6 border-slate-800 bg-slate-900/50 backdrop-blur-md">
          <p className="text-slate-300 text-sm">
            يمكنك التسجيل عبر البريد أو الهاتف. قبل نشر المنتجات يجب ربط الاثنين معاً.
          </p>

          {msg ? (
            <div
              className={
                'mt-4 rounded-xl border p-3 text-sm ' +
                (msg.type === 'success'
                  ? 'border-green-200/20 bg-green-900/30 text-green-400'
                  : 'border-red-200/20 bg-red-900/30 text-red-400')
              }
            >
              {msg.text}
            </div>
          ) : null}

          {step === 'register' ? (
            <div className="mt-5 grid gap-3">
              <div className="grid gap-2">
                <span className="text-slate-200 text-sm font-bold">طريقة التسجيل</span>
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
                  className="bg-slate-800/80 border-slate-700 text-white placeholder-slate-400"
                  value={name}
                  onChange={(e: any) => setName(e.target.value)}
                  placeholder="محمد"
                />
              </Field>

              {method === 'email' ? (
                <Field label="البريد الإلكتروني">
                  <Input
                    className="bg-slate-800/80 border-slate-700 text-white placeholder-slate-400"
                    value={email}
                    onChange={(e: any) => setEmail(e.target.value)}
                    placeholder="merchant@example.com"
                  />
                </Field>
              ) : null}

              {method === 'phone' ? (
                <Field label="رقم الهاتف">
                  <div className="flex gap-2" dir="ltr">
                    <select 
                      className="w-[100px] rounded-xl border border-slate-700 bg-slate-800/80 px-2 py-2 text-sm text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 appearance-none"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                    >
                      <option value="+968">🇴🇲 +968</option>
                      <option value="+966">🇸🇦 +966</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+965">🇰🇼 +965</option>
                      <option value="+973">🇧🇭 +973</option>
                      <option value="+974">🇶🇦 +974</option>
                      <option value="+1">🇺🇸 +1</option>
                    </select>
                    <Input
                      className="flex-1 text-left bg-slate-800/80 border-slate-700 text-white placeholder-slate-400"
                      value={phone}
                      onChange={(e: any) => setPhone(e.target.value)}
                      placeholder="91234567"
                      dir="ltr"
                    />
                  </div>
                </Field>
              ) : null}

              <Field label="كلمة المرور">
                <Input
                  className="bg-slate-800/80 border-slate-700 text-white placeholder-slate-400"
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                  type="password"
                  placeholder="********"
                />
                <Hint>8 أحرف/أرقام على الأقل</Hint>
              </Field>

              <Field label="تأكيد كلمة المرور">
                <Input
                  className="bg-slate-800/80 border-slate-700 text-white placeholder-slate-400"
                  value={confirm}
                  onChange={(e: any) => setConfirm(e.target.value)}
                  type="password"
                  placeholder="********"
                />
              </Field>

              <label className="flex items-start gap-2 rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={acceptedPolicies}
                  onChange={(e) => setAcceptedPolicies(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-700 text-green-500 focus:ring-green-500 focus:ring-offset-slate-900"
                />
                <span className="text-slate-300">
                  أوافق على{' '}
                  <Link className="text-green-400 hover:text-green-300 font-bold underline" href="/legal/terms">
                    الشروط والأحكام
                  </Link>{' '}
                  و{' '}
                  <Link className="text-green-400 hover:text-green-300 font-bold underline" href="/legal/privacy">
                    سياسة الخصوصية
                  </Link>
                  .
                </span>
              </label>

              {turnstileEnabled ? (
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">
                  <TurnstileChallenge onToken={setTurnstileToken} />
                </div>
              ) : null}

              <Button
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(22,163,74,0.3)]"
                onClick={submit}
                disabled={!canSubmit || loading}
              >
                {loading ? 'جارٍ التسجيل...' : 'تسجيل'}
              </Button>

              <div className="text-sm text-slate-300 text-center mt-2">
                عندك حساب؟{' '}
                <Link className="text-green-400 hover:text-green-300 font-bold underline" href="/merchant/login">
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
              <div className="bg-slate-800/80 text-white rounded-xl p-3 text-xs border border-slate-700">
                <span className="font-bold">{method === 'email' ? 'البريد:' : 'الهاتف:'}</span>{' '}
                {method === 'email' ? email.trim() : phone.trim()}
              </div>

              <Field label="OTP (6 أرقام)">
                <Input
                  className="bg-slate-800/80 border-slate-700 text-white placeholder-slate-400 text-center tracking-widest text-lg"
                  value={otp}
                  onChange={(e: any) => setOtp(e.target.value)}
                  placeholder="123456"
                  inputMode="numeric"
                />
              </Field>

              <Button
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(22,163,74,0.3)]"
                onClick={verifyOtp}
                disabled={!canVerify || loading}
              >
                {loading ? 'جارٍ التحقق...' : 'تأكيد وتفعيل الحساب'}
              </Button>

              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <button
                  className="text-green-400 hover:text-green-300 font-bold underline disabled:opacity-50"
                  onClick={resendOtp}
                  disabled={loading}
                >
                  إعادة إرسال OTP
                </button>
                <button
                  className="text-slate-400 hover:text-slate-300 text-xs font-bold underline"
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

        <div className="text-slate-400 mt-6 flex flex-wrap gap-3 text-xs justify-center">
          <Link className="hover:text-slate-200 underline" href="/legal/terms">
            الشروط
          </Link>
          <Link className="hover:text-slate-200 underline" href="/legal/privacy">
            الخصوصية
          </Link>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <label className="grid gap-1">
      <span className="text-slate-200 text-sm font-bold">{label}</span>
      {children}
    </label>
  );
}

function Hint({ children }: any) {
  return <span className="text-slate-400 text-xs">{children}</span>;
}

function TabButton({ active, onClick, children }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex-1 rounded-xl px-4 py-2 text-sm font-extrabold transition ' +
        (active ? 'bg-green-600 text-white shadow-[0_0_10px_rgba(22,163,74,0.3)]' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700')
      }
    >
      {children}
    </button>
  );
}
