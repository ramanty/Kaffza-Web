import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Card } from '../../../../components/Card';
import { PlanCardActions } from '../../../../components/PlanCardActions';
import {
  PLAN_CATALOG,
  getPlanBySlug,
  getPlanDetails,
  getPlanSubtitle,
} from '../../../../lib/plan-catalog';

export function generateStaticParams() {
  return PLAN_CATALOG.map((plan) => ({ slug: plan.slug }));
}

export default function EnPlanDetailsPage({ params }: { params: { slug: string } }) {
  const plan = getPlanBySlug(params.slug);
  if (!plan) notFound();

  return (
    <main dir="ltr" className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-primary text-3xl font-extrabold">
          {plan.name} — {getPlanSubtitle(plan, true)}
        </h1>
        <Link className="text-muted-foreground text-sm font-bold underline" href="/en/plans">
          Back to plans
        </Link>
      </div>

      <p className="text-foreground/80 mt-3 text-sm">
        Monthly price: <span className="font-extrabold">{plan.priceOmr} OMR</span> — Commission:{' '}
        <span className="font-extrabold">{plan.commission}</span>
      </p>

      <Card className="mt-8 p-6">
        <h2 className="text-primary text-lg font-extrabold">What you get</h2>
        <ul className="text-foreground/85 mt-4 space-y-3 text-sm">
          {getPlanDetails(plan, true).map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>

      <PlanCardActions slug={plan.slug} isEn />
    </main>
  );
}
