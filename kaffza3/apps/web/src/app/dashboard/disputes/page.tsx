'use client';

import { useEffect, useMemo, useState } from 'react';

import { api } from '../../../lib/api';
import { authHeader } from '../../../lib/auth';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { useStore } from '../store-context';

export default function DashboardDisputesPage() {
  const { storeId } = useStore();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    if (!storeId) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.get(`/disputes?storeId=${storeId}`, { headers: { ...authHeader(), 'x-client': 'web' } });
      setItems(res?.data?.data || []);
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'فشل تحميل النزاعات' });
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (id: string) => {
    setSelectedId(id);
    setDetail(null);
    setReply('');
    setDetailLoading(true);
    try {
      const res = await api.get(`/disputes/${id}`, { headers: { ...authHeader(), 'x-client': 'web' } });
      setDetail(res?.data?.data);
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'تعذر جلب تفاصيل النزاع' });
    } finally {
      setDetailLoading(false);
    }
  };

  const closePanel = () => {
    setSelectedId(null);
    setDetail(null);
    setReply('');
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const sendMessage = async () => {
    if (!selectedId) return;
    if (reply.trim().length < 2) {
      setMsg({ type: 'error', text: 'اكتب رد قبل الإرسال' });
      return;
    }

    setSending(true);
    setMsg(null);
    try {
      await api.post(
        `/disputes/${selectedId}/messages`,
        { message: reply.trim() },
        { headers: { ...authHeader(), 'x-client': 'web' } }
      );
      setReply('');
      await openDetails(selectedId);
      setMsg({ type: 'success', text: 'تم إرسال الرد' });
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'فشل إرسال الرد' });
    } finally {
      setSending(false);
    }
  };

  const resolve = async (mode: 'refund' | 'rejected') => {
    if (!selectedId) return;
    setSending(true);
    setMsg(null);

    try {
      const payload =
        mode === 'refund'
          ? { status: 'resolved_customer', resolution: 'refund' }
          : { status: 'resolved_merchant', resolution: 'rejected' };

      await api.patch(`/disputes/${selectedId}/resolve`, payload, { headers: { ...authHeader(), 'x-client': 'web' } });
      setMsg({ type: 'success', text: mode === 'refund' ? 'تم قبول النزاع وإعادة المبلغ' : 'تم رفض النزاع' });
      await load();
      await openDetails(selectedId);
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'فشل تنفيذ الإجراء' });
    } finally {
      setSending(false);
    }
  };

  const rows = useMemo(() => items || [], [items]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-kaffza-primary">النزاعات</h1>
          <p className="mt-1 text-sm text-kaffza-text/80">عرض النزاعات والرد عليها وحسمها.</p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          تحديث
        </Button>
      </div>

      {msg ? <Alert kind={msg.type} text={msg.text} /> : null}

      <div className="grid gap-4">
        {loading ? (
          <Card className="p-6"><div className="text-sm text-kaffza-text/70">جاري التحميل...</div></Card>
        ) : rows.length === 0 ? (
          <Card className="p-6"><div className="text-sm text-kaffza-text/70">لا يوجد نزاعات.</div></Card>
        ) : (
          rows.map((d) => (
            <Card key={String(d.id)} className="p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs text-kaffza-text/70">طلب</div>
                  <div className="text-lg font-extrabold text-kaffza-primary">{d.order?.orderNumber || d.orderId}</div>
                  <div className="mt-1 text-xs text-kaffza-text/70">العميل: {d.order?.customer?.name || d.raisedBy?.name || '-'}</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-kaffza-text/70">السبب</div>
                    <div className="text-sm font-bold text-kaffza-text">{shorten(d.reason || '', 60)}</div>
                  </div>

                  <DisputeBadge status={d.status} />

                  <Button onClick={() => openDetails(String(d.id))}>عرض التفاصيل</Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {selectedId ? (
        <SidePanel onClose={closePanel}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-kaffza-text/70">تفاصيل النزاع</div>
              <div className="text-lg font-extrabold text-kaffza-primary">#{selectedId}</div>
            </div>
            <button className="text-sm font-bold text-kaffza-text/70 underline" onClick={closePanel}>
              إغلاق
            </button>
          </div>

          {detailLoading || !detail ? (
            <div className="mt-4 rounded-xl bg-kaffza-bg p-4 text-sm text-kaffza-text/70">جاري التحميل...</div>
          ) : (
            <>
              <div className="mt-4 rounded-xl bg-kaffza-bg p-4">
                <div className="text-sm font-extrabold text-kaffza-primary">ملخص</div>
                <div className="mt-2 text-xs text-kaffza-text/70">طلب: {detail.order?.orderNumber}</div>
                <div className="mt-1 text-xs text-kaffza-text/70">العميل: {detail.order?.customer?.name || '-'}</div>
                <div className="mt-2"><DisputeBadge status={detail.status} /></div>
                <div className="mt-3 text-sm text-kaffza-text">{detail.reason}</div>
              </div>

              <div className="mt-4">
                <div className="text-sm font-extrabold text-kaffza-primary">المحادثة</div>
                <div className="mt-2 space-y-2">
                  {(detail.messages || []).length === 0 ? (
                    <div className="rounded-xl bg-kaffza-bg p-3 text-sm text-kaffza-text/70">لا يوجد رسائل بعد.</div>
                  ) : (
                    detail.messages.map((m: any) => (
                      <div key={String(m.id)} className="rounded-xl border border-black/10 bg-white p-3">
                        <div className="text-xs text-kaffza-text/60">{formatDate(m.createdAt)} • {m.senderRole}</div>
                        <div className="mt-1 text-sm text-kaffza-text">{m.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm font-extrabold text-kaffza-primary">رد</div>
                <textarea
                  className="mt-2 min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-kaffza-primary"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="اكتب ردك هنا..."
                />
                <div className="mt-2 flex gap-2">
                  <Button onClick={sendMessage} disabled={sending || reply.trim().length < 2}>
                    {sending ? 'جارٍ الإرسال...' : 'إرسال'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SidePanel>
      ) : null}
    </div>
  );
}

function Alert({ kind, text }: { kind: 'error' | 'success'; text: string }) {
  const cls = kind === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700';
  return <div className={`rounded-xl border p-4 text-sm ${cls}`}>{text}</div>;
}

function DisputeBadge({ status }: { status: string }) {
  const s = String(status || '').toLowerCase();
  const base = 'inline-flex rounded-full px-3 py-1 text-xs font-extrabold';
  if (s === 'open' || s === 'under_review') return <span className={`${base} bg-yellow-50 text-yellow-700`}>open</span>;
  if (s === 'resolved_customer') return <span className={`${base} bg-green-50 text-green-700`}>resolved</span>;
  if (s === 'resolved_merchant') return <span className={`${base} bg-red-50 text-red-700`}>rejected</span>;
  if (s === 'closed') return <span className={`${base} bg-gray-100 text-gray-700`}>closed</span>;
  return <span className={`${base} bg-gray-100 text-gray-700`}>{status}</span>;
}

function SidePanel({ children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute left-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl">
        {children}
      </div>
    </div>
  );
}

function shorten(s: string, n: number) {
  const t = String(s || '');
  return t.length > n ? t.slice(0, n) + '…' : t;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('ar', { year: 'numeric', month: 'short', day: '2-digit' });
  } catch {
    return iso;
  }
}
