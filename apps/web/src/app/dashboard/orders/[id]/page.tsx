'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '../../../../lib/api';
import { authHeader } from '../../../../lib/auth';
import { Button } from '../../../../components/Button';
import { Card } from '../../../../components/Card';
import { useStore } from '../../store-context';

type OrderItem = {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

type ShippingAddress = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
};

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  customerConfirmed: boolean;
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  commissionAmount: number;
  merchantAmount: number;
  customerNotes?: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
};

const MOCK_ORDER: OrderDetail = {
  id: '1',
  orderNumber: 'KFZ-20240101-0001',
  status: 'processing',
  customerConfirmed: true,
  subtotal: 14.0,
  shippingCost: 1.5,
  totalAmount: 15.5,
  commissionAmount: 0.78,
  merchantAmount: 14.72,
  customerNotes: 'يرجى التأكد من إحكام التغليف',
  shippingAddress: {
    fullName: 'أحمد العمري',
    phone: '+96891234567',
    addressLine1: 'شارع السلطان قابوس، مبنى 14',
    addressLine2: 'الدور الثالث، شقة 7',
    city: 'مسقط',
    state: 'مسقط',
    postalCode: '100',
    country: 'OM',
  },
  items: [
    { id: 1, productName: 'عسل سدر عماني أصيل', quantity: 2, unitPrice: 5.5, totalPrice: 11.0 },
    { id: 2, productName: 'زيت عود طبيعي', quantity: 1, unitPrice: 3.0, totalPrice: 3.0 },
  ],
  createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'معلق' },
  { value: 'confirmed', label: 'مؤكد' },
  { value: 'processing', label: 'قيد التنفيذ' },
  { value: 'shipped', label: 'تم الشحن' },
  { value: 'delivered', label: 'تم التسليم' },
  { value: 'cancelled', label: 'ملغي' },
];

/** Tax rate applied to orders (0% VAT for current Oman tier) */
const ORDER_TAX_RATE = 0;

const COUNTRY_NAMES: Record<string, string> = {
  OM: 'سلطنة عُمان 🇴🇲',
  SA: 'المملكة العربية السعودية 🇸🇦',
  AE: 'الإمارات العربية المتحدة 🇦🇪',
  KW: 'الكويت 🇰🇼',
  BH: 'البحرين 🇧🇭',
  QA: 'قطر 🇶🇦',
};

function getCountryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code;
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { storeId } = useStore();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState(false);

  async function loadOrder() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/orders/${id}`, {
        headers: { ...authHeader(), 'x-client': 'web' },
      });
      const data = res?.data?.data;
      if (data) {
        setOrder({
          id: String(data.id),
          orderNumber: data.orderNumber,
          status: data.status,
          customerConfirmed: Boolean(data.customerConfirmed),
          subtotal: Number(data.subtotal),
          shippingCost: Number(data.shippingCost),
          totalAmount: Number(data.totalAmount),
          commissionAmount: Number(data.commissionAmount ?? 0),
          merchantAmount: Number(data.merchantAmount ?? data.totalAmount),
          customerNotes: data.customerNotes,
          shippingAddress: data.shippingAddress,
          items: (data.items || []).map((it: any) => ({
            id: it.id,
            productName: it.productName,
            quantity: Number(it.quantity),
            unitPrice: Number(it.unitPrice),
            totalPrice: Number(it.totalPrice),
          })),
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      } else {
        setOrder(MOCK_ORDER);
      }
    } catch {
      setOrder(MOCK_ORDER);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadOrder();
  }, [id]);

  async function handleStatusChange(newStatus: string) {
    if (!storeId || !order) return;
    setStatusLoading(true);
    setError(null);
    setStatusSuccess(false);
    try {
      await api.patch(
        `/stores/${storeId}/orders/${order.id}/status`,
        { status: newStatus },
        { headers: { ...authHeader(), 'x-client': 'web' } }
      );
      setOrder((prev) => (prev ? { ...prev, status: newStatus } : prev));
      setStatusSuccess(true);
      setTimeout(() => setStatusSuccess(false), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'فشل تحديث حالة الطلب');
    } finally {
      setStatusLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center" dir="rtl">
        <div className="text-kaffza-text/70 flex flex-col items-center gap-3">
          <span className="text-4xl">⏳</span>
          <p>جاري تحميل تفاصيل الطلب...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-[400px] items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-4xl">🔍</span>
          <p className="text-kaffza-text font-bold">الطلب غير موجود</p>
          <Link href="/dashboard/orders">
            <Button variant="secondary">← العودة للطلبات</Button>
          </Link>
        </div>
      </div>
    );
  }

  const paymentStatus = order.customerConfirmed ? 'paid' : 'pending';
  const taxAmount = order.subtotal * ORDER_TAX_RATE;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/orders">
            <button className="text-kaffza-text hover:bg-kaffza-bg flex items-center gap-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold transition-colors">
              ← عودة
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-kaffza-primary text-2xl font-extrabold">{order.orderNumber}</h1>
              <StatusPill status={order.status} />
            </div>
            <p className="text-kaffza-text/70 mt-1 text-sm">
              تفاصيل الطلب · {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Success Banner */}
      {statusSuccess ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          ✅ تم تحديث حالة الطلب بنجاح
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: main order info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer Details Card */}
          <Card className="p-6">
            <h2 className="text-kaffza-primary mb-4 flex items-center gap-2 text-base font-extrabold">
              <span>👤</span> بيانات العميل
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow label="الاسم الكامل" value={order.shippingAddress.fullName} />
              <InfoRow label="رقم الهاتف" value={order.shippingAddress.phone} />
              <InfoRow
                label="العنوان"
                value={[order.shippingAddress.addressLine1, order.shippingAddress.addressLine2]
                  .filter(Boolean)
                  .join('، ')}
              />
              <InfoRow
                label="المدينة / المحافظة"
                value={`${order.shippingAddress.city} - ${order.shippingAddress.state}`}
              />
              {order.shippingAddress.postalCode ? (
                <InfoRow label="الرمز البريدي" value={order.shippingAddress.postalCode} />
              ) : null}
              <InfoRow label="الدولة" value={getCountryName(order.shippingAddress.country)} />
            </div>
            {order.customerNotes ? (
              <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-3">
                <p className="text-xs font-bold text-amber-700">ملاحظات العميل</p>
                <p className="mt-1 text-sm text-amber-800">{order.customerNotes}</p>
              </div>
            ) : null}
          </Card>

          {/* Order Items Card */}
          <Card className="overflow-hidden p-0">
            <div className="border-b border-black/5 p-5">
              <h2 className="text-kaffza-primary flex items-center gap-2 text-base font-extrabold">
                <span>🛒</span> المنتجات المطلوبة
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-kaffza-bg">
                  <tr className="text-right">
                    <th className="text-kaffza-primary px-5 py-3 font-extrabold">المنتج</th>
                    <th className="text-kaffza-primary px-5 py-3 font-extrabold">سعر الوحدة</th>
                    <th className="text-kaffza-primary px-5 py-3 font-extrabold">الكمية</th>
                    <th className="text-kaffza-primary px-5 py-3 font-extrabold">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.length === 0 ? (
                    <tr>
                      <td className="text-kaffza-text/60 px-5 py-6 text-center" colSpan={4}>
                        لا توجد منتجات في هذا الطلب
                      </td>
                    </tr>
                  ) : (
                    order.items.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-kaffza-bg/40 border-t border-black/5 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="text-kaffza-text font-semibold">{item.productName}</div>
                        </td>
                        <td className="text-kaffza-text/80 px-5 py-4">
                          {item.unitPrice.toFixed(3)} ر.ع
                        </td>
                        <td className="px-5 py-4">
                          <span className="bg-kaffza-bg text-kaffza-text inline-flex items-center justify-center rounded-lg px-3 py-1 text-xs font-bold">
                            ×{item.quantity}
                          </span>
                        </td>
                        <td className="text-kaffza-primary px-5 py-4 font-bold">
                          {item.totalPrice.toFixed(3)} ر.ع
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right column: summary & controls */}
        <div className="space-y-6">
          {/* Payment Summary Card */}
          <Card className="p-5">
            <h2 className="text-kaffza-primary mb-4 flex items-center gap-2 text-base font-extrabold">
              <span>💳</span> ملخص الدفع
            </h2>

            <div className="space-y-3">
              <SummaryRow label="المنتجات" value={`${order.subtotal.toFixed(3)} ر.ع`} />
              <SummaryRow
                label="الشحن"
                value={order.shippingCost > 0 ? `${order.shippingCost.toFixed(3)} ر.ع` : 'مجاني'}
                highlight={order.shippingCost === 0}
              />
              {taxAmount > 0 ? (
                <SummaryRow label="الضريبة" value={`${taxAmount.toFixed(3)} ر.ع`} />
              ) : null}
              <div className="border-t border-black/10 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-kaffza-text font-extrabold">الإجمالي الكلي</span>
                  <span className="text-kaffza-primary text-lg font-extrabold">
                    {order.totalAmount.toFixed(3)} ر.ع
                  </span>
                </div>
              </div>
            </div>

            {/* Thawani Payment Status */}
            <div className="bg-kaffza-bg mt-5 rounded-xl border border-black/5 p-4">
              <p className="text-kaffza-text/70 text-xs font-bold">حالة الدفع (ثواني)</p>
              <div className="mt-2 flex items-center gap-2">
                <PaymentBadge status={paymentStatus} />
                {paymentStatus === 'paid' ? (
                  <span className="text-xs text-green-700">تم استلام الدفع بنجاح</span>
                ) : (
                  <span className="text-xs text-amber-700">في انتظار تأكيد الدفع</span>
                )}
              </div>
            </div>

            {/* Merchant earnings */}
            <div className="mt-4 rounded-xl border border-[#1B3A6B]/10 bg-[#1B3A6B]/5 p-4">
              <p className="text-kaffza-primary/70 text-xs font-bold">صافي أرباحك</p>
              <p className="text-kaffza-primary mt-1 text-xl font-extrabold">
                {order.merchantAmount.toFixed(3)} ر.ع
              </p>
              <p className="text-kaffza-text/50 mt-1 text-xs">
                بعد خصم عمولة قفزة ({order.commissionAmount.toFixed(3)} ر.ع)
              </p>
            </div>
          </Card>

          {/* Status Control Card */}
          <Card className="p-5">
            <h2 className="text-kaffza-primary mb-4 flex items-center gap-2 text-base font-extrabold">
              <span>🔄</span> تحديث حالة الطلب
            </h2>

            <div className="mb-3">
              <p className="text-kaffza-text/60 mb-2 text-xs">الحالة الحالية</p>
              <StatusPill status={order.status} />
            </div>

            <div className="mt-4 space-y-2">
              {STATUS_OPTIONS.filter((opt) => opt.value !== order.status).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  disabled={statusLoading || !storeId}
                  className={
                    'w-full rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ' +
                    (opt.value === 'cancelled'
                      ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                      : opt.value === 'delivered'
                        ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                        : 'text-kaffza-primary border-[#1B3A6B]/20 bg-[#1B3A6B]/5 hover:bg-[#1B3A6B]/10')
                  }
                >
                  {statusLoading ? '...' : `تحويل إلى: ${opt.label}`}
                </button>
              ))}
            </div>

            {!storeId ? (
              <p className="text-kaffza-text/50 mt-3 text-center text-xs">
                اختر متجرًا لتفعيل التحكم بالحالة
              </p>
            ) : null}
          </Card>

          {/* Order Meta */}
          <Card className="p-5">
            <h2 className="text-kaffza-text/70 mb-4 text-sm font-extrabold">معلومات الطلب</h2>
            <div className="text-kaffza-text/70 space-y-2 text-xs">
              <div className="flex justify-between">
                <span>رقم الطلب</span>
                <span className="text-kaffza-text font-bold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>تاريخ الإنشاء</span>
                <span className="text-kaffza-text font-bold">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>آخر تحديث</span>
                <span className="text-kaffza-text font-bold">{formatDate(order.updatedAt)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────── Helper Components ──────────────────── */

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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-kaffza-text/50 text-xs font-bold">{label}</p>
      <p className="text-kaffza-text mt-0.5 text-sm font-semibold">{value || '—'}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-kaffza-text/70">{label}</span>
      <span className={`font-semibold ${highlight ? 'text-green-600' : 'text-kaffza-text'}`}>
        {value}
      </span>
    </div>
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

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('ar', { year: 'numeric', month: 'short', day: '2-digit' });
  } catch {
    return iso;
  }
}
