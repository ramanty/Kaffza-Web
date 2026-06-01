'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { api } from '../../../../lib/api';
import { Card } from '../../../../components/Card';
import { Button } from '../../../../components/Button';
import { Input } from '../../../../components/Input';
import { PhoneInput } from '../../../../components/PhoneInput';
import { SocialAuthButtons } from '../../../../components/SocialAuthButtons';
import { TurnstileChallenge } from '../../../../components/TurnstileChallenge';
import { isValidE164Phone } from '../../../../lib/phone';
import { extractApiErrorMessage } from '../../../../lib/api-error';

export default function EnMerchantRegisterPage() {
  const router = useRouter();
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [name, setName] = useState('');
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
  const canSubmit = useMemo(
    () =>
      name.trim().length >= 2 &&
      (method === 'phone' ? isValidE164Phone(phone) : emailOk) &&
      password.trim().length >= 8 &&
      password.trim() === confirm.trim() &&
      acceptedPolicies &&
      (!turnstileEnabled || turnstileToken.trim().length > 0),
    [
      name,
      method,
      phone,
      emailOk,
      password,
      confirm,
      acceptedPolicies,
      turnstileEnabled,
      turnstileToken,
    ]
  );
  const canVerify = useMemo(() => /^[0-9]{6}$/.test(otp.trim()), [otp]);

  async function submit() {
    setMsg(null);
    const n = name.trim();
    const p = phone.trim();
    const e = email.trim();
    const pw = password.trim();
    if (n.length < 2) return setMsg({ type: 'error', text: 'Name must be at least 2 characters' });
    if (method === 'phone' && !isValidE164Phone(p))
      return setMsg({ type: 'error', text: 'Invalid phone number' });
    if (method === 'email' && !emailOk)
      return setMsg({ type: 'error', text: 'Invalid email address' });
    if (pw.length < 8)
      return setMsg({ type: 'error', text: 'Password must be at least 8 characters' });
    if (pw !== confirm.trim())
      return setMsg({ type: 'error', text: 'Password confirmation does not match' });
    if (!acceptedPolicies)
      return setMsg({
        type: 'error',
        text: 'You must accept Terms and Privacy before continuing.',
      });
    if (turnstileEnabled && !turnstileToken.trim())
      return setMsg({ type: 'error', text: 'Please complete the anti-bot verification first.' });

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
          locale: 'en',
          turnstileToken: turnstileEnabled ? turnstileToken : undefined,
        },
        { headers: { 'x-client': 'web' } }
      );
      setStep('verify');
      setMsg({ type: 'success', text: 'OTP sent. Enter code to activate your merchant account.' });
    } catch (e: any) {
      setMsg({ type: 'error', text: extractApiErrorMessage(e, 'Failed to create account') });
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setMsg(null);
    const p = phone.trim();
    const e = email.trim();
    const code = otp.trim();
    if (method === 'phone' && !isValidE164Phone(p))
      return setMsg({ type: 'error', text: 'Invalid phone number' });
    if (method === 'email' && !e) return setMsg({ type: 'error', text: 'Invalid email address' });
    if (!/^[0-9]{6}$/.test(code)) return setMsg({ type: 'error', text: 'Code must be 6 digits' });
    setLoading(true);
    try {
      const res = await api.post(
        '/auth/otp/verify',
        {
          method,
          phone: method === 'phone' ? p : undefined,
          email: method === 'email' ? e : undefined,
          otp: code,
        },
        { headers: { 'x-client': 'web' } }
      );
      const token = res?.data?.data?.tokens?.accessToken;
      if (!token) throw new Error('No access token received');
      document.cookie = `kaffza_access=${encodeURIComponent(token)}; Path=/; SameSite=Lax`;
      router.replace('/onboarding?lang=en');
    } catch (e: any) {
      setMsg({ type: 'error', text: extractApiErrorMessage(e, 'OTP verification failed') });
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    setMsg(null);
    const p = phone.trim();
    const e = email.trim();
    if (method === 'phone' && !isValidE164Phone(p))
      return setMsg({ type: 'error', text: 'Invalid phone number' });
    if (method === 'email' && !e) return setMsg({ type: 'error', text: 'Invalid email address' });
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
      setMsg({ type: 'success', text: 'OTP re-sent' });
    } catch (err: any) {
      setMsg({ type: 'error', text: extractApiErrorMessage(err, 'Could not resend OTP') });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main dir="ltr" className="mx-auto max-w-lg px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-muted-foreground text-xs">Merchant area</div>
          <div className="text-primary text-2xl font-extrabold">Merchant Registration</div>
        </div>
        <Link className="text-muted-foreground text-sm font-bold underline" href="/en">
          Home
        </Link>
      </div>

      <Card className="mt-6 p-6">
        <p className="text-foreground/80 text-sm">
          You can register by email or phone. Before publishing products, both must be linked.
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
            <div className="grid gap-2">
              <span className="text-foreground text-sm font-bold">Registration method</span>
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
                  placeholder="merchant@example.com"
                />
              </Field>
            ) : (
              <Field label="Phone">
                <PhoneInput value={phone} onChange={setPhone} />
                <Hint>Select country then enter phone without country code.</Hint>
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
            <Field label="Confirm password">
              <Input
                value={confirm}
                onChange={(e: any) => setConfirm(e.target.value)}
                type="password"
                placeholder="********"
              />
            </Field>

            <label className="flex items-start gap-2 rounded-xl border border-border bg-card text-card-foreground p-3 text-sm">
              <input
                type="checkbox"
                checked={acceptedPolicies}
                onChange={(e) => setAcceptedPolicies(e.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span className="text-foreground/85">
                I agree to the{' '}
                <Link className="text-primary font-bold underline" href="/en/legal/terms">
                  Terms & Conditions
                </Link>{' '}
                and{' '}
                <Link className="text-primary font-bold underline" href="/en/legal/privacy">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            {turnstileEnabled ? (
              <div className="rounded-xl border border-border bg-card text-card-foreground p-3">
                <TurnstileChallenge onToken={setTurnstileToken} isEn />
              </div>
            ) : null}

            <Button
              className="w-full !text-white"
              onClick={submit}
              disabled={!canSubmit || loading}
            >
              {loading ? 'Creating...' : 'Create account'}
            </Button>

            <div className="text-sm">
              Already have an account?{' '}
              <Link className="text-primary font-bold underline" href="/en/merchant/login">
                Login
              </Link>
            </div>

            <SocialAuthButtons
              locale="en"
              onError={(text) => setMsg({ type: 'error', text })}
              onAuthSuccess={(token) => {
                document.cookie = `kaffza_access=${encodeURIComponent(token)}; Path=/; SameSite=Lax`;
                router.replace('/onboarding?lang=en');
              }}
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            <div className="bg-background text-foreground rounded-xl p-3 text-xs">
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
              {loading ? 'Verifying...' : 'Verify and activate'}
            </Button>

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <button
                className="text-primary font-bold underline disabled:opacity-50"
                onClick={resendOtp}
                disabled={loading}
              >
                Resend OTP
              </button>
              <button
                className="text-muted-foreground text-xs font-bold underline"
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
        (active ? 'bg-[#16A34A] text-white' : 'bg-[#1B3A6B] text-white hover:bg-[#17345F]')
      }
    >
      {children}
    </button>
  );
}

function Hint({ children }: any) {
  return <span className="text-muted-foreground text-xs">{children}</span>;
}
