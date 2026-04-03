'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { api } from '../../lib/api';
import { authHeader, clearAuthCookiesClientSide, getAccessTokenFromCookies } from '../../lib/auth';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

type Me = {
  id: number;
  name: string;
  email?: string | null;
  phone: string;
  role: string;
};

function AccountPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/account';

  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // change password modal
  const [openPw, setOpenPw] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const validProfile = useMemo(() => name.trim().length >= 2 && (!email.trim() || /.+@.+\..+/.test(email.trim())), [name, email]);
  const validPw = useMemo(() => oldPw.trim().length >= 1 && newPw.trim().length >= 8 && newPw.trim() === confirmPw.trim(), [oldPw, newPw, confirmPw]);

  const setError = (text: string) => setMsg({ type: 'error', text });
  const setSuccess = (text: string) => setMsg({ type: 'success', text });

  const guard = () => {
    const token = getAccessTokenFromCookies();
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent('/account')}`);
      return false;
    }
    return true;
  };

  const load = async () => {
    if (!guard()) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.get('/auth/me', { headers: { ...authHeader(), 'x-client': 'web' } });
      const u = res?.data?.data;
      setMe(u);
      setName(u?.name || '');
      setEmail(u?.email || '');
    } catch (e: any) {
      if (e?.response?.status === 401) {
        router.replace(`/login?next=${encodeURIComponent('/account')}`);
        return;
      }
      setError(e?.response?.data?.message || 'تعذر تحميل بيانات الحساب');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = async () => {
    if (!validProfile) {
      setError('تحقق من الاسم والبريد الإلكتروني');
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await api.patch('/auth/me', { name: name.trim(), email: email.trim() || null }, { headers: { ...authHeader(), 'x-client': 'web' } });
      setSuccess('تم حفظ البيانات');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'فشل حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!validPw) {
      setError('تحقق من كلمة المرور القديمة والجديدة (8 أحرف) وتأكيدها');
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await api.post('/auth/change-password', { oldPassword: oldPw.trim(), newPassword: newPw.trim() }, { headers: { ...authHeader(), 'x-client': 'web' } });
      setSuccess('تم تغيير كلمة المرور');
      setOpenPw(false);
      setOldPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'فشل تغيير كلمة المرور');
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', {}, { headers: { 'x-client': 'web' } });
    } catch {
      // ignore
    }
    try {
      clearAuthCookiesClientSide();
      document.cookie = 'kaffza_store=; Path=/; Max-Age=0; SameSite=Lax';
    } catch {
      // ignore
    }
    router.push('/');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-kaffza-primary">الحساب الشخصي</h1>
        <p className="mt-1 text-sm text-kaffza-text/80">إدارة بياناتك وتغيير كلمة المرور.</p>
      </div>

      {msg ? (
        <div className={
          'rounded-xl border p-4 text-sm ' +
          (msg.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700')
        }>
          {msg.text}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-extrabold text-kaffza-primary">معلومات الحساب</div>
            <Button variant="secondary" onClick={load} disabled={loading}>
              تحديث
            </Button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="الاسم الكامل">
              <Input value={name} onChange={(e: any) => setName(e.target.value)} placeholder="محمد" />
            </Field>

            <Field label="البريد الإلكتروني (اختياري)">
              <Input value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="user@example.com" />
            </Field>

            <Field label="رقم الهاتف">
              <Input value={me?.phone || ''} disabled />
            </Field>

            <Field label="الدور">
              <Input value={me?.role || ''} disabled />
            </Field>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={saveProfile} disabled={saving || loading || !validProfile}>
              {saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
            </Button>
            <Button variant="secondary" onClick={() => setOpenPw(true)}>
              تغيير كلمة المرور
            </Button>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-1">
          <div className="text-sm font-extrabold text-kaffza-primary">إجراءات</div>
          <p className="mt-1 text-xs text-kaffza-text/70">يمكنك تسجيل الخروج من حسابك هنا.</p>

          <div className="mt-4">
            <Button variant="secondary" className="w-full" onClick={logout}>
              تسجيل خروج
            </Button>
          </div>
        </Card>
      </div>

      {openPw ? (
        <Modal title="تغيير كلمة المرور" onClose={() => setOpenPw(false)}>
          <div className="grid gap-3">
            <Field label="كلمة المرور القديمة">
              <Input value={oldPw} onChange={(e: any) => setOldPw(e.target.value)} type="password" placeholder="********" />
            </Field>
            <Field label="كلمة المرور الجديدة">
              <Input value={newPw} onChange={(e: any) => setNewPw(e.target.value)} type="password" placeholder="********" />
              <Hint>8 أحرف/أرقام على الأقل</Hint>
            </Field>
            <Field label="تأكيد كلمة المرور الجديدة">
              <Input value={confirmPw} onChange={(e: any) => setConfirmPw(e.target.value)} type="password" placeholder="********" />
            </Field>

            <div className="mt-2 flex gap-2">
              <Button onClick={changePassword} disabled={saving || !validPw}>
                {saving ? 'جارٍ التغيير...' : 'تأكيد'}
              </Button>
              <Button variant="secondary" onClick={() => setOpenPw(false)}>
                إلغاء
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
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
  return <div className="text-xs text-kaffza-text/60">{children}</div>;
}

function Modal({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div className="text-lg font-extrabold text-kaffza-primary">{title}</div>
          <button className="text-sm font-bold text-kaffza-text/70" onClick={onClose}>
            إغلاق
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export default function AccountPage() { return <Suspense><AccountPageInner /></Suspense>; }
