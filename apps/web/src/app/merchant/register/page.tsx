'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { api } from '../../../lib/api';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';

const OMAN_PHONE_RE = /^\+968[0-9]{8}$/;

export default function MerchantRegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const emailOk = useMemo(() => !email.trim() || /.+@.+\..+/.test(email.trim()), [email]);
  const canSubmit = useMemo(() => {
    return (
      name.trim().length >= 2 &&
      OMAN_PHONE_RE.test(phone.trim()) &&
      password.trim().length >= 8 &&
      password.trim() === confirm.trim() &&
      emailOk
    );
  }, [name, phone, password, confirm, emailOk]);

  const submit = async () => {
    setMsg(null);
    const n = name.trim();
    const p = phone.trim();
    const e = email.trim();
    const pw = password.trim();

    if (n.length < 2) return setMsg({ type: 'error', text: 'الاسم لازم يكون حرفين على الأقل' });
    if (!OMAN_PHONE_RE.test(p)) return setMsg({ type: 'error', text: 'رقم الهاتف لازم يكون بصيغة عُمانية صحيحة: +968XXXXXXXX' });
    if (pw.length < 8) return setMsg({ type: 'error', text: 'كلمة المرور لازم تكون 8 أحرف/أرقام على الأقل' });
    if (pw !== confirm.trim()) return setMsg({ type: 'error', text: 'تأكيد كلمة المرور غير مطابق' });
    if (!emailOk) return setMsg({ type: 'error', text: 'البريد الإلكتروني غير صحيح' });

    setLoading(true);
    try {
      await api.post(
        '/auth/register',
        { name: n, phone: p, email: e || undefined, password: pw, role: 'merchant', locale: 'ar' },
        { headers: { 'x-client': 'web' } }
      );

      router.push('/merchant/login?registered=1');
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'فشل إنشاء الحساب' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir="rtl" className="mx-auto max-w-lg px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-kaffza-text/70">منطقة التاجر</div>
          <div className="text-2xl font-extrabold text-kaffza-primary">تسجيل تاجر جديد</div>
        </div>
        <Link className="text-sm font-bold text-kaffza-text/70 underline" href="/">
          الرئيسية
        </Link>
      </div>

      <Card className="mt-6 p-6">
        <p className="text-sm text-kaffza-text/80">أنشئ حساب تاجر جديد ثم سجّل دخولك.</p>

        {msg ? (
          <div className={'mt-4 rounded-xl border p-3 text-sm ' + (msg.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700')}>
            {msg.text}
          </div>
        ) : null}

        <div className="mt-5 grid gap-3">
          <Field label="الاسم الكامل">
            <Input value={name} onChange={(e: any) => setName(e.target.value)} placeholder="محمد" />
          </Field>

          <Field label="رقم الهاتف">
            <Input value={phone} onChange={(e: any) => setPhone(e.target.value)} placeholder="+96891234567" />
            <Hint>صيغة عمانية: +968XXXXXXXX</Hint>
          </Field>

          <Field label="البريد الإلكتروني (اختياري)">
            <Input value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="merchant@example.com" />
          </Field>

          <Field label="كلمة المرور">
            <Input value={password} onChange={(e: any) => setPassword(e.target.value)} type="password" placeholder="********" />
            <Hint>8 أحرف/أرقام على الأقل</Hint>
          </Field>

          <Field label="تأكيد كلمة المرور">
            <Input value={confirm} onChange={(e: any) => setConfirm(e.target.value)} type="password" placeholder="********" />
          </Field>

          <Button onClick={submit} disabled={!canSubmit || loading}>
            {loading ? 'جارٍ التسجيل...' : 'تسجيل'}
          </Button>

          <div className="text-sm">
            عندك حساب؟{' '}
            <Link className="font-bold text-kaffza-primary underline" href="/merchant/login">
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
