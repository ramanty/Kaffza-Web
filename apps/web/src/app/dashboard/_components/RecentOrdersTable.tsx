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

const STATUS_META_AR: Record<string, { label: string; cls: string }> = {
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

const STATUS_META_EN: Record<string, { label: string; cls: string }> = {
  [OrderStatus.PENDING]: {
    label: 'Pending',
    cls: 'bg-kaffza-warning/10 text-kaffza-warning',
  },
  [OrderStatus.CONFIRMED]: {
    label: 'Confirmed',
    cls: 'bg-kaffza-info/10 text-kaffza-info',
  },
  [OrderStatus.PROCESSING]: {
    label: 'Processing',
    cls: 'bg-kaffza-order/10 text-kaffza-order',
  },
  [OrderStatus.SHIPPED]: {
    label: 'Shipped',
    cls: 'bg-kaffza-info/10 text-kaffza-info',
  },
  [OrderStatus.DELIVERED]: {
    label: 'Delivered',
    cls: 'bg-kaffza-success/10 text-kaffza-success',
  },
  [OrderStatus.CANCELLED]: {
    label: 'Cancelled',
    cls: 'bg-red-50 text-red-600',
  },
  [OrderStatus.REFUNDED]: {
    label: 'Refunded',
    cls: 'bg-gray-100 text-gray-600',
  },
};

function getStatusMeta(status: string, isEn: boolean) {
  const map = isEn ? STATUS_META_EN : STATUS_META_AR;
  return map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' };
}

function StatusBadge({ status, isEn }: { status: string; isEn: boolean }) {
  const { label, cls } = getStatusMeta(status, isEn);
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${cls}`}>{label}</span>
  );
}

function formatDate(val: string | Date, isEn: boolean) {
  try {
    const d = typeof val === 'string' ? new Date(val) : val;
    return d.toLocaleString(isEn ? 'en' : 'ar', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  } catch {
    return String(val);
  }
}

export interface RecentOrdersTableProps {
  orders: OrderRow[];
  loading?: boolean;
  isEn?: boolean;
}

function withLang(path: string, isEn: boolean) {
  return isEn ? `${path}${path.includes('?') ? '&' : '?'}lang=en` : path;
}

export function RecentOrdersTable({
  orders,
  loading = false,
  isEn = false,
}: RecentOrdersTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-primary text-base font-extrabold">
            {isEn ? 'Recent Orders' : 'آخر الطلبات'}
          </h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {loading
              ? isEn
                ? 'Loading...'
                : 'جاري التحميل...'
              : isEn
                ? `${orders.length} recent orders`
                : `${orders.length} طلبات حديثة`}
          </p>
        </div>
        <Link
          href={withLang('/dashboard/orders', isEn)}
          className="bg-background text-primary hover:bg-primary/10 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors"
        >
          {isEn ? 'View all' : 'عرض الكل'}
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-background">
            <tr className={isEn ? 'text-left' : 'text-right'}>
              <th className="text-foreground/80 whitespace-nowrap px-5 py-3 font-bold">
                {isEn ? 'Order #' : 'رقم الطلب'}
              </th>
              <th className="text-foreground/80 whitespace-nowrap px-5 py-3 font-bold">
                {isEn ? 'Customer' : 'العميل'}
              </th>
              <th className="text-foreground/80 whitespace-nowrap px-5 py-3 font-bold">
                {isEn ? 'Date' : 'التاريخ'}
              </th>
              <th className="text-foreground/80 whitespace-nowrap px-5 py-3 font-bold">
                {isEn ? 'Total' : 'الإجمالي'}
              </th>
              <th className="text-foreground/80 whitespace-nowrap px-5 py-3 font-bold">
                {isEn ? 'Status' : 'الحالة'}
              </th>
              <th className="text-foreground/80 whitespace-nowrap px-5 py-3 font-bold">
                {isEn ? 'Action' : 'إجراء'}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-5 py-3">
                      <span className="inline-block h-4 w-24 animate-pulse rounded bg-black/10" />
                    </td>
                  ))}
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted-foreground px-5 py-8 text-center text-sm">
                  {isEn ? 'No recent orders' : 'لا توجد طلبات حديثة'}
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={String(order.id)}
                  className="hover:bg-background/50 border-t border-border transition-colors"
                >
                  <td className="px-5 py-3">
                    <span className="text-foreground font-extrabold">{order.orderNumber}</span>
                  </td>
                  <td className="text-foreground/80 px-5 py-3">{order.customerName}</td>
                  <td className="text-muted-foreground px-5 py-3">
                    {formatDate(order.createdAt, isEn)}
                  </td>
                  <td className="text-primary px-5 py-3 font-bold">
                    {Number(order.totalAmount).toFixed(3)} ر.ع
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={order.status} isEn={isEn} />
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={withLang(`/dashboard/orders?id=${order.id}`, isEn)}
                      className="border-kaffza-primary/30 text-primary hover:bg-primary rounded-lg border px-3 py-1 text-xs font-bold transition-colors hover:text-white"
                    >
                      {isEn ? 'View details' : 'عرض التفاصيل'}
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
