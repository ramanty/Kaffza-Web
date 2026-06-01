'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { api } from '../../../../lib/api';
import { getAccessTokenFromCookies } from '../../../../lib/auth';
import { Card } from '../../../../components/Card';
import { Button } from '../../../../components/Button';
import { Input } from '../../../../components/Input';
import { SocialAuthButtons } from '../../../../components/SocialAuthButtons';
import { isValidE164Phone } from '../../../../lib/phone';
import { extractApiErrorMessage } from '../../../../lib/api-error';

function EnMerchantLoginInner() {
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
    if (token) router.replace('/dashboard?lang=en');
  }, []);

  const phoneOk = useMemo(() => isValidE164Phone(phone.trim()), [phone]);
  const emailOk = useMemo(() => /.+@.+\..+/.test(email.trim()), [email]);
  const passOk = useMemo(() => password.trim().length >= 8, [password]);

  async function login() {
    setMsg(null);
    const p = phone.trim();
    const e = email.trim();
    const pw = password.trim();
    if (method === 'phone' && !isValidE164Phone(p))
      return setMsg({ type: 'error', text: 'Invalid phone number' });
    if (method === 'email' && !emailOk)
      return setMsg({ type: 'error', text: 'Invalid email address' });
    if (pw.length < 8)
      return setMsg({ type: 'error', text: 'Password must be at least 8 characters' });

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
      if (!accessToken || !user) throw new Error('Login failed');
      const role = String(user.role || '').toLowerCase();
      if (role !== 'merchant' && role !== 'admin') {
        return setMsg({ type: 'error', text: 'This account is not a merchant account.' });
      }
      document.cookie = `kaffza_access=${encodeURIComponent(accessToken)}; Path=/; SameSite=Lax`;
      router.replace('/dashboard?lang=en');
    } catch (e: any) {
      setMsg({ type: 'error', text: extractApiErrorMessage(e, 'Login failed') });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main dir="ltr" className="mx-auto max-w-lg px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-muted-foreground text-xs">Merchant area</div>
          <div className="text-primary text-2xl font-extrabold">Merchant Login</div>
        </div>
        <Link className="text-muted-foreground text-sm font-bold underline" href="/en">
          Home
        </Link>
      </div>

      <Card className="mt-6 p-6">
        {registered ? (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-bold text-green-700">
            Registration complete. Please login now.
          </div>
        ) : null}
        <p className="text-foreground/80 text-sm">
          Enter your details to access merchant dashboard.
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

        <div className="grid gap-2">
          <span className="text-foreground text-sm font-bold">Login method</span>
          <div className="flex gap-2">
            <TabButton active={method === 'phone'} onClick={() => setMethod('phone')}>
              Phone
            </TabButton>
            <TabButton active={method === 'email'} onClick={() => setMethod('email')}>
              Email
            </TabButton>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {method === 'phone' ? (
            <Field label="Phone number">
              <Input
                value={phone}
                onChange={(e: any) => setPhone(e.target.value)}
                placeholder="+96891234567"
              />
              <Hint>International format: +968XXXXXXXX or +1XXXXXXXXXX</Hint>
            </Field>
          ) : (
            <Field label="Email">
              <Input
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                placeholder="merchant@example.com"
              />
            </Field>
          )}

          <Field label="Password">
            <Input
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              type="password"
              placeholder="********"
            />
            <Hint>At least 8 characters</Hint>
          </Field>

          <Button
            onClick={login}
            disabled={loading || !(method === 'phone' ? phoneOk : emailOk) || !passOk}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <Link className="text-primary font-bold underline" href="/en/merchant/register">
              No account yet? Register as merchant
            </Link>
            <Link
              className="text-muted-foreground text-xs font-bold underline"
              href="/en/forgot-password"
            >
              Forgot password?
            </Link>
          </div>

          <SocialAuthButtons
            locale="en"
            onError={(text) => setMsg({ type: 'error', text })}
            onAuthSuccess={(token) => {
              document.cookie = `kaffza_access=${encodeURIComponent(token)}; Path=/; SameSite=Lax`;
              router.replace('/dashboard?lang=en');
            }}
          />
        </div>
      </Card>

      <div className="text-foreground mt-6 flex flex-wrap gap-3 text-xs">
        <Link className="underline" href="/en/legal/terms">
          Terms
        </Link>
        <Link className="underline" href="/en/legal/privacy">
          Privacy
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

function TabButton({ active, onClick, children }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex-1 rounded-xl px-4 py-2 text-sm font-extrabold transition ' +
        (active
          ? 'bg-[#1B3A6B] text-white'
          : 'bg-background text-foreground border border-border hover:bg-black/5')
      }
    >
      {children}
    </button>
  );
}

function Hint({ children }: any) {
  return <span className="text-muted-foreground text-xs">{children}</span>;
}

export default function EnMerchantLoginPage() {
  return (
    <Suspense>
      <EnMerchantLoginInner />
    </Suspense>
  );
}
