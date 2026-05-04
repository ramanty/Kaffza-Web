import Link from 'next/link';

import { Card } from '../../components/Card';
import { PlanCardActions } from '../../components/PlanCardActions';
import { PLAN_CATALOG, getPlanNotes, getPlanSubtitle } from '../../lib/plan-catalog';

export default function PricingPage() {
  return (
    <main dir="rtl" className="mx-auto max-w-6xl px-6 py-12">
      <div className="bg-kaffza-bg rounded-2xl border border-black/10 px-6 py-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-kaffza-primary text-3xl font-extrabold">الخطط والأسعار</h1>
          <Link className="text-kaffza-text/70 text-sm font-bold underline" href="/">
            الرئيسية
          </Link>
        </div>

        <p className="text-kaffza-text/80 mt-3 max-w-2xl text-sm leading-6">
          اختر الخطة المناسبة لمرحلة متجرك. الأسعار شهرية والعمولة تُحسب على الطلبات الناجحة فقط.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {PLAN_CATALOG.map((plan) => (
          <Card
            key={plan.slug}
            className={
              'flex h-full flex-col p-6 ' +
              (plan.popular
                ? 'border-kaffza-premium ring-kaffza-premium/40 ring-1'
                : 'border-black/10')
            }
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-kaffza-primary text-lg font-extrabold">{plan.name}</div>
                <div className="text-kaffza-text/60 mt-1 text-xs">{getPlanSubtitle(plan)}</div>
              </div>
              {plan.popular ? (
                <span className="bg-kaffza-premium text-kaffza-dark-blue rounded-full px-3 py-1 text-xs font-extrabold">
                  الأكثر طلباً
                </span>
              ) : null}
            </div>
            <div className="text-kaffza-info mt-4 text-3xl font-extrabold">
              {plan.priceOmr} ر.ع <span className="text-kaffza-text/60 text-sm">/شهر</span>
            </div>
            <div className="text-kaffza-text/80 mt-1 text-sm">العمولة: {plan.commission}</div>
            <ul className="text-kaffza-text/80 mt-4 flex-1 space-y-2 text-sm">
              {getPlanNotes(plan).map((n) => (
                <li key={n} className="flex items-start gap-2">
                  <span className="text-kaffza-primary mt-0.5">✓</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
            <PlanCardActions slug={plan.slug} />
          </Card>
        ))}
      </div>
    </main>
  );
}
