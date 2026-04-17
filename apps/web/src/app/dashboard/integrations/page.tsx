'use client';

import { useEffect, useMemo, useState } from 'react';

import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { api } from '../../../lib/api';
import { authHeader } from '../../../lib/auth';
import { useStore } from '../store-context';

type EventItem = { code: string; labelAr: string; labelEn: string };
type WebhookItem = {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastDeliveryAt?: string | null;
  createdAt: string;
};
type ApiKeyItem = {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  revokedAt?: string | null;
  createdAt: string;
};

export default function DashboardIntegrationsPage() {
  const { storeId } = useStore();
  const [loading, setLoading] = useState(true);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [lastSecret, setLastSecret] = useState<string | null>(null);
  const [lastApiKey, setLastApiKey] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    url: '',
    events: [] as string[],
    isActive: true,
  });
  const [apiKeyName, setApiKeyName] = useState('Primary API Key');

  const canCreateWebhook = useMemo(
    () => form.name.trim().length >= 2 && form.url.trim().startsWith('http'),
    [form]
  );

  const load = async () => {
    if (!storeId) return;
    setLoading(true);
    setMsg(null);
    try {
      const headers = { ...authHeader(), 'x-client': 'web' };
      const [eventRes, hookRes, keyRes] = await Promise.all([
        api.get(`/stores/${storeId}/integrations/events`, { headers }),
        api.get(`/stores/${storeId}/integrations/webhooks`, { headers }),
        api.get(`/stores/${storeId}/integrations/api-keys`, { headers }),
      ]);
      setEvents(eventRes?.data?.data || []);
      setWebhooks(hookRes?.data?.data || []);
      setApiKeys(keyRes?.data?.data || []);
    } catch (e: any) {
      setMsg({ kind: 'error', text: e?.response?.data?.message || 'فشل تحميل إعدادات التكامل' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [storeId]);

  const createWebhook = async () => {
    if (!storeId || !canCreateWebhook) return;
    setSavingWebhook(true);
    setLastSecret(null);
    setMsg(null);
    try {
      const res = await api.post(
        `/stores/${storeId}/integrations/webhooks`,
        {
          name: form.name.trim(),
          url: form.url.trim(),
          events: form.events,
          isActive: form.isActive,
        },
        { headers: { ...authHeader(), 'x-client': 'web' } }
      );
      setLastSecret(res?.data?.data?.secret || null);
      setForm({ name: '', url: '', events: [], isActive: true });
      setMsg({ kind: 'success', text: 'تم إنشاء webhook endpoint' });
      await load();
    } catch (e: any) {
      setMsg({ kind: 'error', text: e?.response?.data?.message || 'فشل إنشاء Webhook' });
    } finally {
      setSavingWebhook(false);
    }
  };

  const patchWebhook = async (id: string, patch: Partial<WebhookItem>) => {
    if (!storeId) return;
    setMsg(null);
    try {
      await api.patch(`/stores/${storeId}/integrations/webhooks/${id}`, patch, {
        headers: { ...authHeader(), 'x-client': 'web' },
      });
      await load();
    } catch (e: any) {
      setMsg({ kind: 'error', text: e?.response?.data?.message || 'فشل تحديث Webhook' });
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!storeId) return;
    setMsg(null);
    try {
      await api.delete(`/stores/${storeId}/integrations/webhooks/${id}`, {
        headers: { ...authHeader(), 'x-client': 'web' },
      });
      setMsg({ kind: 'success', text: 'تم حذف Webhook endpoint' });
      await load();
    } catch (e: any) {
      setMsg({ kind: 'error', text: e?.response?.data?.message || 'فشل حذف Webhook' });
    }
  };

  const rotateWebhookSecret = async (id: string) => {
    if (!storeId) return;
    setLastSecret(null);
    setMsg(null);
    try {
      const res = await api.post(
        `/stores/${storeId}/integrations/webhooks/${id}/rotate-secret`,
        {},
        { headers: { ...authHeader(), 'x-client': 'web' } }
      );
      setLastSecret(res?.data?.data?.secret || null);
      setMsg({ kind: 'success', text: 'تم تدوير webhook secret' });
    } catch (e: any) {
      setMsg({ kind: 'error', text: e?.response?.data?.message || 'فشل تدوير secret' });
    }
  };

  const createApiKey = async () => {
    if (!storeId || apiKeyName.trim().length < 2) return;
    setSavingApiKey(true);
    setLastApiKey(null);
    setMsg(null);
    try {
      const res = await api.post(
        `/stores/${storeId}/integrations/api-keys`,
        { name: apiKeyName.trim() },
        { headers: { ...authHeader(), 'x-client': 'web' } }
      );
      setLastApiKey(res?.data?.data?.apiKey || null);
      setMsg({ kind: 'success', text: 'تم إنشاء API Key' });
      await load();
    } catch (e: any) {
      setMsg({ kind: 'error', text: e?.response?.data?.message || 'فشل إنشاء API Key' });
    } finally {
      setSavingApiKey(false);
    }
  };

  const rotateApiKey = async (id: string) => {
    if (!storeId) return;
    setLastApiKey(null);
    setMsg(null);
    try {
      const res = await api.post(
        `/stores/${storeId}/integrations/api-keys/${id}/rotate`,
        {},
        { headers: { ...authHeader(), 'x-client': 'web' } }
      );
      setLastApiKey(res?.data?.data?.apiKey || null);
      setMsg({ kind: 'success', text: 'تم تدوير API Key' });
      await load();
    } catch (e: any) {
      setMsg({ kind: 'error', text: e?.response?.data?.message || 'فشل تدوير API Key' });
    }
  };

  const revokeApiKey = async (id: string) => {
    if (!storeId) return;
    setMsg(null);
    try {
      await api.post(
        `/stores/${storeId}/integrations/api-keys/${id}/revoke`,
        {},
        { headers: { ...authHeader(), 'x-client': 'web' } }
      );
      setMsg({ kind: 'success', text: 'تم إيقاف API Key' });
      await load();
    } catch (e: any) {
      setMsg({ kind: 'error', text: e?.response?.data?.message || 'فشل إيقاف API Key' });
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <header>
        <h1 className="text-kaffza-primary text-2xl font-extrabold">التكاملات | Integrations</h1>
        <p className="text-kaffza-text/80 mt-1 text-sm">
          إدارة Webhooks و API Keys للشركاء والتطبيقات الخارجية.
        </p>
      </header>

      {msg ? <Alert kind={msg.kind} text={msg.text} /> : null}
      {lastSecret ? (
        <Alert kind="success" text={`Webhook secret الجديد (اعرضه مرة واحدة فقط): ${lastSecret}`} />
      ) : null}
      {lastApiKey ? (
        <Alert kind="success" text={`API Key الجديد (اعرضه مرة واحدة فقط): ${lastApiKey}`} />
      ) : null}

      <Card className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-kaffza-primary text-sm font-extrabold">Webhook Endpoints</div>
            <div className="text-kaffza-text/70 mt-1 text-xs">
              يتم توقيع كل webhook باستخدام HMAC SHA-256 مع timestamp.
            </div>
          </div>
          <Button onClick={load} variant="secondary" disabled={loading}>
            تحديث
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="اسم الـ endpoint | Name">
            <Input
              value={form.name}
              onChange={(e: any) => setForm((s) => ({ ...s, name: e.target.value }))}
              placeholder="ERP / OMS / Partner"
            />
          </Field>
          <Field label="Webhook URL">
            <Input
              value={form.url}
              onChange={(e: any) => setForm((s) => ({ ...s, url: e.target.value }))}
              placeholder="https://partner.example.com/webhooks/kaffza"
            />
          </Field>
        </div>

        <div>
          <div className="text-kaffza-text mb-2 text-sm font-bold">الأحداث | Events</div>
          <div className="grid gap-2 md:grid-cols-2">
            {events.map((event) => {
              const selected = form.events.includes(event.code);
              return (
                <label
                  key={event.code}
                  className="flex items-center justify-between rounded-xl border border-black/10 px-3 py-2 text-sm"
                >
                  <div>
                    <div>{event.labelAr}</div>
                    <div className="text-xs text-slate-500">{event.labelEn}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        events: e.target.checked
                          ? [...new Set([...s.events, event.code])]
                          : s.events.filter((item) => item !== event.code),
                      }))
                    }
                  />
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))}
            />
            Active endpoint
          </label>
          <Button onClick={createWebhook} disabled={!canCreateWebhook || savingWebhook}>
            {savingWebhook ? 'جارٍ الإنشاء...' : 'إنشاء Webhook'}
          </Button>
        </div>

        <div className="space-y-2">
          {webhooks.map((hook) => (
            <div key={hook.id} className="rounded-xl border border-black/10 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-kaffza-primary font-bold">{hook.name}</div>
                  <div className="text-xs text-slate-600">{hook.url}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Events: {(hook.events || []).join(', ') || 'all'}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    آخر إرسال: {hook.lastDeliveryAt ? formatDate(hook.lastDeliveryAt) : '—'}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => patchWebhook(hook.id, { isActive: !hook.isActive })}
                  >
                    {hook.isActive ? 'تعطيل' : 'تفعيل'}
                  </Button>
                  <Button variant="secondary" onClick={() => rotateWebhookSecret(hook.id)}>
                    Rotate secret
                  </Button>
                  <Button variant="secondary" onClick={() => deleteWebhook(hook.id)}>
                    حذف
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {!webhooks.length ? (
            <div className="text-xs text-slate-500">لا يوجد webhook endpoints حالياً.</div>
          ) : null}
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <div>
          <div className="text-kaffza-primary text-sm font-extrabold">Integration API Keys</div>
          <div className="text-kaffza-text/70 mt-1 text-xs">
            مفاتيح للوصول الآمن لتكاملات الشركاء. التدوير والإيقاف مدعومان.
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <Field label="اسم المفتاح | Key Name">
            <Input
              value={apiKeyName}
              onChange={(e: any) => setApiKeyName(e.target.value)}
              placeholder="ERP Service"
            />
          </Field>
          <Button onClick={createApiKey} disabled={savingApiKey || apiKeyName.trim().length < 2}>
            {savingApiKey ? 'جارٍ الإنشاء...' : 'إنشاء API Key'}
          </Button>
        </div>

        <div className="space-y-2">
          {apiKeys.map((key) => (
            <div key={key.id} className="rounded-xl border border-black/10 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-kaffza-primary font-bold">{key.name}</div>
                  <div className="text-xs text-slate-600">Prefix: {key.keyPrefix}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    الحالة: {key.isActive ? 'مفعّل' : 'موقوف'} • الإنشاء:{' '}
                    {formatDate(key.createdAt)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => rotateApiKey(key.id)}>
                    Rotate
                  </Button>
                  <Button variant="secondary" onClick={() => revokeApiKey(key.id)}>
                    Revoke
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {!apiKeys.length ? (
            <div className="text-xs text-slate-500">لا يوجد API Keys حالياً.</div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: any }) {
  return (
    <label className="grid gap-1">
      <span className="text-kaffza-text text-sm font-bold">{label}</span>
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
    return new Date(iso).toLocaleString('ar', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
