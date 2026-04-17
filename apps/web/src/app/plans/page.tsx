import Link from 'next/link';

import { Card } from '../../components/Card';
import { PLAN_CATALOG } from '../../lib/plan-catalog';
import { PlanCardActions } from '../../components/PlanCardActions';

export default function PlansPage() {
  return (
    <main dir="rtl" className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-kaffza-primary text-3xl font-extrabold">الخطط والأسعار</h1>
        <Link className="text-kaffza-text/70 text-sm font-bold underline" href="/">
          الرئيسية
        </Link>
      </div>

      <p className="text-kaffza-text/80 mt-3 text-sm">
        اختر الخطة المناسبة لمرحلة متجرك، ثم أضفها للسلة لإكمال الدفع.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {PLAN_CATALOG.map((plan) => (
          <Card
            key={plan.slug}
            className={
              'p-6 ' + (plan.popular ? 'border-kaffza-premium ring-kaffza-premium/40 ring-1' : '')
            }
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-kaffza-primary text-lg font-extrabold">
                {plan.name} ({plan.subtitle})
              </div>
              {plan.popular ? (
                <span className="bg-kaffza-premium text-kaffza-dark-blue rounded-full px-3 py-1 text-xs font-extrabold">
                  الأكثر طلباً
                </span>
              ) : null}
            </div>
            <div className="text-kaffza-info mt-3 text-2xl font-extrabold">
              {plan.priceOmr} ر.ع / شهر
            </div>
            <div className="text-kaffza-text/80 mt-1 text-sm">العمولة: {plan.commission}</div>
            <ul className="text-kaffza-text/80 mt-4 space-y-2 text-sm">
              {plan.notes.map((n) => (
                <li key={n}>• {n}</li>
              ))}
            </ul>
            <PlanCardActions slug={plan.slug} />
          </Card>
        ))}
      </div>
    </main>
  );
}
