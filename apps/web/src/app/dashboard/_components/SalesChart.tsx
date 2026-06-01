const DAYS_AR = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
const DAYS_EN = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const MOCK_SALES = [
  { amount: 142.5 },
  { amount: 89.0 },
  { amount: 230.75 },
  { amount: 178.25 },
  { amount: 315.0 },
  { amount: 265.5 },
  { amount: 420.0 },
];

export function SalesChart({ isEn = false }: { isEn?: boolean }) {
  const max = Math.max(...MOCK_SALES.map((d) => d.amount));
  const days = isEn ? DAYS_EN : DAYS_AR;

  return (
    <div className="rounded-xl border border-border bg-card text-card-foreground p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-primary text-base font-extrabold">
            {isEn ? 'Sales — Last 7 Days' : 'المبيعات — آخر 7 أيام'}
          </h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {isEn ? 'Demo data (OMR)' : 'بيانات تجريبية (OMR)'}
          </p>
        </div>
        <div className="bg-premium/10 text-premium rounded-lg px-3 py-1.5 text-xs font-bold">
          {MOCK_SALES.reduce((sum, d) => sum + d.amount, 0).toFixed(3)} ر.ع{' '}
          {isEn ? 'total' : 'إجمالاً'}
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex h-36 items-end gap-2">
        {MOCK_SALES.map(({ amount }, idx) => {
          const day = days[idx];
          const heightPct = max > 0 ? (amount / max) * 100 : 0;
          return (
            <div key={day} className="group relative flex flex-1 flex-col items-center gap-1">
              {/* Tooltip */}
              <div className="bg-primary pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                {amount.toFixed(3)} ر.ع
              </div>
              <div
                className="bg-primary/20 group-hover:bg-primary w-full rounded-t-lg transition-all duration-300"
                style={{ height: `${heightPct}%`, minHeight: '4px' }}
              />
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="mt-2 flex gap-2">
        {days.map((day) => (
          <div
            key={day}
            className="text-muted-foreground flex-1 text-center text-[10px] font-semibold"
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}

// re-export so it's easy to import the days constant if needed
export const DAYS = DAYS_AR;
