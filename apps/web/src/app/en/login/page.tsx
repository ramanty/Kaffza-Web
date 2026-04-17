'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { api } from '../../../lib/api';
import { getAccessTokenFromCookies } from '../../../lib/auth';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { isValidE164Phone } from '../../../lib/phone';

function EnLoginPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/en';
  const phoneFromQuery = sp.get('phone') || '';

  const [tab, setTab] = useState<'password' | 'otp'>('password');
  const [phone, setPhone] = useState(phoneFromQuery);
  const [password, setPassword] = useState('');

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
        const me = await api.get('/auth/me', {
          headers: { 'x-client': 'web', Authorization: `Bearer ${token}` },
        });
        const role = me?.data?.data?.role;
        if (handleRoleRedirect(role)) return;
        router.replace(next);
      } catch {
        router.replace(next);
      }
    })();
  }, []);

  const phoneOk = useMemo(() => isValidE164Phone(phone.trim()), [phone]);
  const passOk = useMemo(() => password.trim().length >= 8, [password]);

  const otpPhoneOk = useMemo(() => isValidE164Phone(otpPhone.trim()), [otpPhone]);
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

    if (!isValidE164Phone(p)) return setError('Phone must be in valid international format');
    if (pw.length < 8) return setError('Password must be at least 8 characters');

    setLoading(true);
    try {
      const res = await api.post(
        '/auth/login',
        { phone: p, password: pw },
        { headers: { 'x-client': 'web' } }
      );
      const token = res?.data?.data?.tokens?.accessToken;
      if (!token) throw new Error('No access token received');

      document.cookie = `kaffza_access=${encodeURIComponent(token)}; Path=/; SameSite=Lax`;
      setSuccess('Logged in successfully');
      router.replace(next);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async () => {
    setMsg(null);
    const p = otpPhone.trim();
    if (!isValidE164Phone(p)) return setError('Phone must be in valid international format');

    setLoading(true);
    try {
      await api.post('/auth/otp/request', { phone: p }, { headers: { 'x-client': 'web' } });
      setSuccess('OTP sent');
      setOtpStep('code');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setMsg(null);
    const p = otpPhone.trim();
    const code = otp.trim();

    if (!isValidE164Phone(p)) return setError('Phone number is invalid');
    if (!/^[0-9]{6}$/.test(code)) return setError('OTP must be 6 digits');

    setLoading(true);
    try {
      const res = await api.post(
        '/auth/otp/verify',
        { phone: p, otp: code },
        { headers: { 'x-client': 'web' } }
      );
      const token = res?.data?.data?.tokens?.accessToken;
      if (!token) throw new Error('No access token received');

      document.cookie = `kaffza_access=${encodeURIComponent(token)}; Path=/; SameSite=Lax`;
      setSuccess('Logged in successfully');
      router.replace(next);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir="ltr" className="mx-auto max-w-lg px-6 py-12">
      <div className="flex items-center justify-between">
        <div className="text-kaffza-primary text-2xl font-extrabold">Login</div>
        <Link className="text-kaffza-text/70 text-sm font-bold underline" href="/en">
          Home
        </Link>
      </div>

      <Card className="mt-6 p-6">
        <div className="flex gap-2">
          <TabButton active={tab === 'password'} onClick={() => setTab('password')}>
            Password
          </TabButton>
          <TabButton active={tab === 'otp'} onClick={() => setTab('otp')}>
            OTP
          </TabButton>
        </div>

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

        {tab === 'password' ? (
          <div className="mt-5 grid gap-3">
            <Field label="Phone number">
              <Input
                value={phone}
                onChange={(e: any) => setPhone(e.target.value)}
                placeholder="+96891234567"
              />
              <Hint>International format: +968XXXXXXXX or +1XXXXXXXXXX</Hint>
            </Field>

            <Field label="Password">
              <Input
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                placeholder="********"
                type="password"
              />
              <Hint>At least 8 characters</Hint>
            </Field>

            <Button onClick={doPasswordLogin} disabled={loading || !phoneOk || !passOk}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <Link
                className="text-kaffza-primary font-bold underline"
                href={`/en/register?next=${encodeURIComponent(next)}`}
              >
                Create account
              </Link>
              <Link
                className="text-kaffza-text/70 text-xs font-bold underline"
                href={`/forgot-password?next=${encodeURIComponent(next)}`}
              >
                Forgot password?
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            {otpStep === 'phone' ? (
              <>
                <Field label="Phone number">
                  <Input
                    value={otpPhone}
                    onChange={(e: any) => setOtpPhone(e.target.value)}
                    placeholder="+96891234567"
                  />
                  <Hint>International format: +968XXXXXXXX or +1XXXXXXXXXX</Hint>
                </Field>

                <Button onClick={requestOtp} disabled={loading || !otpPhoneOk}>
                  {loading ? 'Sending...' : 'Send OTP'}
                </Button>

                <div className="text-sm">
                  New here?{' '}
                  <Link
                    className="text-kaffza-primary font-bold underline"
                    href={`/en/register?next=${encodeURIComponent(next)}`}
                  >
                    Create account
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="bg-kaffza-bg text-kaffza-text rounded-xl p-3 text-xs">
                  <span className="font-bold">Phone:</span> {otpPhone.trim()}
                </div>

                <Field label="OTP (6 digits)">
                  <Input
                    value={otp}
                    onChange={(e: any) => setOtp(e.target.value)}
                    placeholder="123456"
                    inputMode="numeric"
                  />
                </Field>

                <Button onClick={verifyOtp} disabled={loading || !otpOk}>
                  {loading ? 'Verifying...' : 'Confirm'}
                </Button>

                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <button
                    className="text-kaffza-primary font-bold underline disabled:opacity-50"
                    onClick={requestOtp}
                    disabled={loading || !otpPhoneOk}
                  >
                    Resend OTP
                  </button>
                  <button
                    className="text-kaffza-text/70 text-xs font-bold underline"
                    onClick={() => {
                      setOtp('');
                      setOtpStep('phone');
                      setMsg(null);
                    }}
                  >
                    Change phone
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      <div className="text-kaffza-text mt-6 flex flex-wrap gap-3 text-xs">
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

function TabButton({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className={
        'flex-1 rounded-xl px-4 py-2 text-sm font-extrabold transition ' +
        (active
          ? 'bg-[#1B3A6B] text-white'
          : 'bg-kaffza-bg text-kaffza-text border border-black/10 hover:bg-black/5')
      }
    >
      {children}
    </button>
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

export default function EnLoginPage() {
  return (
    <Suspense>
      <EnLoginPageInner />
    </Suspense>
  );
}
