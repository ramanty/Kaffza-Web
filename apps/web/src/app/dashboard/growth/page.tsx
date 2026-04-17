'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { authHeader } from '../../../lib/auth';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Input } from '../../../components/Input';
import { useStore } from '../store-context';

type Automation = {
  abandonedCartEnabled: boolean;
  abandonedCartDelayMin: number;
  abandonedCartChannels: string[];
  welcomeAutomationEnabled: boolean;
  lowStockAlertEnabled: boolean;
};

export default function GrowthPage() {
  const { storeId } = useStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<Automation>({
    abandonedCartEnabled: false,
    abandonedCartDelayMin: 60,
    abandonedCartChannels: ['sms'],
    welcomeAutomationEnabled: false,
    lowStockAlertEnabled: true,
  });

  async function load() {
    if (!storeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/stores/${storeId}/automation`, {
        headers: { ...authHeader(), 'x-client': 'web' },
      });
      setForm(res?.data?.data || form);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'تعذر تحميل إعدادات النمو');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!storeId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.patch(`/stores/${storeId}/automation`, form, {
        headers: { ...authHeader(), 'x-client': 'web' },
      });
      setSuccess('تم حفظ إعدادات الأتمتة بنجاح');
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'تعذر حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  }

  function toggleChannel(channel: string) {
    setForm((prev) => {
      const has = prev.abandonedCartChannels.includes(channel);
      const next = has
        ? prev.abandonedCartChannels.filter((x) => x !== channel)
        : [...prev.abandonedCartChannels, channel];
      return { ...prev, abandonedCartChannels: next };
    });
  }

  useEffect(() => {
    load();
     
  }, [storeId]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-kaffza-primary text-2xl font-extrabold">مركز النمو والتسويق</h1>
        <p className="text-kaffza-text/70 mt-1 text-sm">
          فعّل الحملات الآلية: استرجاع السلات المتروكة، رسائل الترحيب، وتنبيهات المخزون.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <Card className="space-y-5 p-6">
        <SwitchRow
          label="تفعيل استرجاع السلات المتروكة"
          checked={form.abandonedCartEnabled}
          onChange={(checked) => setForm((s) => ({ ...s, abandonedCartEnabled: checked }))}
        />

        <div className="grid gap-2">
          <label className="text-kaffza-text text-sm font-bold">مدة التذكير (بالدقائق)</label>
          <Input
            type="number"
            min={5}
            max={10080}
            value={String(form.abandonedCartDelayMin)}
            onChange={(e: any) =>
              setForm((s) => ({ ...s, abandonedCartDelayMin: Number(e.target.value || 60) }))
            }
          />
          <p className="text-kaffza-text/60 text-xs">
            مثال: 60 دقيقة بعد ترك العميل للسلة بدون إتمام الطلب.
          </p>
        </div>

        <div>
          <div className="text-kaffza-text text-sm font-bold">قنوات التذكير</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {['sms', 'whatsapp', 'email'].map((ch) => {
              const active = form.abandonedCartChannels.includes(ch);
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => toggleChannel(ch)}
                  className={
                    'rounded-lg border px-3 py-2 text-sm font-semibold ' +
                    (active
                      ? 'border-kaffza-primary bg-kaffza-primary text-white'
                      : 'text-kaffza-text border-slate-200 bg-white')
                  }
                >
                  {ch.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        <SwitchRow
          label="تفعيل رسالة الترحيب بعد التسجيل"
          checked={form.welcomeAutomationEnabled}
          onChange={(checked) => setForm((s) => ({ ...s, welcomeAutomationEnabled: checked }))}
        />

        <SwitchRow
          label="تنبيهات انخفاض المخزون"
          checked={form.lowStockAlertEnabled}
          onChange={(checked) => setForm((s) => ({ ...s, lowStockAlertEnabled: checked }))}
        />

        <div>
          <Button onClick={save} disabled={saving || loading}>
            {saving ? 'جارٍ الحفظ...' : 'حفظ إعدادات النمو'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function SwitchRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="bg-kaffza-bg flex items-center justify-between rounded-xl border border-black/5 px-4 py-3">
      <span className="text-kaffza-text text-sm font-semibold">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={
          'h-7 w-12 rounded-full p-1 transition ' + (checked ? 'bg-kaffza-primary' : 'bg-slate-300')
        }
      >
        <span
          className={
            'block h-5 w-5 rounded-full bg-white transition-transform ' +
            (checked ? 'translate-x-5' : 'translate-x-0')
          }
        />
      </button>
    </label>
  );
}
