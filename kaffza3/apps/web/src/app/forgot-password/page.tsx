'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { api } from '../../lib/api';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

const OMAN_PHONE_RE = /^\+968[0-9]{8}$/;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/';

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState(sp.get('phone') || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const phoneOk = useMemo(() => OMAN_PHONE_RE.test(phone.trim()), [phone]);
  const otpOk = useMemo(() => /^[0-9]{6}$/.test(otp.trim()), [otp]);
  const passOk = useMemo(() => newPassword.trim().length >= 8, [newPassword]);

  const setError = (text: string) => setMsg({ type: 'error', text });
  const setSuccess = (text: string) => setMsg({ type: 'success', text });

  const requestOtp = async () => {
    setMsg(null);
    const p = phone.trim();
    if (!OMAN_PHONE_RE.test(p)) return setError('رقم الهاتف لازم يكون بصيغة عُمانية صحيحة: +968XXXXXXXX');

    setLoading(true);
    try {
      await api.post('/auth/otp/request', { phone: p }, { headers: { 'x-client': 'web' } });
      setSuccess('تم إرسال رمز التحقق');
      setStep(2);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'تعذر إرسال الرمز');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setMsg(null);
    const p = phone.trim();
    const code = otp.trim();
    if (!OMAN_PHONE_RE.test(p)) return setError('رقم الهاتف غير صحيح');
    if (!/^[0-9]{6}$/.test(code)) return setError('الرمز يجب أن يكون 6 أرقام');

    setLoading(true);
    try {
      // Use x-purpose=reset to verify WITHOUT consuming OTP
      await api.post('/auth/otp/verify', { phone: p, otp: code }, { headers: { 'x-client': 'web', 'x-purpose': 'reset' } });
      setSuccess('تم التحقق من الرمز');
      setStep(3);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'فشل التحقق من الرمز');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setMsg(null);
    const p = phone.trim();
    const code = otp.trim();
    const pw = newPassword.trim();

    if (!OMAN_PHONE_RE.test(p)) return setError('رقم الهاتف غير صحيح');
    if (!/^[0-9]{6}$/.test(code)) return setError('الرمز يجب أن يكون 6 أرقام');
    if (pw.length < 8) return setError('كلمة المرور لازم تكون 8 أحرف/أرقام على الأقل');

    setLoading(true);
    try {
      await api.post('/auth/forgot-password/verify', { phone: p, otp: code, newPassword: pw }, { headers: { 'x-client': 'web' } });
      // Clear access cookie (sessions are revoked server-side)
      document.cookie = 'kaffza_access=; Path=/; Max-Age=0; SameSite=Lax';
      setSuccess('تم تحديث كلمة المرور. يمكنك تسجيل الدخول الآن.');
      router.push(`/login?phone=${encodeURIComponent(p)}&next=${encodeURIComponent(next)}`);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'فشل تحديث كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir="rtl" className="mx-auto max-w-lg px-6 py-12">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-extrabold text-kaffza-primary">نسيت كلمة المرور</div>
        <Link className="text-sm font-bold text-kaffza-text/70 underline" href="/">
          الرئيسية
        </Link>
      </div>

      <Card className="mt-6 p-6">
        <div className="text-sm text-kaffza-text/80">
          {step === 1 ? 'أدخل رقم هاتفك وسنرسل لك OTP.' : step === 2 ? 'أدخل OTP للتحقق.' : 'أدخل كلمة مرور جديدة.'}
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

        <div className="mt-5 grid gap-3">
          <Field label="رقم الهاتف">
            <Input value={phone} onChange={(e: any) => setPhone(e.target.value)} placeholder="+96891234567" disabled={step !== 1} />
            <Hint>صيغة عمانية: +968XXXXXXXX</Hint>
          </Field>

          {step >= 2 ? (
            <Field label="OTP (6 أرقام)">
              <Input value={otp} onChange={(e: any) => setOtp(e.target.value)} placeholder="123456" inputMode="numeric" disabled={step === 3} />
            </Field>
          ) : null}

          {step === 3 ? (
            <Field label="كلمة المرور الجديدة">
              <Input value={newPassword} onChange={(e: any) => setNewPassword(e.target.value)} placeholder="********" type="password" />
              <Hint>8 أحرف/أرقام على الأقل</Hint>
            </Field>
          ) : null}

          {step === 1 ? (
            <Button onClick={requestOtp} disabled={loading || !phoneOk}>
              {loading ? 'جارٍ الإرسال...' : 'إرسال OTP'}
            </Button>
          ) : step === 2 ? (
            <Button onClick={verifyOtp} disabled={loading || !otpOk}>
              {loading ? 'جارٍ التحقق...' : 'تحقق'}
            </Button>
          ) : (
            <Button onClick={resetPassword} disabled={loading || !passOk}>
              {loading ? 'جارٍ الحفظ...' : 'تحديث كلمة المرور'}
            </Button>
          )}

          <div className="flex items-center justify-between text-sm">
            <Link className="font-bold text-kaffza-primary underline" href={`/login?next=${encodeURIComponent(next)}`}>
              رجوع لتسجيل الدخول
            </Link>
            {step > 1 ? (
              <button
                className="text-xs font-bold text-kaffza-text/70 underline"
                onClick={() => {
                  setStep(1);
                  setOtp('');
                  setNewPassword('');
                  setMsg(null);
                }}
              >
                تغيير الرقم
              </button>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="mt-6 flex flex-wrap gap-3 text-xs text-kaffza-text">
        <Link className="underline" href="/legal/terms">الشروط</Link>
        <Link className="underline" href="/legal/privacy">الخصوصية</Link>
      </div>
    </main>
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
