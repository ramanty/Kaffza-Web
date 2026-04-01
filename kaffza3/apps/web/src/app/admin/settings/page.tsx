'use client';

import { useEffect, useMemo, useState } from 'react';

import { api } from '../../../lib/api';
import { authHeader } from '../../../lib/auth';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const [form, setForm] = useState<any>({
    appName: '',
    appUrl: '',
    supportEmail: '',
    thawaniApiUrl: '',
    escrowNewMerchantDays: 14,
    escrowStandardDays: 7,
    escrowTrustedDays: 3,
    walletMinWithdrawal: 10,
    maintenanceMode: false,
  });

  const load = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.get('/admin/settings', { headers: { ...authHeader(), 'x-client': 'web' } });
      setForm(res?.data?.data || form);
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'تعذر تحميل الإعدادات' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSave = useMemo(() => {
    return String(form.appName || '').trim().length >= 2 && String(form.appUrl || '').trim().length >= 5;
  }, [form]);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await api.patch('/admin/settings', form, { headers: { ...authHeader(), 'x-client': 'web' } });
      setForm(res?.data?.data || form);
      setMsg({ type: 'success', text: 'تم حفظ الإعدادات' });
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'فشل حفظ الإعدادات' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-kaffza-primary">إعدادات المنصة</h1>
        <p className="mt-1 text-sm text-kaffza-text/80">إعدادات عامة للمنصة (Admin). يتم حفظها في Redis وتظهر فوراً في لوحة الإدارة.</p>
      </div>

      {msg ? (
        <div
          className={
            'rounded-xl border p-4 text-sm ' +
            (msg.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700')
          }
        >
          {msg.text}
        </div>
      ) : null}

      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="اسم المنصة">
            <Input value={form.appName} onChange={(e: any) => setForm({ ...form, appName: e.target.value })} />
          </Field>
          <Field label="رابط المنصة">
            <Input value={form.appUrl} onChange={(e: any) => setForm({ ...form, appUrl: e.target.value })} />
          </Field>
          <Field label="بريد الدعم">
            <Input value={form.supportEmail} onChange={(e: any) => setForm({ ...form, supportEmail: e.target.value })} />
          </Field>
          <Field label="Thawani API URL">
            <Input value={form.thawaniApiUrl} onChange={(e: any) => setForm({ ...form, thawaniApiUrl: e.target.value })} />
          </Field>

          <Field label="Escrow — تاجر جديد (أيام)">
            <Input
              type="number"
              value={String(form.escrowNewMerchantDays)}
              onChange={(e: any) => setForm({ ...form, escrowNewMerchantDays: Number(e.target.value) })}
            />
          </Field>
          <Field label="Escrow — عادي (أيام)">
            <Input
              type="number"
              value={String(form.escrowStandardDays)}
              onChange={(e: any) => setForm({ ...form, escrowStandardDays: Number(e.target.value) })}
            />
          </Field>
          <Field label="Escrow — موثوق (أيام)">
            <Input
              type="number"
              value={String(form.escrowTrustedDays)}
              onChange={(e: any) => setForm({ ...form, escrowTrustedDays: Number(e.target.value) })}
            />
          </Field>
          <Field label="الحد الأدنى للسحب (OMR)">
            <Input
              type="number"
              value={String(form.walletMinWithdrawal)}
              onChange={(e: any) => setForm({ ...form, walletMinWithdrawal: Number(e.target.value) })}
            />
          </Field>

          <div className="flex items-center gap-2">
            <input
              id="maint"
              type="checkbox"
              checked={!!form.maintenanceMode}
              onChange={(e) => setForm({ ...form, maintenanceMode: e.target.checked })}
            />
            <label htmlFor="maint" className="text-sm font-bold text-kaffza-text">وضع الصيانة</label>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <Button onClick={save} disabled={!canSave || saving || loading}>
            {saving ? 'جارٍ الحفظ...' : 'حفظ'}
          </Button>
          <Button variant="secondary" onClick={load} disabled={loading || saving}>
            إعادة تحميل
          </Button>
        </div>
      </Card>
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
