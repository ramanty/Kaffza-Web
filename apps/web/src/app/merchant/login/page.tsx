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
import { SocialAuthButtons } from '../../../components/SocialAuthButtons';
import { isValidE164Phone } from '../../../lib/phone';
import { extractApiErrorMessage } from '../../../lib/api-error';

function MerchantLoginPageInner() {
  const sp = useSearchParams();
  const registered = sp.get('registered') === '1';
  const router = useRouter();

  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    const token = getAccessTokenFromCookies();
    if (token) {
      // if already logged in, go to dashboard
      router.replace('/dashboard');
    }
  }, []);

  const phoneOk = useMemo(() => isValidE164Phone(phone.trim()), [phone]);
  const emailOk = useMemo(() => /.+@.+\..+/.test(email.trim()), [email]);
  const passOk = useMemo(() => password.trim().length >= 8, [password]);

  const login = async () => {
    setMsg(null);
    const p = phone.trim();
    const e = email.trim();
    const pw = password.trim();

    if (method === 'phone' && !isValidE164Phone(p)) {
      setMsg({ type: 'error', text: 'رقم الهاتف يجب أن يكون بصيغة دولية صحيحة' });
      return;
    }
    if (method === 'email' && !emailOk) {
      setMsg({ type: 'error', text: 'البريد الإلكتروني غير صحيح' });
      return;
    }
    if (pw.length < 8) {
      setMsg({ type: 'error', text: 'كلمة المرور لازم تكون 8 أحرف/أرقام على الأقل' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(
        '/auth/login',
        {
          phone: method === 'phone' ? p : undefined,
          email: method === 'email' ? e : undefined,
          password: pw,
        },
        { headers: { 'x-client': 'web' } }
      );
      const user = res?.data?.data?.user;
      const accessToken = res?.data?.data?.tokens?.accessToken;

      if (!accessToken || !user) throw new Error('فشل تسجيل الدخول');

      const role = String(user.role || '').toLowerCase();
      if (role !== 'merchant' && role !== 'admin') {
        setMsg({
          type: 'error',
          text: 'هذا الحساب ليس حساب تاجر. يرجى تسجيل الدخول من صفحة العملاء',
        });
        return;
      }

      document.cookie = `kaffza_access=${encodeURIComponent(accessToken)}; Path=/; SameSite=Lax`;
      setMsg({ type: 'success', text: 'تم تسجيل الدخول بنجاح' });
      router.replace('/dashboard');
    } catch (e: any) {
      setMsg({
        type: 'error',
        text: extractApiErrorMessage(e, 'فشل تسجيل الدخول'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir="rtl" className="mx-auto max-w-lg px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-kaffza-text/70 text-xs">منطقة التاجر</div>
          <div className="text-kaffza-primary text-2xl font-extrabold">تسجيل دخول التاجر</div>
        </div>
        <Link className="text-kaffza-text/70 text-sm font-bold underline" href="/">
          الرئيسية
        </Link>
      </div>

      <Card className="mt-6 p-6">
        {registered ? (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-bold text-green-700">
            تم التسجيل، سجّل دخول الآن
          </div>
        ) : null}
        <p className="text-kaffza-text/80 text-sm">أدخل بياناتك للدخول إلى لوحة التحكم.</p>

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

        <div className="mt-5 grid gap-3">
          <div className="grid gap-2">
            <span className="text-kaffza-text text-sm font-bold">طريقة تسجيل الدخول</span>
            <div className="flex gap-2">
              <TabButton active={method === 'phone'} onClick={() => setMethod('phone')}>
                الهاتف
              </TabButton>
              <TabButton active={method === 'email'} onClick={() => setMethod('email')}>
                البريد
              </TabButton>
            </div>
          </div>

          {method === 'phone' ? (
            <Field label="رقم الهاتف">
              <Input
                value={phone}
                onChange={(e: any) => setPhone(e.target.value)}
                placeholder="+96891234567"
              />
              <Hint>صيغة دولية: +968XXXXXXXX أو +1XXXXXXXXXX</Hint>
            </Field>
          ) : (
            <Field label="البريد الإلكتروني">
              <Input
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                placeholder="merchant@example.com"
              />
            </Field>
          )}

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
            onClick={login}
            disabled={loading || !(method === 'phone' ? phoneOk : emailOk) || !passOk}
          >
            {loading ? 'جارٍ الدخول...' : 'دخول'}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <Link className="text-kaffza-primary font-bold underline" href="/merchant/register">
              ليس لديك حساب؟ سجّل كتاجر
            </Link>
            <Link
              className="text-kaffza-text/70 text-xs font-bold underline"
              href="/forgot-password"
            >
              نسيت كلمة المرور؟
            </Link>
          </div>
          <SocialAuthButtons
            locale="ar"
            onError={(text) => setMsg({ type: 'error', text })}
            onAuthSuccess={(token) => {
              document.cookie = `kaffza_access=${encodeURIComponent(token)}; Path=/; SameSite=Lax`;
              router.replace('/dashboard');
            }}
          />
        </div>
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

export default function MerchantLoginPage() {
  return (
    <Suspense>
      <MerchantLoginPageInner />
    </Suspense>
  );
}
