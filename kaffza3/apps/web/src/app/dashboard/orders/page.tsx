'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '../../../lib/api';
import { authHeader } from '../../../lib/auth';
import { Button } from '../../../components/Button';
import { useStore } from '../store-context';

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
};

type OrderDetails = any;

const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered'] as const;

export default function OrdersPage() {
  const { storeId, loading: storesLoading } = useStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState<OrderDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  async function load() {
    if (!storeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/stores/${storeId}/orders`, { headers: { ...authHeader(), 'x-client': 'web' } });
      const data: any[] = res?.data?.data || [];
      setOrders(
        data.map((o) => ({
          id: String(o.id),
          orderNumber: o.orderNumber,
          status: o.status,
          totalAmount: Number(o.totalAmount),
          createdAt: o.createdAt,
        }))
      );
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'حدث خطأ أثناء تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!storeId) {
      setLoading(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const hasOrders = useMemo(() => orders.length > 0, [orders]);

  async function changeStatus(orderId: string, status: string) {
    if (!storeId) return;
    setError(null);
    try {
      await api.patch(`/stores/${storeId}/orders/${orderId}/status`, { status }, { headers: { ...authHeader(), 'x-client': 'web' } });
      await load();
      if (selectedId === orderId) await openDetails(orderId);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'فشل تغيير حالة الطلب');
    }
  }

  async function openDetails(orderId: string) {
    setSelectedId(orderId);
    setDetails(null);
    setDetailsLoading(true);
    try {
      const res = await api.get(`/orders/${orderId}`, { headers: { ...authHeader(), 'x-client': 'web' } });
      setDetails(res?.data?.data || null);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'فشل تحميل تفاصيل الطلب');
    } finally {
      setDetailsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-kaffza-primary">الطلبات</h1>
        <p className="mt-1 text-sm text-kaffza-text/80">قائمة الطلبات + تغيير الحالة + تفاصيل الطلب.</p>
        {!storeId && !storesLoading ? <p className="mt-1 text-xs text-red-700">لا يوجد متجر محدد.</p> : null}
      </header>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-kaffza-bg">
                <tr className="text-right">
                  <th className="px-4 py-3 font-bold text-kaffza-text">رقم الطلب</th>
                  <th className="px-4 py-3 font-bold text-kaffza-text">الإجمالي</th>
                  <th className="px-4 py-3 font-bold text-kaffza-text">الحالة</th>
                  <th className="px-4 py-3 font-bold text-kaffza-text">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-kaffza-text/70" colSpan={4}>
                      جاري التحميل...
                    </td>
                  </tr>
                ) : !hasOrders ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-kaffza-text/70" colSpan={4}>
                      لا يوجد طلبات.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="border-t border-black/5">
                      <td className="px-4 py-3">
                        <div className="font-extrabold text-kaffza-text">{o.orderNumber}</div>
                        <div className="text-xs text-kaffza-text/60">{formatDate(o.createdAt)}</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-kaffza-primary">{Number(o.totalAmount).toFixed(3)} ر.ع</td>
                      <td className="px-4 py-3">
                        <StatusPill status={o.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button onClick={() => openDetails(o.id)}>تفاصيل</Button>
                          <select
                            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
                            value={STATUS_OPTIONS.includes(o.status as any) ? o.status : 'pending'}
                            onChange={(e) => changeStatus(o.id, e.target.value)}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {mapStatus(s)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-kaffza-primary">تفاصيل الطلب</div>
            {selectedId ? (
              <button
                className="text-xs font-bold text-kaffza-text/70 underline"
                onClick={() => {
                  setSelectedId(null);
                  setDetails(null);
                }}
              >
                إغلاق
              </button>
            ) : null}
          </div>

          {!selectedId ? (
            <div className="mt-4 text-sm text-kaffza-text/70">اختر طلبًا لعرض تفاصيله.</div>
          ) : detailsLoading ? (
            <div className="mt-4 text-sm text-kaffza-text/70">جاري تحميل التفاصيل...</div>
          ) : !details ? (
            <div className="mt-4 text-sm text-kaffza-text/70">لا توجد تفاصيل.</div>
          ) : (
            <OrderDetailsView details={details} />
          )}
        </div>
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const { cls, label } = statusMeta(status);
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${cls}`}>{label}</span>;
}

function statusMeta(status: string) {
  switch (status) {
    case 'pending':
      return { cls: 'bg-gray-100 text-gray-700', label: 'معلق' };
    case 'confirmed':
      return { cls: 'bg-blue-50 text-blue-700', label: 'مؤكد' };
    case 'shipped':
      return { cls: 'bg-amber-50 text-amber-700', label: 'تم الشحن' };
    case 'delivered':
      return { cls: 'bg-green-50 text-green-700', label: 'تم التسليم' };
    default:
      return { cls: 'bg-gray-100 text-gray-700', label: status };
  }
}

function mapStatus(s: string) {
  return statusMeta(s).label;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('ar', { year: 'numeric', month: 'short', day: '2-digit' });
  } catch {
    return iso;
  }
}

function OrderDetailsView({ details }: { details: any }) {
  const items = details?.items || [];
  const shipping = details?.shippingAddress;
  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-lg bg-kaffza-bg p-4">
        <div className="text-xs text-kaffza-text/70">الطلب</div>
        <div className="mt-1 text-sm font-extrabold text-kaffza-primary">{details.orderNumber}</div>
        <div className="mt-1 text-sm text-kaffza-text">
          الإجمالي: <span className="font-extrabold">{Number(details.totalAmount).toFixed(3)} ر.ع</span>
        </div>
        <div className="mt-1">
          <StatusPill status={details.status} />
        </div>
      </div>

      <div>
        <div className="text-sm font-bold text-kaffza-primary">العناصر</div>
        <div className="mt-2 space-y-2">
          {items.length ? (
            items.map((it: any) => (
              <div key={String(it.id)} className="flex items-center justify-between rounded-lg border border-black/5 p-3">
                <div>
                  <div className="text-sm font-semibold text-kaffza-text">{it.productName}</div>
                  <div className="text-xs text-kaffza-text/60">الكمية: {it.quantity}</div>
                </div>
                <div className="text-sm font-extrabold text-kaffza-primary">{Number(it.totalPrice).toFixed(3)} ر.ع</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-kaffza-text/70">لا توجد عناصر.</div>
          )}
        </div>
      </div>

      <div>
        <div className="text-sm font-bold text-kaffza-primary">عنوان الشحن</div>
        <div className="mt-2 rounded-lg border border-black/5 p-3 text-sm text-kaffza-text">
          {shipping ? (
            <>
              <div className="font-semibold">{shipping.fullName}</div>
              <div className="text-xs text-kaffza-text/70">{shipping.phone}</div>
              <div className="mt-1">
                {shipping.addressLine1}
                {shipping.addressLine2 ? `، ${shipping.addressLine2}` : ''}
              </div>
              <div className="text-xs text-kaffza-text/70">
                {shipping.city} - {shipping.state}
              </div>
            </>
          ) : (
            <div className="text-sm text-kaffza-text/70">غير متوفر</div>
          )}
        </div>
      </div>
    </div>
  );
}
