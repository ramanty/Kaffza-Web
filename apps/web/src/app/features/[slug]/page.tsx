import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { FEATURE_CATALOG, getFeatureBySlug } from '../../../lib/feature-catalog';

export function generateStaticParams() {
  return FEATURE_CATALOG.map((feature) => ({ slug: feature.slug }));
}

export default function FeatureDetailsPage({ params }: { params: { slug: string } }) {
  const feature = getFeatureBySlug(params.slug);
  if (!feature) notFound();

  return (
    <main dir="rtl" className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-kaffza-primary text-3xl font-extrabold">{feature.titleAr}</h1>
        <Link className="text-kaffza-text/70 text-sm font-bold underline" href="/features">
          العودة للمميزات
        </Link>
      </div>

      <p className="text-kaffza-text/80 mt-3 text-sm">{feature.summaryAr}</p>

      <Card className="mt-8 p-6">
        <h2 className="text-kaffza-primary text-lg font-extrabold">شرح الميزة</h2>
        <ul className="text-kaffza-text/85 mt-4 space-y-3 text-sm">
          {feature.detailsAr.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-kaffza-primary mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/merchant/register">
          <Button>ابدأ الآن</Button>
        </Link>
        <Link href="/contact">
          <Button variant="secondary">تواصل معنا</Button>
        </Link>
      </div>
    </main>
  );
}
