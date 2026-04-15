'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { api } from '../../../lib/api';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { PhoneInput } from '../../../components/PhoneInput';
import { isValidE164Phone } from '../../../lib/phone';

export default function MerchantRegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'register' | 'verify'>('register');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const emailOk = useMemo(() => /.+@.+\..+/.test(email.trim()), [email]);
  const canSubmit = useMemo(() => {
    return (
      name.trim().length >= 2 &&
      isValidE164Phone(phone) &&
      emailOk &&
      password.trim().length >= 8 &&
      password.trim() === confirm.trim()
    );
  }, [name, phone, password, confirm, emailOk]);
  const canVerify = useMemo(() => /^[0-9]{6}$/.test(otp.trim()), [otp]);

  const submit = async () => {
    setMsg(null);
    const n = name.trim();
    const p = phone.trim();
    const e = email.trim();
    const pw = password.trim();

    if (n.length < 2) return setMsg({ type: 'error', text: 'الاسم لازم يكون حرفين على الأقل' });
    if (!isValidE164Phone(p)) return setMsg({ type: 'error', text: 'رقم الهاتف غير صحيح' });
    if (!emailOk) return setMsg({ type: 'error', text: 'البريد الإلكتروني غير صحيح' });
    if (pw.length < 8)
      return setMsg({ type: 'error', text: 'كلمة المرور لازم تكون 8 أحرف/أرقام على الأقل' });
    if (pw !== confirm.trim())
      return setMsg({ type: 'error', text: 'تأكيد كلمة المرور غير مطابق' });

    setLoading(true);
    try {
      await api.post(
        '/auth/register',
        { name: n, phone: p, email: e, password: pw, role: 'merchant', locale: 'ar' },
        { headers: { 'x-client': 'web' } }
      );

      setStep('verify');
      setMsg({ type: 'success', text: 'تم إرسال OTP، أدخل الرمز لتفعيل حساب التاجر' });
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'فشل إنشاء الحساب' });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setMsg(null);
    const p = phone.trim();
    const code = otp.trim();
    if (!isValidE164Phone(p)) return setMsg({ type: 'error', text: 'رقم الهاتف غير صحيح' });
    if (!/^[0-9]{6}$/.test(code))
      return setMsg({ type: 'error', text: 'الرمز يجب أن يكون 6 أرقام' });

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
      router.replace('/onboarding');
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'فشل التحقق من الرمز' });
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setMsg(null);
    const p = phone.trim();
    if (!isValidE164Phone(p)) return setMsg({ type: 'error', text: 'رقم الهاتف غير صحيح' });
    setLoading(true);
    try {
      await api.post('/auth/otp/resend', { phone: p }, { headers: { 'x-client': 'web' } });
      setMsg({ type: 'success', text: 'تمت إعادة إرسال OTP' });
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'تعذر إعادة إرسال OTP' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir="rtl" className="mx-auto max-w-lg px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-kaffza-text/70 text-xs">منطقة التاجر</div>
          <div className="text-kaffza-primary text-2xl font-extrabold">تسجيل تاجر جديد</div>
        </div>
        <Link className="text-kaffza-text/70 text-sm font-bold underline" href="/">
          الرئيسية
        </Link>
      </div>

      <Card className="mt-6 p-6">
        <p className="text-kaffza-text/80 text-sm">
          لفتح متجر وبدء البيع يجب إدخال البريد الإلكتروني ورقم الهاتف معاً.
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
            <Field label="الاسم الكامل">
              <Input
                value={name}
                onChange={(e: any) => setName(e.target.value)}
                placeholder="محمد"
              />
            </Field>

            <Field label="البريد الإلكتروني (مطلوب)">
              <Input
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                placeholder="merchant@example.com"
              />
            </Field>

            <Field label="رقم الهاتف (مطلوب)">
              <PhoneInput value={phone} onChange={setPhone} />
              <Hint>اختر الدولة ثم اكتب رقم الهاتف بدون رمز الدولة</Hint>
            </Field>

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

            <Button
              className="bg-kaffza-primary w-full text-white"
              onClick={submit}
              disabled={!canSubmit || loading}
            >
              {loading ? 'جارٍ التسجيل...' : 'تسجيل'}
            </Button>

            <div className="text-sm">
              عندك حساب؟{' '}
              <Link className="text-kaffza-primary font-bold underline" href="/merchant/login">
                تسجيل الدخول
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            <div className="bg-kaffza-bg text-kaffza-text rounded-xl p-3 text-xs">
              <span className="font-bold">الهاتف:</span> {phone.trim()}
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
