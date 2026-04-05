import { ReactNode } from 'react';

export type StatCardVariant = 'primary' | 'premium' | 'order' | 'warning';

const VARIANT_STYLES: Record<
  StatCardVariant,
  { iconBg: string; iconColor: string; valueColor: string }
> = {
  primary: {
    iconBg: 'bg-kaffza-primary/10',
    iconColor: 'text-kaffza-primary',
    valueColor: 'text-kaffza-primary',
  },
  premium: {
    iconBg: 'bg-kaffza-premium/10',
    iconColor: 'text-kaffza-premium',
    valueColor: 'text-kaffza-premium',
  },
  order: {
    iconBg: 'bg-kaffza-order/10',
    iconColor: 'text-kaffza-order',
    valueColor: 'text-kaffza-primary',
  },
  warning: {
    iconBg: 'bg-kaffza-warning/10',
    iconColor: 'text-kaffza-warning',
    valueColor: 'text-kaffza-primary',
  },
};

export interface StatCardProps {
  title: string;
  value: string;
  loading?: boolean;
  icon: ReactNode;
  variant?: StatCardVariant;
  subtitle?: string;
}

export function StatCard({
  title,
  value,
  loading = false,
  icon,
  variant = 'primary',
  subtitle,
}: StatCardProps) {
  const { iconBg, iconColor, valueColor } = VARIANT_STYLES[variant];

  return (
    <div className="rounded-xl border border-black/5 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-kaffza-text/70 truncate text-sm font-medium">{title}</p>
          <div className={`mt-2 text-2xl font-extrabold ${valueColor}`}>
            {loading ? (
              <span className="inline-block h-7 w-28 animate-pulse rounded bg-black/10" />
            ) : (
              value
            )}
          </div>
          {subtitle && !loading && (
            <p className="text-kaffza-text/60 mt-1 truncate text-xs">{subtitle}</p>
          )}
        </div>
        <div className={`shrink-0 rounded-xl p-3 ${iconBg}`}>
          <div className={`h-5 w-5 ${iconColor}`}>{icon}</div>
        </div>
      </div>
    </div>
  );
}
