import Link from "next/link";
import { PLAN_CATALOG } from "../../lib/plan-catalog";

export default function Pricing() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="section-title">الخطط والأسعار</h1>
        <p className="text-twilight mt-2">اختر الخطة المناسبة. العمولة فقط على الطلبات الناجحة.</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {PLAN_CATALOG.map((plan, i) => (
          <div key={i} className={"glass-card p-7 flex flex-col " + (plan.popular ? "ring-1 ring-omani-amber/60" : "")}>
            <div className="flex justify-between">
              <div>
                <div className="font-bold text-xl">{plan.subtitleAr} <span className="text-twilight">({plan.name})</span></div>
                <div className="text-xs text-twilight">العمولة {plan.commission}</div>
              </div>
              {plan.popular && <span className="text-[10px] px-3 py-1 bg-omani-amber text-midnight-void rounded-full font-bold">الأكثر طلباً</span>}
            </div>
            <div className="mt-6 text-5xl font-bold">{plan.priceOmr} <span className="text-base text-twilight">ر.ع / شهر</span></div>
            <ul className="mt-6 space-y-2 text-sm flex-1">
              {plan.notesAr.map((n, ni) => <li key={ni}>✓ {n}</li>)}
            </ul>
            <Link href="/merchant/register" className={plan.popular ? "btn-primary mt-6 text-center" : "btn-secondary mt-6 text-center"}>
              {plan.priceOmr === 0 ? "ابدأ مجاناً" : "اشترك الآن"}
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
