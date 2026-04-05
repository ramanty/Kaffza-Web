'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { authHeader } from '../../../lib/auth';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { useStore } from '../store-context';

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  paymentStatus: 'paid' | 'pending';
  totalAmount: number;
  createdAt: string;
};

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] as const;
type StatusFilter = 'all' | (typeof STATUS_OPTIONS)[number];

const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    orderNumber: 'KFZ-20240101-0001',
    customerName: 'أحمد العمري',
    status: 'pending',
    paymentStatus: 'pending',
    totalAmount: 15.5,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    orderNumber: 'KFZ-20240102-0002',
    customerName: 'فاطمة الزهراء',
    status: 'processing',
    paymentStatus: 'paid',
    totalAmount: 32.75,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    orderNumber: 'KFZ-20240103-0003',
    customerName: 'محمد الحارثي',
    status: 'shipped',
    paymentStatus: 'paid',
    totalAmount: 8.9,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    orderNumber: 'KFZ-20240104-0004',
    customerName: 'نورة الكندية',
    status: 'delivered',
    paymentStatus: 'paid',
    totalAmount: 45.0,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    orderNumber: 'KFZ-20240105-0005',
    customerName: 'خالد البلوشي',
    status: 'confirmed',
    paymentStatus: 'paid',
    totalAmount: 22.3,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'pending', label: 'معلق' },
  { key: 'confirmed', label: 'مؤكد' },
  { key: 'processing', label: 'قيد التنفيذ' },
  { key: 'shipped', label: 'تم الشحن' },
  { key: 'delivered', label: 'تم التسليم' },
];

