import Link from 'next/link';
import { OrderStatus } from '@kaffza/types';

export interface OrderRow {
  id: string | number;
  orderNumber: string;
  customerName: string;
  createdAt: string | Date;
  totalAmount: number;
  status: string;
}

// Typed mock data matching @kaffza/types IOrder shape
export const MOCK_RECENT_ORDERS: OrderRow[] = [
  {
    id: 1001,
    orderNumber: 'KFZ-20240401-0001',
    customerName: 'أحمد بن سالم',
    createdAt: '2024-04-01T10:30:00.000Z',
    totalAmount: 47.5,
    status: OrderStatus.DELIVERED,
  },
  {
    id: 1002,
    orderNumber: 'KFZ-20240401-0002',
    customerName: 'فاطمة الزهراء',
    createdAt: '2024-04-01T14:15:00.000Z',
    totalAmount: 23.75,
    status: OrderStatus.SHIPPED,
  },
  {
    id: 1003,
    orderNumber: 'KFZ-20240402-0003',
    customerName: 'محمد العلوي',
    createdAt: '2024-04-02T09:00:00.000Z',
    totalAmount: 89.0,
    status: OrderStatus.PENDING,
  },
  {
    id: 1004,
    orderNumber: 'KFZ-20240402-0004',
    customerName: 'سارة المنصوري',
    createdAt: '2024-04-02T16:45:00.000Z',
    totalAmount: 15.25,
    status: OrderStatus.CONFIRMED,
  },
  {
    id: 1005,
    orderNumber: 'KFZ-20240403-0005',
    customerName: 'خالد البلوشي',
    createdAt: '2024-04-03T11:20:00.000Z',
    totalAmount: 62.0,
    status: OrderStatus.DELIVERED,
  },
];

const STATUS_META: Record<string, { label: string; cls: string }> = {
  [OrderStatus.PENDING]: {
    label: 'معلق',
    cls: 'bg-kaffza-warning/10 text-kaffza-warning',
  },
  [OrderStatus.CONFIRMED]: {
    label: 'مؤكد',
    cls: 'bg-kaffza-info/10 text-kaffza-info',
  },
  [OrderStatus.PROCESSING]: {
    label: 'قيد المعالجة',
    cls: 'bg-kaffza-order/10 text-kaffza-order',
  },
  [OrderStatus.SHIPPED]: {
    label: 'تم الشحن',
    cls: 'bg-kaffza-info/10 text-kaffza-info',
  },
  [OrderStatus.DELIVERED]: {
    label: 'تم التسليم',
    cls: 'bg-kaffza-success/10 text-kaffza-success',
  },
  [OrderStatus.CANCELLED]: {
    label: 'ملغي',
    cls: 'bg-red-50 text-red-600',
  },
  [OrderStatus.REFUNDED]: {
    label: 'مسترجع',
    cls: 'bg-gray-100 text-gray-600',
  },
};

function getStatusMeta(status: string) {
  return STATUS_META[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' };
}

function StatusBadge({ status }: { status: string }) {
  const { label, cls } = getStatusMeta(status);
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${cls}`}>{label}</span>
  );
}

function formatDate(val: string | Date) {
  try {
    const d = typeof val === 'string' ? new Date(val) : val;
    return d.toLocaleString('ar', { year: 'numeric', month: 'short', day: '2-digit' });
  } catch {
    return String(val);
  }
}

export interface RecentOrdersTableProps {
  orders: OrderRow[];
  loading?: boolean;
}

export function RecentOrdersTable({ orders, loading = false }: RecentOrdersTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
        <div>
          <h2 className="text-kaffza-primary text-base font-extrabold">آخر الطلبات</h2>
          <p className="text-kaffza-text/60 mt-0.5 text-xs">
            {loading ? 'جاري التحميل...' : `${orders.length} طلبات حديثة`}
          </p>
        </div>
        <Link
          href="/dashboard/orders"
          className="bg-kaffza-bg text-kaffza-primary hover:bg-kaffza-primary/10 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors"
        >
          عرض الكل
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-kaffza-bg">
            <tr className="text-right">
              <th className="text-kaffza-text/80 whitespace-nowrap px-5 py-3 font-bold">
                رقم الطلب
              </th>
              <th className="text-kaffza-text/80 whitespace-nowrap px-5 py-3 font-bold">العميل</th>
              <th className="text-kaffza-text/80 whitespace-nowrap px-5 py-3 font-bold">التاريخ</th>
              <th className="text-kaffza-text/80 whitespace-nowrap px-5 py-3 font-bold">
                الإجمالي
              </th>
              <th className="text-kaffza-text/80 whitespace-nowrap px-5 py-3 font-bold">الحالة</th>
              <th className="text-kaffza-text/80 whitespace-nowrap px-5 py-3 font-bold">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-black/5">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-5 py-3">
                      <span className="inline-block h-4 w-24 animate-pulse rounded bg-black/10" />
                    </td>
                  ))}
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-kaffza-text/60 px-5 py-8 text-center text-sm">
                  لا توجد طلبات حديثة
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={String(order.id)}
                  className="hover:bg-kaffza-bg/50 border-t border-black/5 transition-colors"
                >
                  <td className="px-5 py-3">
                    <span className="text-kaffza-text font-extrabold">{order.orderNumber}</span>
                  </td>
                  <td className="text-kaffza-text/80 px-5 py-3">{order.customerName}</td>
                  <td className="text-kaffza-text/60 px-5 py-3">{formatDate(order.createdAt)}</td>
                  <td className="text-kaffza-primary px-5 py-3 font-bold">
                    {Number(order.totalAmount).toFixed(3)} ر.ع
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/dashboard/orders?id=${order.id}`}
                      className="border-kaffza-primary/30 text-kaffza-primary hover:bg-kaffza-primary rounded-lg border px-3 py-1 text-xs font-bold transition-colors hover:text-white"
                    >
                      عرض التفاصيل
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
