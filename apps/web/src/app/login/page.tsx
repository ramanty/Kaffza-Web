'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { api } from '../../lib/api';
import { getAccessTokenFromCookies } from '../../lib/auth';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

const OMAN_PHONE_RE = /^\+968[0-9]{8}$/;

function LoginPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/';
  const phoneFromQuery = sp.get('phone') || '';

  const [tab, setTab] = useState<'password' | 'otp'>('password');

  // password login
  const [phone, setPhone] = useState(phoneFromQuery);
  const [password, setPassword] = useState('');

  // otp login
  const [otpPhone, setOtpPhone] = useState(phoneFromQuery);
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'code'>('phone');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    const token = getAccessTokenFromCookies();
    if (!token) return;
    (async () => {
      try {
        const me = await api.get('/auth/me', { headers: { 'x-client': 'web', Authorization: `Bearer ${token}` } });
        const role = me?.data?.data?.role;
        if (handleRoleRedirect(role)) return;
        router.replace(next);
      } catch {
        router.replace(next);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const phoneOk = useMemo(() => OMAN_PHONE_RE.test(phone.trim()), [phone]);
  const passOk = useMemo(() => password.trim().length >= 8, [password]);

  const otpPhoneOk = useMemo(() => OMAN_PHONE_RE.test(otpPhone.trim()), [otpPhone]);
  const otpOk = useMemo(() => /^[0-9]{6}$/.test(otp.trim()), [otp]);

  const setError = (text: string) => setMsg({ type: 'error', text });
  const setSuccess = (text: string) => setMsg({ type: 'success', text });

const handleRoleRedirect = (role: string) => {
  const r = String(role || '').toLowerCase();
  if (r === 'merchant') {
    router.replace('/merchant/login');
    return true;
  }
  if (r === 'admin') {
    router.replace(next.startsWith('/admin') ? next : '/admin');
    return true;
  }
  return false;
};


  const doPasswordLogin = async () => {
    setMsg(null);
    const p = phone.trim();
    const pw = password.trim();

    if (!OMAN_PHONE_RE.test(p)) return setError('رقم الهاتف لازم يكون بصيغة عُمانية صحيحة: +968XXXXXXXX');
    if (pw.length < 8) return setError('كلمة المرور لازم تكون 8 أحرف/أرقام على الأقل');

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { phone: p, password: pw }, { headers: { 'x-client': 'web' } });
      const token = res?.data?.data?.tokens?.accessToken;
      if (!token) throw new Error('لم يتم استلام access token');

      document.cookie = `kaffza_access=${encodeURIComponent(token)}; Path=/; SameSite=Lax`;
      setSuccess('تم تسجيل الدخول بنجاح');
      router.replace(next);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async () => {
    setMsg(null);
    const p = otpPhone.trim();
    if (!OMAN_PHONE_RE.test(p)) return setError('رقم الهاتف لازم يكون بصيغة عُمانية صحيحة: +968XXXXXXXX');

    setLoading(true);
    try {
      await api.post('/auth/otp/request', { phone: p }, { headers: { 'x-client': 'web' } });
      setSuccess('تم إرسال OTP');
      setOtpStep('code');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'تعذر إرسال OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setMsg(null);
    const p = otpPhone.trim();
    const code = otp.trim();

    if (!OMAN_PHONE_RE.test(p)) return setError('رقم الهاتف غير صحيح');
    if (!/^[0-9]{6}$/.test(code)) return setError('الرمز يجب أن يكون 6 أرقام');

    setLoading(true);
    try {
      const res = await api.post('/auth/otp/verify', { phone: p, otp: code }, { headers: { 'x-client': 'web' } });
      const token = res?.data?.data?.tokens?.accessToken;
      if (!token) throw new Error('لم يتم استلام access token');

      document.cookie = `kaffza_access=${encodeURIComponent(token)}; Path=/; SameSite=Lax`;
      setSuccess('تم تسجيل الدخول بنجاح');
      router.replace(next);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'فشل التحقق من الرمز');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir="rtl" className="mx-auto max-w-lg px-6 py-12">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-extrabold text-kaffza-primary">تسجيل الدخول</div>
        <Link className="text-sm font-bold text-kaffza-text/70 underline" href="/">
          الرئيسية
        </Link>
      </div>

      <Card className="mt-6 p-6">
        <div className="flex gap-2">
          <TabButton active={tab === 'password'} onClick={() => setTab('password')}>
            كلمة مرور
          </TabButton>
          <TabButton active={tab === 'otp'} onClick={() => setTab('otp')}>
            OTP
          </TabButton>
        </div>

        {msg ? (
          <div
            className={
              'mt-4 rounded-xl border p-3 text-sm ' +
              (msg.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700')
            }
          >
            {msg.text}
          </div>
        ) : null}

        {tab === 'password' ? (
          <div className="mt-5 grid gap-3">
            <Field label="رقم الهاتف">
              <Input value={phone} onChange={(e: any) => setPhone(e.target.value)} placeholder="+96891234567" />
              <Hint>صيغة عمانية: +968XXXXXXXX</Hint>
            </Field>

            <Field label="كلمة المرور">
              <Input value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="********" type="password" />
              <Hint>8 أحرف/أرقام على الأقل</Hint>
            </Field>

            <Button onClick={doPasswordLogin} disabled={loading || !phoneOk || !passOk}>
              {loading ? 'جارٍ الدخول...' : 'دخول'}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <Link className="font-bold text-kaffza-primary underline" href={`/register?next=${encodeURIComponent(next)}`}>
                إنشاء حساب
              </Link>
              <Link className="text-xs font-bold text-kaffza-text/70 underline" href={`/forgot-password?next=${encodeURIComponent(next)}`}>
                نسيت كلمة المرور؟
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            {otpStep === 'phone' ? (
              <>
                <Field label="رقم الهاتف">
                  <Input value={otpPhone} onChange={(e: any) => setOtpPhone(e.target.value)} placeholder="+96891234567" />
                  <Hint>صيغة عمانية: +968XXXXXXXX</Hint>
                </Field>

                <Button onClick={requestOtp} disabled={loading || !otpPhoneOk}>
                  {loading ? 'جارٍ الإرسال...' : 'إرسال OTP'}
                </Button>

                <div className="text-sm">
                  عندك حساب؟{' '}
                  <Link className="font-bold text-kaffza-primary underline" href={`/register?next=${encodeURIComponent(next)}`}>
                    إنشاء حساب
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-xl bg-kaffza-bg p-3 text-xs text-kaffza-text">
                  <span className="font-bold">الهاتف:</span> {otpPhone.trim()}
                </div>

                <Field label="OTP (6 أرقام)">
                  <Input value={otp} onChange={(e: any) => setOtp(e.target.value)} placeholder="123456" inputMode="numeric" />
                </Field>

                <Button onClick={verifyOtp} disabled={loading || !otpOk}>
                  {loading ? 'جارٍ التحقق...' : 'تأكيد'}
                </Button>

                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <button className="font-bold text-kaffza-primary underline disabled:opacity-50" onClick={requestOtp} disabled={loading || !otpPhoneOk}>
                    إعادة إرسال OTP
                  </button>
                  <button
                    className="text-xs font-bold text-kaffza-text/70 underline"
                    onClick={() => {
                      setOtp('');
                      setOtpStep('phone');
                      setMsg(null);
                    }}
                  >
                    تغيير الرقم
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      <div className="mt-6 flex flex-wrap gap-3 text-xs text-kaffza-text">
        <Link className="underline" href="/legal/terms">الشروط</Link>
        <Link className="underline" href="/legal/privacy">الخصوصية</Link>
      </div>
    </main>
  );
}

function TabButton({ active, onClick, children }: any) {
  return (
    <button
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

function Field({ label, children }: any) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-bold text-kaffza-text">{label}</span>
      {children}
    </label>
  );
}

function Hint({ children }: any) {
  return <span className="text-xs text-kaffza-text/60">{children}</span>;
}

export default function LoginPage() { return <Suspense><LoginPageInner /></Suspense>; }
