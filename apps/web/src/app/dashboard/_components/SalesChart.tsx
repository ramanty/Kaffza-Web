// Mock sales data for the last 7 days
const DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

const MOCK_SALES = [
  { day: 'السبت', amount: 142.5 },
  { day: 'الأحد', amount: 89.0 },
  { day: 'الاثنين', amount: 230.75 },
  { day: 'الثلاثاء', amount: 178.25 },
  { day: 'الأربعاء', amount: 315.0 },
  { day: 'الخميس', amount: 265.5 },
  { day: 'الجمعة', amount: 420.0 },
];

export function SalesChart() {
  const max = Math.max(...MOCK_SALES.map((d) => d.amount));

  return (
    <div className="rounded-xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-kaffza-primary text-base font-extrabold">المبيعات — آخر 7 أيام</h2>
          <p className="text-kaffza-text/60 mt-0.5 text-xs">بيانات تجريبية (OMR)</p>
        </div>
        <div className="bg-kaffza-premium/10 text-kaffza-premium rounded-lg px-3 py-1.5 text-xs font-bold">
          {MOCK_SALES.reduce((sum, d) => sum + d.amount, 0).toFixed(3)} ر.ع إجمالاً
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex h-36 items-end gap-2">
        {MOCK_SALES.map(({ day, amount }) => {
          const heightPct = max > 0 ? (amount / max) * 100 : 0;
          return (
            <div key={day} className="group relative flex flex-1 flex-col items-center gap-1">
              {/* Tooltip */}
              <div className="bg-kaffza-primary pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                {amount.toFixed(3)} ر.ع
              </div>
              <div
                className="bg-kaffza-primary/20 group-hover:bg-kaffza-primary w-full rounded-t-lg transition-all duration-300"
                style={{ height: `${heightPct}%`, minHeight: '4px' }}
              />
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="mt-2 flex gap-2">
        {MOCK_SALES.map(({ day }) => (
          <div
            key={day}
            className="text-kaffza-text/60 flex-1 text-center text-[10px] font-semibold"
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}

// re-export so it's easy to import the days constant if needed
export { DAYS };
