'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { api } from '../../../lib/api';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { PhoneInput } from '../../../components/PhoneInput';
import { isValidE164Phone } from '../../../lib/phone';

type RegisterMethod = 'phone' | 'email';

function EnRegisterPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/en';

  const [method, setMethod] = useState<RegisterMethod>('phone');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const emailOk = useMemo(() => !email.trim() || /.+@.+\..+/.test(email.trim()), [email]);

  const canSubmit = useMemo(() => {
    return (
      name.trim().length >= 2 &&
      isValidE164Phone(phone) &&
      (method === 'phone' || !!email.trim()) &&
      emailOk &&
      password.trim().length >= 8
    );
  }, [name, phone, email, emailOk, method, password]);

  const canVerify = useMemo(() => /^[0-9]{6}$/.test(otp.trim()), [otp]);

  const submit = async () => {
    setMsg(null);
    const n = name.trim();
    const p = phone.trim();
    const e = email.trim();
    const pw = password.trim();

    if (n.length < 2) return setMsg('Name must be at least 2 characters');
    if (!isValidE164Phone(p)) return setMsg('Invalid phone number');
    if (method === 'email' && !e) return setMsg('Email is required for this method');
    if (!emailOk) return setMsg('Invalid email address');
    if (pw.length < 8) return setMsg('Password must be at least 8 characters');

    setLoading(true);
    try {
      await api.post(
        '/auth/register',
        { name: n, phone: p, email: e || undefined, password: pw, role: 'customer', locale: 'en' },
        { headers: { 'x-client': 'web' } }
      );
      setStep('verify');
      setMsg('OTP sent. Enter the code to activate your account.');
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setMsg(null);
    const p = phone.trim();
    const code = otp.trim();
    if (!isValidE164Phone(p)) return setMsg('Invalid phone number');
    if (!/^[0-9]{6}$/.test(code)) return setMsg('Code must be 6 digits');

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
      router.replace(next);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setMsg(null);
    const p = phone.trim();
    if (!isValidE164Phone(p)) return setMsg('Invalid phone number');
    setLoading(true);
    try {
      await api.post('/auth/otp/resend', { phone: p }, { headers: { 'x-client': 'web' } });
      setMsg('OTP re-sent');
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Could not resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir="ltr" className="mx-auto max-w-lg px-6 py-12">
      <div className="flex items-center justify-between">
        <div className="text-kaffza-primary text-2xl font-extrabold">Create account</div>
        <Link className="text-kaffza-text/70 text-sm font-bold underline" href="/en">
          Home
        </Link>
      </div>

      <Card className="mt-6 p-6">
        <div className="text-kaffza-text/80 text-sm">
          Choose your preferred registration method. OTP will be sent to your phone.
        </div>

        {msg ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {msg}
          </div>
        ) : null}

        {step === 'register' ? (
          <div className="mt-5 grid gap-3">
            <div className="grid gap-2">
              <span className="text-kaffza-text text-sm font-bold">Registration method</span>
              <div className="flex gap-2">
                <TabButton active={method === 'phone'} onClick={() => setMethod('phone')}>
                  Phone
                </TabButton>
                <TabButton active={method === 'email'} onClick={() => setMethod('email')}>
                  Email
                </TabButton>
              </div>
            </div>

            <Field label="Full name">
              <Input
                value={name}
                onChange={(e: any) => setName(e.target.value)}
                placeholder="John Doe"
              />
            </Field>

            {method === 'email' ? (
              <Field label="Email">
                <Input
                  value={email}
                  onChange={(e: any) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </Field>
            ) : null}

            <Field label="Phone number">
              <PhoneInput value={phone} onChange={setPhone} />
              <Hint>Select country then enter phone without country code.</Hint>
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

            <Button
              className="w-full !text-white"
              onClick={submit}
              disabled={!canSubmit || loading}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </Button>

            <div className="text-sm">
              Already have an account?{' '}
              <Link
                className="text-kaffza-primary font-bold underline"
                href={`/en/login?next=${encodeURIComponent(next)}`}
              >
                Login
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            <div className="bg-kaffza-bg text-kaffza-text rounded-xl p-3 text-xs">
              <span className="font-bold">Phone:</span> {phone.trim()}
            </div>

            <Field label="OTP (6 digits)">
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
              {loading ? 'Verifying...' : 'Confirm and activate'}
            </Button>

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <button
                className="text-kaffza-primary font-bold underline disabled:opacity-50"
                onClick={resendOtp}
                disabled={loading}
              >
                Resend OTP
              </button>
              <button
                className="text-kaffza-text/70 text-xs font-bold underline"
                onClick={() => {
                  setStep('register');
                  setOtp('');
                }}
              >
                Edit details
              </button>
            </div>
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
        (active
          ? 'bg-[#1B3A6B] text-white'
          : 'bg-kaffza-bg text-kaffza-text border border-black/10 hover:bg-black/5')
      }
    >
      {children}
    </button>
  );
}

export default function EnRegisterPage() {
  return (
    <Suspense>
      <EnRegisterPageInner />
    </Suspense>
  );
}
