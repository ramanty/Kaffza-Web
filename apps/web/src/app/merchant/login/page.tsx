'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

import { api } from '../../../lib/api';
import { getAccessTokenFromCookies } from '../../../lib/auth';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';

const OMAN_PHONE_RE = /^\+968[0-9]{8}$/;

function MerchantLoginPageInner() {
  const sp = useSearchParams();
  const registered = sp.get('registered') === '1';
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    const token = getAccessTokenFromCookies();
    if (token) {
      // if already logged in, go to dashboard
      router.replace('/dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const phoneOk = useMemo(() => OMAN_PHONE_RE.test(phone.trim()), [phone]);
  const passOk = useMemo(() => password.trim().length >= 8, [password]);

  const login = async () => {
    setMsg(null);
    const p = phone.trim();
    const pw = password.trim();

    if (!OMAN_PHONE_RE.test(p)) {
      setMsg({ type: 'error', text: 'رقم الهاتف لازم يكون بصيغة عُمانية صحيحة: +968XXXXXXXX' });
      return;
    }
    if (pw.length < 8) {
      setMsg({ type: 'error', text: 'كلمة المرور لازم تكون 8 أحرف/أرقام على الأقل' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { phone: p, password: pw }, { headers: { 'x-client': 'web' } });
      const user = res?.data?.data?.user;
      const accessToken = res?.data?.data?.tokens?.accessToken;

      if (!accessToken || !user) throw new Error('فشل تسجيل الدخول');

      const role = String(user.role || '').toLowerCase();
      if (role !== 'merchant') {
        setMsg({ type: 'error', text: 'هذا الحساب ليس حساب تاجر' });
        return;
      }

      document.cookie = `kaffza_access=${encodeURIComponent(accessToken)}; Path=/; SameSite=Lax`;
      setMsg({ type: 'success', text: 'تم تسجيل الدخول بنجاح' });
      router.replace('/dashboard');
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.response?.data?.message || e?.message || 'فشل تسجيل الدخول' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir="rtl" className="mx-auto max-w-lg px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-kaffza-text/70">منطقة التاجر</div>
          <div className="text-2xl font-extrabold text-kaffza-primary">تسجيل دخول التاجر</div>
        </div>
        <Link className="text-sm font-bold text-kaffza-text/70 underline" href="/">
          الرئيسية
        </Link>
      </div>

      <Card className="mt-6 p-6">
        {registered ? (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-bold text-green-700">تم التسجيل، سجّل دخول الآن</div>
        ) : null}
        <p className="text-sm text-kaffza-text/80">أدخل بياناتك للدخول إلى لوحة التحكم.</p>

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
            <Input value={phone} onChange={(e: any) => setPhone(e.target.value)} placeholder="+96891234567" />
            <Hint>صيغة عمانية: +968XXXXXXXX</Hint>
          </Field>

          <Field label="كلمة المرور">
            <Input value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="********" type="password" />
            <Hint>8 أحرف/أرقام على الأقل</Hint>
          </Field>

          <Button onClick={login} disabled={loading || !phoneOk || !passOk}>
            {loading ? 'جارٍ الدخول...' : 'دخول'}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <Link className="font-bold text-kaffza-primary underline" href="/merchant/register">
              ليس لديك حساب؟ سجّل كتاجر
            </Link>
            <Link className="text-xs font-bold text-kaffza-text/70 underline" href="/forgot-password">
              نسيت كلمة المرور؟
            </Link>
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

export default function MerchantLoginPage() { return <Suspense><MerchantLoginPageInner /></Suspense>; }
