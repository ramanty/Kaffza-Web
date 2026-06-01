'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { api } from '../../../lib/api';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { isValidE164Phone } from '../../../lib/phone';
import { extractApiErrorMessage } from '../../../lib/api-error';

function EnForgotPasswordPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/en';

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState(sp.get('phone') || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const phoneOk = useMemo(() => isValidE164Phone(phone.trim()), [phone]);
  const otpOk = useMemo(() => /^[0-9]{6}$/.test(otp.trim()), [otp]);
  const passOk = useMemo(() => newPassword.trim().length >= 8, [newPassword]);

  const setError = (text: string) => setMsg({ type: 'error', text });
  const setSuccess = (text: string) => setMsg({ type: 'success', text });

  const requestOtp = async () => {
    setMsg(null);
    const p = phone.trim();
    if (!isValidE164Phone(p)) return setError('Phone must be in valid international format');

    setLoading(true);
    try {
      await api.post(
        '/auth/forgot-password/request',
        { phone: p },
        { headers: { 'x-client': 'web' } }
      );
      setSuccess('OTP sent');
      setStep(2);
    } catch (e: any) {
      setError(extractApiErrorMessage(e, 'Could not send OTP'));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setMsg(null);
    const p = phone.trim();
    const code = otp.trim();
    if (!isValidE164Phone(p)) return setError('Phone number is invalid');
    if (!/^[0-9]{6}$/.test(code)) return setError('OTP must be 6 digits');

    setLoading(true);
    try {
      await api.post(
        '/auth/otp/verify',
        { phone: p, otp: code },
        { headers: { 'x-client': 'web', 'x-purpose': 'reset' } }
      );
      setSuccess('OTP verified');
      setStep(3);
    } catch (e: any) {
      setError(extractApiErrorMessage(e, 'OTP verification failed'));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setMsg(null);
    const p = phone.trim();
    const code = otp.trim();
    const pw = newPassword.trim();

    if (!isValidE164Phone(p)) return setError('Phone number is invalid');
    if (!/^[0-9]{6}$/.test(code)) return setError('OTP must be 6 digits');
    if (pw.length < 8) return setError('Password must be at least 8 characters');

    setLoading(true);
    try {
      await api.post(
        '/auth/forgot-password/verify',
        { phone: p, otp: code, newPassword: pw },
        { headers: { 'x-client': 'web' } }
      );
      document.cookie = 'kaffza_access=; Path=/; Max-Age=0; SameSite=Lax';
      setSuccess('Password updated. You can now login.');
      router.push(`/en/login?phone=${encodeURIComponent(p)}&next=${encodeURIComponent(next)}`);
    } catch (e: any) {
      setError(extractApiErrorMessage(e, 'Password reset failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir="ltr" className="mx-auto max-w-lg px-6 py-12">
      <div className="flex items-center justify-between">
        <div className="text-primary text-2xl font-extrabold">Forgot password</div>
        <Link className="text-muted-foreground text-sm font-bold underline" href="/en">
          Home
        </Link>
      </div>

      <Card className="mt-6 p-6">
        <div className="text-foreground/80 text-sm">
          {step === 1
            ? 'Enter your phone and we will send an OTP.'
            : step === 2
              ? 'Enter the OTP to verify your identity.'
              : 'Set your new password.'}
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

        <div className="mt-5 grid gap-3">
          <Field label="Phone number">
            <Input
              value={phone}
              onChange={(e: any) => setPhone(e.target.value)}
              placeholder="+96891234567"
              disabled={step !== 1}
            />
            <Hint>International format: +968XXXXXXXX or +1XXXXXXXXXX</Hint>
          </Field>

          {step >= 2 ? (
            <Field label="OTP (6 digits)">
              <Input
                value={otp}
                onChange={(e: any) => setOtp(e.target.value)}
                placeholder="123456"
                inputMode="numeric"
                disabled={step === 3}
              />
            </Field>
          ) : null}

          {step === 3 ? (
            <Field label="New password">
              <Input
                value={newPassword}
                onChange={(e: any) => setNewPassword(e.target.value)}
                placeholder="********"
                type="password"
              />
              <Hint>At least 8 characters</Hint>
            </Field>
          ) : null}

          {step === 1 ? (
            <Button onClick={requestOtp} disabled={loading || !phoneOk}>
              {loading ? 'Sending...' : 'Send OTP'}
            </Button>
          ) : step === 2 ? (
            <Button onClick={verifyOtp} disabled={loading || !otpOk}>
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
          ) : (
            <Button onClick={resetPassword} disabled={loading || !passOk}>
              {loading ? 'Saving...' : 'Update password'}
            </Button>
          )}

          <div className="flex items-center justify-between text-sm">
            <Link
              className="text-primary font-bold underline"
              href={`/en/login?next=${encodeURIComponent(next)}`}
            >
              Back to login
            </Link>
            {step > 1 ? (
              <button
                className="text-muted-foreground text-xs font-bold underline"
                onClick={() => {
                  setStep(1);
                  setOtp('');
                  setNewPassword('');
                  setMsg(null);
                }}
              >
                Change phone
              </button>
            ) : null}
          </div>
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

function Hint({ children }: any) {
  return <span className="text-muted-foreground text-xs">{children}</span>;
}

export default function EnForgotPasswordPage() {
  return (
    <Suspense>
      <EnForgotPasswordPageInner />
    </Suspense>
  );
}
