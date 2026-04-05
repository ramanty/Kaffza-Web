'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { api } from '../../lib/api';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

const OMAN_PHONE_RE = /^\+968[0-9]{8}$/;

function RegisterPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return name.trim().length >= 2 && OMAN_PHONE_RE.test(phone.trim()) && password.trim().length >= 8;
  }, [name, phone, password]);

  const submit = async () => {
    setMsg(null);
    const n = name.trim();
    const p = phone.trim();
    const pw = password.trim();

    if (n.length < 2) return setMsg('الاسم لازم يكون حرفين على الأقل');
    if (!OMAN_PHONE_RE.test(p)) return setMsg('رقم الهاتف لازم يكون بصيغة عُمانية صحيحة: +968XXXXXXXX');
    if (pw.length < 8) return setMsg('كلمة المرور لازم تكون 8 أحرف/أرقام على الأقل');

    setLoading(true);
    try {
      await api.post(
        '/auth/register',
        { name: n, phone: p, password: pw, role: 'customer', locale: 'ar' },
        { headers: { 'x-client': 'web' } }
      );

      router.push(`/login?phone=${encodeURIComponent(p)}&next=${encodeURIComponent(next)}`);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'فشل إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir="rtl" className="mx-auto max-w-lg px-6 py-12">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-extrabold text-kaffza-primary">إنشاء حساب</div>
        <Link className="text-sm font-bold text-kaffza-text/70 underline" href="/">
          الرئيسية
        </Link>
      </div>

      <Card className="mt-6 p-6">
        <div className="text-sm text-kaffza-text/80">سجّل كعميل جديد. سيتم إرسال OTP لتفعيل حسابك.</div>

        {msg ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{msg}</div> : null}

        <div className="mt-5 grid gap-3">
          <Field label="الاسم الكامل">
            <Input value={name} onChange={(e: any) => setName(e.target.value)} placeholder="محمد" />
          </Field>

          <Field label="رقم الهاتف">
            <Input value={phone} onChange={(e: any) => setPhone(e.target.value)} placeholder="+96891234567" />
            <Hint>صيغة عمانية: +968XXXXXXXX</Hint>
          </Field>

          <Field label="كلمة المرور">
            <Input value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="********" type="password" />
            <Hint>8 أحرف/أرقام على الأقل</Hint>
          </Field>

          <Button onClick={submit} disabled={!canSubmit || loading}>
            {loading ? 'جارٍ الإنشاء...' : 'إنشاء حساب'}
          </Button>

          <div className="text-sm">
            عندك حساب؟{' '}
            <Link className="font-bold text-kaffza-primary underline" href={`/login?next=${encodeURIComponent(next)}`}>
              تسجيل الدخول
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

export default function RegisterPage() { return <Suspense><RegisterPageInner /></Suspense>; }
