'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
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
  abandonedCartDiscountEnabled: boolean;
  abandonedCartDiscountPercent: number;
  reminderCadencePreset: 'gentle' | 'standard' | 'aggressive';
  campaignScheduleMode: 'manual' | 'scheduled';
  campaignTimezone: string;
  welcomeAutomationEnabled: boolean;
  lowStockAlertEnabled: boolean;
};

function GrowthPageInner() {
  const sp = useSearchParams();
  const isEn = sp.get('lang') === 'en';
  const { storeId } = useStore();
  const [loading, setLoading] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<Automation>({
    abandonedCartEnabled: false,
    abandonedCartDelayMin: 60,
    abandonedCartChannels: ['sms'],
    abandonedCartDiscountEnabled: false,
    abandonedCartDiscountPercent: 10,
    reminderCadencePreset: 'standard',
    campaignScheduleMode: 'manual',
    campaignTimezone: 'Asia/Muscat',
    welcomeAutomationEnabled: false,
    lowStockAlertEnabled: true,
  });

  const t = useMemo(
    () =>
      isEn
        ? {
            title: 'Growth & Automation Hub',
            subtitle:
              'Configure cart recovery incentives, reminder cadence, and campaign scheduling defaults.',
            loadError: 'Failed to load growth settings',
            saveError: 'Failed to save settings',
            saveSuccess: 'Automation settings saved successfully',
            loading: 'Loading growth settings...',
            retry: 'Retry',
            abandonToggle: 'Enable abandoned cart recovery',
            delayLabel: 'First reminder delay (minutes)',
            delayHint: 'Example: first reminder 60 minutes after cart abandonment.',
            channels: 'Reminder channels',
            discountToggle: 'Enable abandoned-cart discount offer',
            discountLabel: 'Discount value (%)',
            cadenceLabel: 'Reminder cadence preset',
            scheduleLabel: 'Campaign scheduling mode',
            timezoneLabel: 'Campaign timezone',
            welcomeToggle: 'Send welcome message after signup',
            stockToggle: 'Low stock alerts',
            save: 'Save growth settings',
            saving: 'Saving...',
            presets: {
              gentle: 'Gentle (single reminder)',
              standard: 'Standard (3 reminders)',
              aggressive: 'Aggressive (hourly sequence)',
            },
            scheduleModes: {
              manual: 'Manual launch',
              scheduled: 'Scheduled by default',
            },
            campaignsCta: 'Open campaign manager',
            validationChannels: 'Select at least one reminder channel.',
            validationDiscount: 'Discount must be between 1% and 90%.',
            validationTimezone: 'Timezone is required when scheduling campaigns.',
            readyTitle: 'Current growth posture',
            readyState: (count: number) => `${count}/4 automations enabled`,
          }
        : {
            title: 'مركز النمو والأتمتة',
            subtitle:
              'اضبط حوافز استرجاع السلات، وتواتر التذكيرات، وإعدادات جدولة الحملات بشكل افتراضي.',
            loadError: 'تعذر تحميل إعدادات النمو',
            saveError: 'تعذر حفظ الإعدادات',
            saveSuccess: 'تم حفظ إعدادات الأتمتة بنجاح',
            loading: 'جارٍ تحميل إعدادات النمو...',
            retry: 'إعادة المحاولة',
            abandonToggle: 'تفعيل استرجاع السلات المتروكة',
            delayLabel: 'تأخير التذكير الأول (بالدقائق)',
            delayHint: 'مثال: إرسال أول تذكير بعد 60 دقيقة من ترك السلة.',
            channels: 'قنوات التذكير',
            discountToggle: 'تفعيل خصم السلة المتروكة',
            discountLabel: 'قيمة الخصم (%)',
            cadenceLabel: 'نمط تواتر التذكيرات',
            scheduleLabel: 'وضع جدولة الحملات',
            timezoneLabel: 'المنطقة الزمنية للحملات',
            welcomeToggle: 'تفعيل رسالة الترحيب بعد التسجيل',
            stockToggle: 'تنبيهات انخفاض المخزون',
            save: 'حفظ إعدادات النمو',
            saving: 'جارٍ الحفظ...',
            presets: {
              gentle: 'هادئ (تذكير واحد)',
              standard: 'قياسي (3 تذكيرات)',
              aggressive: 'مكثف (تسلسل كل ساعة)',
            },
            scheduleModes: {
              manual: 'تشغيل يدوي',
              scheduled: 'مجدول افتراضياً',
            },
            campaignsCta: 'فتح مدير الحملات',
            validationChannels: 'اختر قناة تذكير واحدة على الأقل.',
            validationDiscount: 'قيمة الخصم يجب أن تكون بين 1% و 90%.',
            validationTimezone: 'المنطقة الزمنية مطلوبة عند تفعيل الجدولة.',
            readyTitle: 'جاهزية النمو الحالية',
            readyState: (count: number) => `تم تفعيل ${count}/4 من الأتمتة`,
          },
    [isEn]
  );
  const enabledAutomations = [
    form.abandonedCartEnabled,
    form.abandonedCartDiscountEnabled,
    form.welcomeAutomationEnabled,
    form.lowStockAlertEnabled,
  ].filter(Boolean).length;
  const validationError = useMemo(() => {
    if (form.abandonedCartEnabled && form.abandonedCartChannels.length === 0) {
      return t.validationChannels;
    }
    if (
      form.abandonedCartDiscountEnabled &&
      (form.abandonedCartDiscountPercent < 1 || form.abandonedCartDiscountPercent > 90)
    ) {
      return t.validationDiscount;
    }
    if (form.campaignScheduleMode === 'scheduled' && !form.campaignTimezone.trim()) {
      return t.validationTimezone;
    }
    return null;
  }, [form, t]);

  async function load() {
    if (!storeId) {
      setLoading(false);
      setInitialLoadDone(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/stores/${storeId}/automation`, {
        headers: { ...authHeader(), 'x-client': 'web' },
      });
      setForm((prev) => ({
        ...prev,
        ...(res?.data?.data || {}),
      }));
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || t.loadError);
    } finally {
      setLoading(false);
      setInitialLoadDone(true);
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
      setSuccess(t.saveSuccess);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || t.saveError);
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

  function withLang(path: string) {
    return isEn ? `${path}?lang=en` : path;
  }

  useEffect(() => {
    load();
  }, [storeId, isEn]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-primary text-2xl font-extrabold">{t.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t.subtitle}</p>
        </div>
        <Link href={withLang('/dashboard/campaigns')}>
          <Button variant="secondary">{t.campaignsCta}</Button>
        </Link>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <div className="mt-3">
            <Button variant="secondary" onClick={load} disabled={loading}>
              {t.retry}
            </Button>
          </div>
        </div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      ) : null}
      {validationError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {validationError}
        </div>
      ) : null}

      {loading && !initialLoadDone ? (
        <Card className="space-y-3 border-border p-6">
          <div className="text-primary text-sm font-bold">{t.loading}</div>
          <div className="h-3 w-48 animate-pulse rounded bg-black/10" />
          <div className="h-3 w-64 animate-pulse rounded bg-black/10" />
        </Card>
      ) : (
        <>
          <Card className="border-border p-4">
            <div className="text-primary text-sm font-extrabold">{t.readyTitle}</div>
            <p className="text-muted-foreground mt-1 text-sm">{t.readyState(enabledAutomations)}</p>
          </Card>

          <Card className="space-y-5 p-6">
            <SwitchRow
              label={t.abandonToggle}
              checked={form.abandonedCartEnabled}
              onChange={(checked) => setForm((s) => ({ ...s, abandonedCartEnabled: checked }))}
            />

            <div className="grid gap-2">
              <label className="text-foreground text-sm font-bold">{t.delayLabel}</label>
              <Input
                type="number"
                min={5}
                max={10080}
                value={String(form.abandonedCartDelayMin)}
                onChange={(e: any) =>
                  setForm((s) => ({ ...s, abandonedCartDelayMin: Number(e.target.value || 60) }))
                }
              />
              <p className="text-muted-foreground text-xs">{t.delayHint}</p>
            </div>

            <div>
              <div className="text-foreground text-sm font-bold">{t.channels}</div>
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
                          ? 'border-kaffza-primary bg-primary text-white'
                          : 'text-foreground border-border bg-card text-card-foreground')
                      }
                    >
                      {ch.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            <SwitchRow
              label={t.discountToggle}
              checked={form.abandonedCartDiscountEnabled}
              onChange={(checked) =>
                setForm((s) => ({ ...s, abandonedCartDiscountEnabled: checked }))
              }
            />

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-foreground text-sm font-bold">{t.discountLabel}</label>
                <Input
                  type="number"
                  min={1}
                  max={90}
                  value={String(form.abandonedCartDiscountPercent)}
                  onChange={(e: any) =>
                    setForm((s) => ({
                      ...s,
                      abandonedCartDiscountPercent: Number(e.target.value || 10),
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <label className="text-foreground text-sm font-bold">{t.timezoneLabel}</label>
                <Input
                  value={form.campaignTimezone || ''}
                  onChange={(e: any) =>
                    setForm((s) => ({ ...s, campaignTimezone: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-foreground text-sm font-bold">{t.cadenceLabel}</label>
                <select
                  className="text-foreground rounded-lg border border-border bg-card text-card-foreground px-3 py-2 text-sm font-semibold"
                  value={form.reminderCadencePreset}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      reminderCadencePreset: e.target.value as Automation['reminderCadencePreset'],
                    }))
                  }
                >
                  <option value="gentle">{t.presets.gentle}</option>
                  <option value="standard">{t.presets.standard}</option>
                  <option value="aggressive">{t.presets.aggressive}</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-foreground text-sm font-bold">{t.scheduleLabel}</label>
                <select
                  className="text-foreground rounded-lg border border-border bg-card text-card-foreground px-3 py-2 text-sm font-semibold"
                  value={form.campaignScheduleMode}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      campaignScheduleMode: e.target.value as Automation['campaignScheduleMode'],
                    }))
                  }
                >
                  <option value="manual">{t.scheduleModes.manual}</option>
                  <option value="scheduled">{t.scheduleModes.scheduled}</option>
                </select>
              </div>
            </div>

            <SwitchRow
              label={t.welcomeToggle}
              checked={form.welcomeAutomationEnabled}
              onChange={(checked) => setForm((s) => ({ ...s, welcomeAutomationEnabled: checked }))}
            />

            <SwitchRow
              label={t.stockToggle}
              checked={form.lowStockAlertEnabled}
              onChange={(checked) => setForm((s) => ({ ...s, lowStockAlertEnabled: checked }))}
            />

            <div>
              <Button onClick={save} disabled={saving || loading || !!validationError}>
                {saving ? t.saving : t.save}
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

export default function GrowthPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground text-sm">Loading...</div>}>
      <GrowthPageInner />
    </Suspense>
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
    <label className="bg-background flex items-center justify-between rounded-xl border border-border px-4 py-3">
      <span className="text-foreground text-sm font-semibold">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={
          'h-7 w-12 rounded-full p-1 transition ' + (checked ? 'bg-primary' : 'bg-slate-300')
        }
      >
        <span
          className={
            'block h-5 w-5 rounded-full bg-card text-card-foreground transition-transform ' +
            (checked ? 'translate-x-5' : 'translate-x-0')
          }
        />
      </button>
    </label>
  );
}
