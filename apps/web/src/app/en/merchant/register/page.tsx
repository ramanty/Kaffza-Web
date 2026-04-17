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
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const emailOk = useMemo(() => /.+@.+\..+/.test(email.trim()), [email]);
  const canSubmit = useMemo(
    () =>
      name.trim().length >= 2 &&
      (method === 'phone' ? isValidE164Phone(phone) : emailOk) &&
      password.trim().length >= 8 &&
      password.trim() === confirm.trim(),
    [name, method, phone, emailOk, password, confirm]
  );
  const canVerify = useMemo(() => /^[0-9]{6}$/.test(otp.trim()), [otp]);

  async function submit() {
    setMsg(null);
    const n = name.trim();
    const p = phone.trim();
    const e = email.trim();
    const pw = password.trim();
    if (method === 'phone' && !isValidE164Phone(p))
      return setMsg({ type: 'error', text: 'Invalid phone number' });
    if (method === 'email' && !emailOk)
      return setMsg({ type: 'error', text: 'Invalid email address' });
    if (pw.length < 8)
      return setMsg({ type: 'error', text: 'Password must be at least 8 characters' });
    if (pw !== confirm.trim())
      return setMsg({ type: 'error', text: 'Password confirmation does not match' });

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
    const code = otp.trim();
    if (!/^[0-9]{6}$/.test(code)) return setMsg({ type: 'error', text: 'Code must be 6 digits' });
    setLoading(true);
    try {
      const res = await api.post(
        '/auth/otp/verify',
        {
          method,
          phone: method === 'phone' ? phone.trim() : undefined,
          email: method === 'email' ? email.trim() : undefined,
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

  return (
    <main dir="ltr" className="mx-auto max-w-lg px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-kaffza-text/70 text-xs">Merchant area</div>
          <div className="text-kaffza-primary text-2xl font-extrabold">Merchant Registration</div>
        </div>
        <Link className="text-kaffza-text/70 text-sm font-bold underline" href="/en">
          Home
        </Link>
      </div>

      <Card className="mt-6 p-6">
        <p className="text-kaffza-text/80 text-sm">
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
                  placeholder="merchant@example.com"
                />
              </Field>
            ) : (
              <Field label="Phone">
                <PhoneInput value={phone} onChange={setPhone} />
              </Field>
            )}

            <Field label="Password">
              <Input
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                type="password"
                placeholder="********"
              />
            </Field>
            <Field label="Confirm password">
              <Input
                value={confirm}
                onChange={(e: any) => setConfirm(e.target.value)}
                type="password"
                placeholder="********"
              />
            </Field>

            <Button
              className="w-full !text-white"
              onClick={submit}
              disabled={!canSubmit || loading}
            >
              {loading ? 'Creating...' : 'Create account'}
            </Button>

            <div className="text-sm">
              Already have an account?{' '}
              <Link className="text-kaffza-primary font-bold underline" href="/en/merchant/login">
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
              {loading ? 'Verifying...' : 'Verify and activate'}
            </Button>
          </div>
        )}
      </Card>
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