export default function OrdersPage() {
  const { storeId, loading: storesLoading } = useStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');

  async function load() {
    if (!storeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/stores/${storeId}/orders`, {
        headers: { ...authHeader(), 'x-client': 'web' },
      });
      const data: any[] = res?.data?.data || [];
      const mapped = data.map((o) => ({
        id: String(o.id),
        orderNumber: o.orderNumber,
        customerName: o.shippingAddress?.fullName || o.customerName || 'عميل غير معروف',
        status: o.status,
        paymentStatus: (o.customerConfirmed || o.paymentStatus === 'paid' ? 'paid' : 'pending') as
          | 'paid'
          | 'pending',
        totalAmount: Number(o.totalAmount),
        createdAt: o.createdAt,
      }));
      setOrders(mapped.length > 0 ? mapped : MOCK_ORDERS);
    } catch {
      setOrders(MOCK_ORDERS);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!storeId) {
      setLoading(false);
      setOrders(MOCK_ORDERS);
      return;
    }
    load();
  }, [storeId]);

  const filteredOrders = useMemo(
    () => (activeFilter === 'all' ? orders : orders.filter((o) => o.status === activeFilter)),
    [orders, activeFilter]
  );

  async function changeStatus(orderId: string, status: string) {
    if (!storeId) return;
    setError(null);
    try {
      await api.patch(
        `/stores/${storeId}/orders/${orderId}/status`,
        { status },
        { headers: { ...authHeader(), 'x-client': 'web' } }
      );
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'فشل تغيير حالة الطلب');
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-kaffza-primary text-2xl font-extrabold">الطلبات</h1>
          <p className="text-kaffza-text/80 mt-1 text-sm">
            إدارة طلبات المتجر – عرض، تتبع، وتحديث الحالات.
          </p>
          {!storeId && !storesLoading ? (
            <p className="mt-1 text-xs text-red-700">
              لا يوجد متجر محدد. يرجى اختيار متجر من الأعلى.
            </p>
          ) : null}
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          تحديث
        </Button>
      </header>

      {/* Error Banner */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-black/5 pb-3">
        {FILTER_TABS.map((tab) => {
          const count =
            tab.key === 'all' ? orders.length : orders.filter((o) => o.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={
                'rounded-lg px-4 py-2 text-sm font-semibold transition-colors ' +
                (activeFilter === tab.key
                  ? 'bg-kaffza-primary text-white shadow-sm'
                  : 'text-kaffza-text/70 hover:bg-kaffza-bg hover:text-kaffza-primary border border-black/5 bg-white')
              }
            >
              {tab.label}
              {count > 0 ? (
                <span
                  className={
                    'mr-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs ' +
                    (activeFilter === tab.key
                      ? 'bg-white/20 text-white'
                      : 'bg-kaffza-bg text-kaffza-text/70')
                  }
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Orders Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-kaffza-bg">
              <tr className="text-right">
                <th className="text-kaffza-primary px-4 py-3 font-extrabold">رقم الطلب</th>
                <th className="text-kaffza-primary px-4 py-3 font-extrabold">اسم العميل</th>
                <th className="text-kaffza-primary px-4 py-3 font-extrabold">التاريخ</th>
                <th className="text-kaffza-primary px-4 py-3 font-extrabold">الإجمالي</th>
                <th className="text-kaffza-primary px-4 py-3 font-extrabold">حالة الدفع</th>
                <th className="text-kaffza-primary px-4 py-3 font-extrabold">حالة الطلب</th>
                <th className="text-kaffza-primary px-4 py-3 font-extrabold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="text-kaffza-text/70 px-4 py-10 text-center" colSpan={7}>
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl">⏳</span>
                      <span>جاري التحميل...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td className="px-4 py-12 text-center" colSpan={7}>
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-4xl">🧾</span>
                      <p className="text-kaffza-text font-extrabold">لا توجد طلبات</p>
                      <p className="text-kaffza-text/60 text-xs">
                        {activeFilter === 'all'
                          ? 'لم يتم استلام أي طلبات بعد.'
                          : `لا توجد طلبات بحالة "${FILTER_TABS.find((t) => t.key === activeFilter)?.label ?? activeFilter}".`}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="hover:bg-kaffza-bg/50 border-t border-black/5 transition-colors"
                  >
                    {/* Order Number */}
                    <td className="px-4 py-3">
                      <div className="text-kaffza-text font-extrabold">{o.orderNumber}</div>
                    </td>

                    {/* Customer Name */}
                    <td className="px-4 py-3">
                      <div className="text-kaffza-text font-semibold">{o.customerName}</div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3">
                      <div className="text-kaffza-text/70 text-xs">{formatDate(o.createdAt)}</div>
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3">
                      <span className="text-kaffza-primary font-bold">
                        {Number(o.totalAmount).toFixed(3)} ر.ع
                      </span>
                    </td>

                    {/* Payment Status */}
                    <td className="px-4 py-3">
                      <PaymentBadge status={o.paymentStatus} />
                    </td>

                    {/* Order Status */}
                    <td className="px-4 py-3">
                      <StatusPill status={o.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/dashboard/orders/${o.id}`}>
                          <Button variant="secondary">عرض التفاصيل</Button>
                        </Link>
                        {storeId ? (
                          <select
                            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs"
                            value={STATUS_OPTIONS.includes(o.status as any) ? o.status : 'pending'}
                            onChange={(e) => changeStatus(o.id, e.target.value)}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {mapStatus(s)}
                              </option>
                            ))}
                          </select>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const { cls, label } = statusMeta(status);
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${cls}`}>{label}</span>
  );
}

function PaymentBadge({ status }: { status: 'paid' | 'pending' }) {
  if (status === 'paid') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        مدفوع
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      معلق
    </span>
  );
}

function statusMeta(status: string) {
  switch (status) {
    case 'pending':
      return { cls: 'bg-amber-50 text-amber-700 border border-amber-200', label: 'معلق' };
    case 'confirmed':
      return { cls: 'bg-blue-50 text-blue-700 border border-blue-200', label: 'مؤكد' };
    case 'processing':
      return { cls: 'bg-[#EFF6FF] text-[#3B82F6] border border-blue-100', label: 'قيد التنفيذ' };
    case 'shipped':
      return { cls: 'bg-purple-50 text-purple-700 border border-purple-200', label: 'تم الشحن' };
    case 'delivered':
      return { cls: 'bg-green-50 text-green-700 border border-green-200', label: 'تم التسليم' };
    case 'cancelled':
      return { cls: 'bg-red-50 text-red-700 border border-red-200', label: 'ملغي' };
    case 'refunded':
      return { cls: 'bg-gray-100 text-gray-600 border border-gray-200', label: 'مسترجع' };
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
