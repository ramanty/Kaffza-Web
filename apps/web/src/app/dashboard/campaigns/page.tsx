'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { api } from '../../../lib/api';
import { authHeader } from '../../../lib/auth';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Input } from '../../../components/Input';
import { useStore } from '../store-context';

type Campaign = {
  id: string;
  nameAr: string;
  nameEn: string;
  objective: string;
  channel: 'sms' | 'whatsapp' | 'email' | 'push';
  audience: 'all_customers' | 'returning_customers' | 'new_customers' | 'abandoned_cart';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  discountPercent: number | null;
  reminderCadencePreset: 'gentle' | 'standard' | 'aggressive';
  scheduledAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
};

type CampaignForm = {
  nameAr: string;
  nameEn: string;
  objective: string;
  channel: Campaign['channel'];
  audience: Campaign['audience'];
  status: Campaign['status'];
  discountPercent: string;
  reminderCadencePreset: Campaign['reminderCadencePreset'];
  startsAt: string;
  endsAt: string;
};

function CampaignsPageInner() {
  const sp = useSearchParams();
  const isEn = sp.get('lang') === 'en';
  const { storeId } = useStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [form, setForm] = useState<CampaignForm>({
    nameAr: '',
    nameEn: '',
    objective: 'sales_boost',
    channel: 'sms',
    audience: 'all_customers',
    status: 'draft',
    discountPercent: '',
    reminderCadencePreset: 'standard',
    startsAt: '',
    endsAt: '',
  });

  const t = useMemo(
    () =>
      isEn
        ? {
            title: 'Campaign Manager',
            subtitle: 'Create lightweight campaign definitions and keep a clear launch queue.',
            createTitle: 'Create campaign',
            listTitle: 'Recent campaigns',
            nameAr: 'Arabic name',
            nameEn: 'English name',
            objective: 'Objective',
            channel: 'Channel',
            audience: 'Audience',
            status: 'Status',
            discount: 'Discount (%)',
            cadence: 'Reminder cadence',
            startsAt: 'Start date',
            endsAt: 'End date',
            createBtn: 'Create campaign',
            creating: 'Creating...',
            empty: 'No campaigns yet. Create your first one now.',
            failedLoad: 'Failed to load campaigns',
            failedSave: 'Failed to create campaign',
          }
        : {
            title: 'مدير الحملات',
            subtitle: 'أنشئ تعريفات حملات بسيطة واحتفظ بقائمة إطلاق واضحة.',
            createTitle: 'إنشاء حملة',
            listTitle: 'أحدث الحملات',
            nameAr: 'الاسم بالعربية',
            nameEn: 'الاسم بالإنجليزية',
            objective: 'الهدف',
            channel: 'القناة',
            audience: 'الجمهور',
            status: 'الحالة',
            discount: 'الخصم (%)',
            cadence: 'تواتر التذكير',
            startsAt: 'تاريخ البداية',
            endsAt: 'تاريخ النهاية',
            createBtn: 'إنشاء الحملة',
            creating: 'جارٍ الإنشاء...',
            empty: 'لا توجد حملات بعد. أنشئ أول حملة الآن.',
            failedLoad: 'تعذر تحميل الحملات',
            failedSave: 'تعذر إنشاء الحملة',
          },
    [isEn]
  );

  async function load() {
    if (!storeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/stores/${storeId}/campaigns`, {
        headers: { ...authHeader(), 'x-client': 'web' },
      });
      setCampaigns(res?.data?.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || t.failedLoad);
    } finally {
      setLoading(false);
    }
  }

  async function createCampaign() {
    if (!storeId) return;
    setSaving(true);
    setError(null);
    try {
      await api.post(
        `/stores/${storeId}/campaigns`,
        {
          ...form,
          discountPercent: form.discountPercent ? Number(form.discountPercent) : undefined,
          startsAt: form.startsAt || undefined,
          endsAt: form.endsAt || undefined,
        },
        { headers: { ...authHeader(), 'x-client': 'web' } }
      );
      await load();
      setForm((prev) => ({
        ...prev,
        nameAr: '',
        nameEn: '',
        discountPercent: '',
        startsAt: '',
        endsAt: '',
      }));
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || t.failedSave);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
  }, [storeId, isEn]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-primary text-2xl font-extrabold">{t.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t.subtitle}</p>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Card className="space-y-4 p-5">
        <h2 className="text-primary text-base font-extrabold">{t.createTitle}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder={t.nameAr}
            value={form.nameAr}
            onChange={(e: any) => setForm((s) => ({ ...s, nameAr: e.target.value }))}
          />
          <Input
            placeholder={t.nameEn}
            value={form.nameEn}
            onChange={(e: any) => setForm((s) => ({ ...s, nameEn: e.target.value }))}
          />
          <Input
            placeholder={t.objective}
            value={form.objective}
            onChange={(e: any) => setForm((s) => ({ ...s, objective: e.target.value }))}
          />
          <Input
            type="number"
            min={1}
            max={90}
            placeholder={t.discount}
            value={form.discountPercent}
            onChange={(e: any) => setForm((s) => ({ ...s, discountPercent: e.target.value }))}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <SelectRow
            label={t.channel}
            value={form.channel}
            onChange={(value) => setForm((s) => ({ ...s, channel: value as Campaign['channel'] }))}
            options={[
              { value: 'sms', label: 'SMS' },
              { value: 'whatsapp', label: 'WhatsApp' },
              { value: 'email', label: 'Email' },
              { value: 'push', label: 'Push' },
            ]}
          />
          <SelectRow
            label={t.audience}
            value={form.audience}
            onChange={(value) =>
              setForm((s) => ({ ...s, audience: value as Campaign['audience'] }))
            }
            options={[
              { value: 'all_customers', label: isEn ? 'All customers' : 'كل العملاء' },
              { value: 'returning_customers', label: isEn ? 'Returning' : 'العائدون' },
              { value: 'new_customers', label: isEn ? 'New' : 'الجدد' },
              { value: 'abandoned_cart', label: isEn ? 'Abandoned cart' : 'سلات متروكة' },
            ]}
          />
          <SelectRow
            label={t.status}
            value={form.status}
            onChange={(value) => setForm((s) => ({ ...s, status: value as Campaign['status'] }))}
            options={[
              { value: 'draft', label: isEn ? 'Draft' : 'مسودة' },
              { value: 'scheduled', label: isEn ? 'Scheduled' : 'مجدولة' },
              { value: 'active', label: isEn ? 'Active' : 'نشطة' },
              { value: 'paused', label: isEn ? 'Paused' : 'موقوفة' },
              { value: 'completed', label: isEn ? 'Completed' : 'مكتملة' },
            ]}
          />
          <SelectRow
            label={t.cadence}
            value={form.reminderCadencePreset}
            onChange={(value) =>
              setForm((s) => ({
                ...s,
                reminderCadencePreset: value as Campaign['reminderCadencePreset'],
              }))
            }
            options={[
              { value: 'gentle', label: isEn ? 'Gentle' : 'هادئ' },
              { value: 'standard', label: isEn ? 'Standard' : 'قياسي' },
              { value: 'aggressive', label: isEn ? 'Aggressive' : 'مكثف' },
            ]}
          />
          <div className="grid gap-1">
            <label className="text-foreground text-xs font-bold">{t.startsAt}</label>
            <Input
              type="date"
              value={form.startsAt}
              onChange={(e: any) => setForm((s) => ({ ...s, startsAt: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <label className="text-foreground text-xs font-bold">{t.endsAt}</label>
            <Input
              type="date"
              value={form.endsAt}
              onChange={(e: any) => setForm((s) => ({ ...s, endsAt: e.target.value }))}
            />
          </div>
        </div>

        <Button
          disabled={saving || !form.nameAr.trim() || !form.nameEn.trim()}
          onClick={createCampaign}
        >
          {saving ? t.creating : t.createBtn}
        </Button>
      </Card>

      <Card className="p-5">
        <h2 className="text-primary text-base font-extrabold">{t.listTitle}</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b border-border text-right">
                <th className="px-2 py-2">{isEn ? 'Campaign' : 'الحملة'}</th>
                <th className="px-2 py-2">{t.channel}</th>
                <th className="px-2 py-2">{t.audience}</th>
                <th className="px-2 py-2">{t.status}</th>
                <th className="px-2 py-2">{isEn ? 'Window' : 'الفترة'}</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-border">
                  <td className="px-2 py-2 font-semibold">{isEn ? c.nameEn : c.nameAr}</td>
                  <td className="px-2 py-2">{c.channel.toUpperCase()}</td>
                  <td className="px-2 py-2">{c.audience}</td>
                  <td className="px-2 py-2">{c.status}</td>
                  <td className="px-2 py-2">
                    {c.startsAt ? c.startsAt.slice(0, 10) : '—'} →{' '}
                    {c.endsAt ? c.endsAt.slice(0, 10) : '—'}
                  </td>
                </tr>
              ))}
              {!loading && campaigns.length === 0 ? (
                <tr>
                  <td className="text-muted-foreground px-2 py-4" colSpan={5}>
                    {t.empty}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground text-sm">...</div>}>
      <CampaignsPageInner />
    </Suspense>
  );
}

function SelectRow({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="grid gap-1">
      <label className="text-foreground text-xs font-bold">{label}</label>
      <select
        className="text-foreground rounded-lg border border-border bg-card text-card-foreground px-3 py-2 text-sm font-semibold"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
