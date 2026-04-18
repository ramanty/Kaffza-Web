'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { api } from '../../../lib/api';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { PhoneInput } from '../../../components/PhoneInput';
import { SocialAuthButtons } from '../../../components/SocialAuthButtons';
import { TurnstileChallenge } from '../../../components/TurnstileChallenge';
import { isValidE164Phone } from '../../../lib/phone';
import { extractApiErrorMessage } from '../../../lib/api-error';

type RegisterMethod = 'phone' | 'email';

function normalizeRegisterError(text: string) {
  const raw = String(text || '');
  if (raw.includes('مستخدم موجود') || raw.includes('already exists')) {
    return 'An account already exists with these details. Try logging in or resetting your password.';
  }
  if (raw.includes('محاولات كثيرة') || raw.includes('Too many requests')) {
    return 'Too many attempts in a short time. Please wait a minute and try again.';
  }
  if (raw.includes('OTP') && raw.includes('expired')) {
    return 'This OTP has expired. Request a new code to complete activation.';
  }
  return raw;
}

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

    if (n.length < 2) return setMsg('Name must be at least 2 characters');
    if (method === 'phone' && !isValidE164Phone(p)) return setMsg('Invalid phone number');
    if (method === 'email' && !e) return setMsg('Email is required for this method');
    if (!emailOk) return setMsg('Invalid email address');
    if (pw.length < 8) return setMsg('Password must be at least 8 characters');
    if (!acceptedPolicies) return setMsg('You must accept Terms and Privacy before continuing.');
    if (turnstileEnabled && !turnstileToken.trim())
      return setMsg('Please complete anti-bot verification first.');

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
          locale: 'en',
          turnstileToken: turnstileEnabled ? turnstileToken : undefined,
        },
        { headers: { 'x-client': 'web' } }
      );
      setStep('verify');
      setMsgType('success');
      setMsg(
        method === 'email'
          ? 'OTP sent to your email. Enter it within a few minutes to activate your account.'
          : 'OTP sent to your phone. Enter it within a few minutes to activate your account.'
      );
    } catch (e: any) {
      setMsg(
        normalizeRegisterError(extractApiErrorMessage(e, 'Failed to create account. Please retry.'))
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setMsg(null);
    setMsgType('error');
    const p = phone.trim();
    const code = otp.trim();
    if (method === 'phone' && !isValidE164Phone(p)) return setMsg('Invalid phone number');
    if (method === 'email' && !email.trim()) return setMsg('Invalid email address');
    if (!/^[0-9]{6}$/.test(code)) return setMsg('Code must be 6 digits');

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
      if (!token) throw new Error('No access token received');

      document.cookie = `kaffza_access=${encodeURIComponent(token)}; Path=/; SameSite=Lax`;
      router.replace(next);
    } catch (e: any) {
      setMsg(
        normalizeRegisterError(
          extractApiErrorMessage(e, 'OTP verification failed. Check code and retry.')
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
    if (method === 'phone' && !isValidE164Phone(p)) return setMsg('Invalid phone number');
    if (method === 'email' && !e) return setMsg('Invalid email address');
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
      setMsg('OTP re-sent. Use the latest code you received to continue.');
    } catch (e: any) {
      setMsg(
        normalizeRegisterError(extractApiErrorMessage(e, 'Could not resend OTP. Please retry.'))
      );
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
        <div className="border-kaffza-primary/20 bg-kaffza-primary/5 text-kaffza-text/80 mb-4 rounded-xl border p-3 text-xs">
          <span className="text-kaffza-primary font-bold">Fast & secure signup:</span> your details
          are used only to manage your account and orders.
        </div>
        <div className="text-kaffza-text/80 text-sm">
          Choose your preferred registration method. OTP will be sent via your selected method.
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
              <Hint>This appears on your delivery details</Hint>
            </Field>

            {method === 'email' ? (
              <Field label="Email">
                <Input
                  value={email}
                  onChange={(e: any) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
                <Hint>We send your activation code to this email</Hint>
              </Field>
            ) : null}

            {method === 'phone' ? (
              <Field label="Phone number">
                <PhoneInput value={phone} onChange={setPhone} />
                <Hint>Select country then enter phone without country code.</Hint>
              </Field>
            ) : null}

            <Field label="Password">
              <Input
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                placeholder="********"
                type="password"
              />
              <Hint>At least 8 characters</Hint>
            </Field>

            <label className="flex items-start gap-2 rounded-xl border border-black/10 bg-white p-3 text-sm">
              <input
                type="checkbox"
                checked={acceptedPolicies}
                onChange={(e) => setAcceptedPolicies(e.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span className="text-kaffza-text/85">
                I agree to the{' '}
                <Link className="text-kaffza-primary font-bold underline" href="/en/legal/terms">
                  Terms & Conditions
                </Link>{' '}
                and{' '}
                <Link className="text-kaffza-primary font-bold underline" href="/en/legal/privacy">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            {turnstileEnabled ? (
              <div className="rounded-xl border border-black/10 bg-white p-3">
                <TurnstileChallenge onToken={setTurnstileToken} isEn />
              </div>
            ) : null}

            <Button
              className="w-full !text-white"
              onClick={submit}
              disabled={!canSubmit || loading}
            >
              {loading ? 'Creating account...' : 'Create account & verify'}
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
            <SocialAuthButtons
              locale="en"
              onError={(text) => setMsg(text)}
              onAuthSuccess={(token) => {
                document.cookie = `kaffza_access=${encodeURIComponent(token)}; Path=/; SameSite=Lax`;
                router.replace(next);
              }}
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            <div className="bg-kaffza-bg text-kaffza-text rounded-xl p-3 text-xs">
              <span className="font-bold">{method === 'email' ? 'Email:' : 'Phone:'}</span>{' '}
              {method === 'email' ? email.trim() : phone.trim()}
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
              {loading ? 'Verifying...' : 'Confirm code & activate'}
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
