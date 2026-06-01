'use client';

import { useEffect, useMemo, useState } from 'react';

import { api } from '../../../lib/api';
import { authHeader } from '../../../lib/auth';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { useStore } from '../store-context';

const STATUS_OPTIONS = [
  { label: 'pending', value: 'pending' },
  { label: 'processing', value: 'in_transit' },
  { label: 'shipped', value: 'out_for_delivery' },
  { label: 'delivered', value: 'delivered' },
  { label: 'returned', value: 'returned' },
];

type ShippingZone = {
  code: string;
  nameAr: string;
  nameEn: string;
  additionalCost: number;
  enabled: boolean;
};

type WeightTier = {
  minWeightKg: number;
  maxWeightKg: number | null;
  cost: number;
};

type ShippingSettings = {
  strategy: 'legacy' | 'flat' | 'weight_tier';
  flatRate: number;
  freeShippingThreshold: number | null;
  zones: ShippingZone[];
  weightTiers: WeightTier[];
};

const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  strategy: 'legacy',
  flatRate: 0,
  freeShippingThreshold: null,
  zones: [],
  weightTiers: [],
};

export default function DashboardShippingPage() {
  const { storeId } = useStore();

  const [items, setItems] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({
    page: 1,
    limit: 20,
    total: 0,
    hasPrev: false,
    hasNext: false,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const [settings, setSettings] = useState<ShippingSettings>(DEFAULT_SHIPPING_SETTINGS);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);
  const [settingsValidationError, setSettingsValidationError] = useState<string | null>(null);

  const load = async () => {
    if (!storeId) return;
    setLoading(true);
    setMsg(null);
    try {
      const [shipmentsRes, settingsRes] = await Promise.all([
        api.get(`/stores/${storeId}/shipping?page=${page}&limit=20`, {
          headers: { ...authHeader(), 'x-client': 'web' },
        }),
        api.get(`/stores/${storeId}/shipping-settings`, {
          headers: { ...authHeader(), 'x-client': 'web' },
        }),
      ]);
      setItems(shipmentsRes?.data?.data || []);
      setMeta(shipmentsRes?.data?.meta || meta);
      setSettings({ ...DEFAULT_SHIPPING_SETTINGS, ...(settingsRes?.data?.data || {}) });
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'فشل تحميل بيانات الشحن' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [storeId, page]);

  const updateStatus = async (shipmentId: string, status: string) => {
    if (!storeId) return;
    setLoading(true);
    setMsg(null);
    try {
      await api.patch(
        `/stores/${storeId}/shipping/${shipmentId}/status`,
        { status },
        { headers: { ...authHeader(), 'x-client': 'web' } }
      );
      setMsg({ type: 'success', text: 'تم تحديث حالة الشحنة' });
      await load();
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'فشل تحديث الحالة' });
    } finally {
      setLoading(false);
    }
  };

  const saveShippingSettings = async () => {
    if (!storeId) return;
    if (settings.strategy === 'flat' && Number(settings.flatRate || 0) < 0) {
      setSettingsValidationError('سعر الشحن الثابت لا يمكن أن يكون أقل من 0.');
      return;
    }
    if (settings.freeShippingThreshold !== null && Number(settings.freeShippingThreshold) < 0) {
      setSettingsValidationError('حد الشحن المجاني يجب أن يكون رقماً موجباً.');
      return;
    }
    const hasInvalidZone = settings.zones.some(
      (z) => z.enabled && (!z.code.trim() || !z.nameAr.trim() || !z.nameEn.trim())
    );
    if (hasInvalidZone) {
      setSettingsValidationError('كل منطقة مفعّلة تحتاج رمزاً واسمين عربي/إنجليزي.');
      return;
    }
    const hasInvalidTier = settings.weightTiers.some(
      (t) =>
        Number(t.minWeightKg) < 0 ||
        (t.maxWeightKg !== null && Number(t.maxWeightKg) < Number(t.minWeightKg)) ||
        Number(t.cost) < 0
    );
    if (hasInvalidTier) {
      setSettingsValidationError('تحقق من شرائح الوزن: الحد الأعلى أكبر من الأدنى والقيم موجبة.');
      return;
    }
    if (settings.strategy === 'weight_tier' && settings.weightTiers.length === 0) {
      setSettingsValidationError('أضف شريحة وزن واحدة على الأقل عند اختيار Weight Tiers.');
      return;
    }
    setSettingsValidationError(null);
    setSettingsSaving(true);
    setSettingsMsg(null);
    setMsg(null);
    try {
      const payload = {
        ...settings,
        freeShippingThreshold: toNullableNumber(settings.freeShippingThreshold),
        flatRate: Number(settings.flatRate || 0),
        zones: settings.zones.map((z) => ({
          ...z,
          code: z.code.trim(),
          nameAr: z.nameAr.trim(),
          nameEn: z.nameEn.trim(),
          additionalCost: Number(z.additionalCost || 0),
        })),
        weightTiers: settings.weightTiers.map((t) => ({
          minWeightKg: Number(t.minWeightKg || 0),
          maxWeightKg: toNullableNumber(t.maxWeightKg),
          cost: Number(t.cost || 0),
        })),
      };
      const res = await api.patch(`/stores/${storeId}/shipping-settings`, payload, {
        headers: { ...authHeader(), 'x-client': 'web' },
      });
      setSettings({ ...DEFAULT_SHIPPING_SETTINGS, ...(res?.data?.data || payload) });
      setSettingsMsg('تم حفظ إعدادات الشحن');
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'فشل حفظ إعدادات الشحن' });
    } finally {
      setSettingsSaving(false);
    }
  };

  const rows = useMemo(() => items || [], [items]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-primary text-2xl font-extrabold">الشحن</h1>
          <p className="text-foreground/80 mt-1 text-sm">إدارة قواعد الشحن والشحنات.</p>
          {!storeId ? (
            <p className="mt-1 text-xs text-red-700">لا يوجد متجر محدد. اختر متجراً من الأعلى.</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={load} disabled={loading}>
            تحديث
          </Button>
        </div>
      </div>

      {msg ? <Alert kind={msg.type} text={msg.text} /> : null}
      {settingsValidationError ? <Alert kind="error" text={settingsValidationError} /> : null}

      <Card className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-primary text-sm font-extrabold">
              قواعد الشحن | Shipping Rules
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              قواعد آمنة: الوضع الافتراضي يحافظ على نفس سلوك الشحن الحالي.
            </p>
          </div>
          <Button onClick={saveShippingSettings} disabled={settingsSaving}>
            {settingsSaving ? 'جارٍ الحفظ...' : 'حفظ القواعد'}
          </Button>
        </div>

        {settingsMsg ? <Alert kind="success" text={settingsMsg} /> : null}

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="استراتيجية التسعير | Cost Strategy">
            <select
              className="focus:border-kaffza-primary rounded-xl border border-border bg-card text-card-foreground px-3 py-2 text-sm outline-none"
              value={settings.strategy}
              onChange={(e) => setSettings((s) => ({ ...s, strategy: e.target.value as any }))}
            >
              <option value="legacy">Legacy (الافتراضي الحالي)</option>
              <option value="flat">Flat Rate (سعر ثابت)</option>
              <option value="weight_tier">Weight Tiers (حسب الوزن)</option>
            </select>
          </Field>

          <Field label="سعر ثابت Flat Rate (OMR)">
            <Input
              value={String(settings.flatRate ?? 0)}
              onChange={(e: any) =>
                setSettings((s) => ({ ...s, flatRate: Number(e.target.value || 0) }))
              }
            />
          </Field>

          <Field label="حد الشحن المجاني | Free Shipping Threshold">
            <Input
              value={
                settings.freeShippingThreshold === null
                  ? ''
                  : String(settings.freeShippingThreshold)
              }
              onChange={(e: any) =>
                setSettings((s) => ({
                  ...s,
                  freeShippingThreshold: toNullableNumber(e.target.value),
                }))
              }
              placeholder="فارغ = بدون شحن مجاني"
            />
          </Field>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-primary text-sm font-extrabold">مناطق الشحن | Zones</div>
              <Button
                variant="secondary"
                onClick={() =>
                  setSettings((s) => ({
                    ...s,
                    zones: [
                      ...s.zones,
                      { code: '', nameAr: '', nameEn: '', additionalCost: 0, enabled: true },
                    ],
                  }))
                }
              >
                + منطقة
              </Button>
            </div>
            <div className="space-y-3">
              {settings.zones.length === 0 ? (
                <div className="text-muted-foreground text-xs">
                  لا توجد مناطق مخصصة. سيستخدم السعر الأساسي فقط.
                </div>
              ) : (
                settings.zones.map((zone, idx) => (
                  <div key={idx} className="bg-background grid gap-2 rounded-lg p-3 md:grid-cols-5">
                    <Input
                      placeholder="Code"
                      value={zone.code}
                      onChange={(e: any) => updateZone(setSettings, idx, { code: e.target.value })}
                    />
                    <Input
                      placeholder="الاسم العربي"
                      value={zone.nameAr}
                      onChange={(e: any) =>
                        updateZone(setSettings, idx, { nameAr: e.target.value })
                      }
                    />
                    <Input
                      placeholder="English name"
                      value={zone.nameEn}
                      onChange={(e: any) =>
                        updateZone(setSettings, idx, { nameEn: e.target.value })
                      }
                    />
                    <Input
                      placeholder="0.5"
                      value={String(zone.additionalCost)}
                      onChange={(e: any) =>
                        updateZone(setSettings, idx, {
                          additionalCost: Number(e.target.value || 0),
                        })
                      }
                    />
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={zone.enabled}
                          onChange={(e) =>
                            updateZone(setSettings, idx, { enabled: e.target.checked })
                          }
                        />
                        مفعّل
                      </label>
                      <button
                        className="text-xs text-red-700"
                        onClick={() => removeZone(setSettings, idx)}
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-primary text-sm font-extrabold">
                شرائح الوزن | Weight Tiers
              </div>
              <Button
                variant="secondary"
                onClick={() =>
                  setSettings((s) => ({
                    ...s,
                    weightTiers: [...s.weightTiers, { minWeightKg: 0, maxWeightKg: null, cost: 0 }],
                  }))
                }
              >
                + شريحة
              </Button>
            </div>
            <div className="space-y-3">
              {settings.weightTiers.length === 0 ? (
                <div className="text-muted-foreground text-xs">
                  يمكنك إضافة شرائح وزن إذا كانت الاستراتيجية Weight Tier.
                </div>
              ) : (
                settings.weightTiers.map((tier, idx) => (
                  <div key={idx} className="bg-background grid gap-2 rounded-lg p-3 md:grid-cols-4">
                    <Input
                      placeholder="Min KG"
                      value={String(tier.minWeightKg)}
                      onChange={(e: any) =>
                        updateTier(setSettings, idx, { minWeightKg: Number(e.target.value || 0) })
                      }
                    />
                    <Input
                      placeholder="Max KG (فارغ = مفتوح)"
                      value={tier.maxWeightKg === null ? '' : String(tier.maxWeightKg)}
                      onChange={(e: any) =>
                        updateTier(setSettings, idx, {
                          maxWeightKg: toNullableNumber(e.target.value),
                        })
                      }
                    />
                    <Input
                      placeholder="Cost"
                      value={String(tier.cost)}
                      onChange={(e: any) =>
                        updateTier(setSettings, idx, { cost: Number(e.target.value || 0) })
                      }
                    />
                    <button
                      className="text-xs text-red-700"
                      onClick={() => removeTier(setSettings, idx)}
                    >
                      حذف
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background">
              <tr className="text-right">
                <th className="text-primary px-4 py-3 font-extrabold">رقم الطلب</th>
                <th className="text-primary px-4 py-3 font-extrabold">اسم العميل</th>
                <th className="text-primary px-4 py-3 font-extrabold">الحالة</th>
                <th className="text-primary px-4 py-3 font-extrabold">تاريخ الإنشاء</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-muted-foreground px-4 py-6">
                    جاري التحميل...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted-foreground px-4 py-6">
                    لا يوجد شحنات.
                  </td>
                </tr>
              ) : (
                rows.map((s) => (
                  <tr key={String(s.id)} className="border-t border-border">
                    <td className="text-foreground px-4 py-3 font-bold">
                      {s.order?.orderNumber || s.orderId}
                    </td>
                    <td className="text-foreground/80 px-4 py-3">
                      {s.order?.customer?.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="focus:border-kaffza-primary rounded-xl border border-border bg-card text-card-foreground px-3 py-2 text-sm outline-none"
                        value={String(s.status)}
                        onChange={(e) => updateStatus(String(s.id), e.target.value)}
                        disabled={loading}
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                        {!STATUS_OPTIONS.some((o) => o.value === String(s.status)) ? (
                          <option value={String(s.status)}>{String(s.status)}</option>
                        ) : null}
                      </select>
                    </td>
                    <td className="text-muted-foreground px-4 py-3">{formatDate(s.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={!meta?.hasPrev || loading}
        >
          السابق
        </Button>
        <div className="text-muted-foreground text-xs">
          صفحة {meta?.page || page} • {meta?.total || 0} شحنة
        </div>
        <Button
          variant="secondary"
          onClick={() => setPage((p) => p + 1)}
          disabled={!meta?.hasNext || loading}
        >
          التالي
        </Button>
      </div>
    </div>
  );
}

function updateZone(setter: any, idx: number, patch: Partial<ShippingZone>) {
  setter((prev: ShippingSettings) => ({
    ...prev,
    zones: prev.zones.map((z, i) => (i === idx ? { ...z, ...patch } : z)),
  }));
}

function removeZone(setter: any, idx: number) {
  setter((prev: ShippingSettings) => ({
    ...prev,
    zones: prev.zones.filter((_, i) => i !== idx),
  }));
}

function updateTier(setter: any, idx: number, patch: Partial<WeightTier>) {
  setter((prev: ShippingSettings) => ({
    ...prev,
    weightTiers: prev.weightTiers.map((t, i) => (i === idx ? { ...t, ...patch } : t)),
  }));
}

function removeTier(setter: any, idx: number) {
  setter((prev: ShippingSettings) => ({
    ...prev,
    weightTiers: prev.weightTiers.filter((_, i) => i !== idx),
  }));
}

function Field({ label, children }: { label: string; children: any }) {
  return (
    <label className="grid gap-1">
      <span className="text-foreground text-sm font-bold">{label}</span>
      {children}
    </label>
  );
}

function Alert({ kind, text }: { kind: 'error' | 'success'; text: string }) {
  const cls =
    kind === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-green-200 bg-green-50 text-green-700';
  return <div className={`rounded-xl border p-4 text-sm ${cls}`}>{text}</div>;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('ar', { year: 'numeric', month: 'short', day: '2-digit' });
  } catch {
    return iso;
  }
}

function toNullableNumber(v: unknown): number | null {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n;
}
