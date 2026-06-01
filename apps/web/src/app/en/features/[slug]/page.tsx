import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Card } from '../../../../components/Card';
import { FEATURE_CATALOG, getFeatureBySlug } from '../../../../lib/feature-catalog';

export function generateStaticParams() {
  return FEATURE_CATALOG.map((feature) => ({ slug: feature.slug }));
}

export default function EnFeatureDetailsPage({ params }: { params: { slug: string } }) {
  const feature = getFeatureBySlug(params.slug);
  if (!feature) notFound();

  return (
    <main dir="ltr" className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-primary text-3xl font-extrabold">{feature.titleEn}</h1>
        <Link className="text-muted-foreground text-sm font-bold underline" href="/en/features">
          Back to features
        </Link>
      </div>

      <p className="text-foreground/80 mt-3 text-sm">{feature.summaryEn}</p>

      <Card className="mt-8 p-6">
        <h2 className="text-primary text-lg font-extrabold">Feature details</h2>
        <ul className="text-foreground/85 mt-4 space-y-3 text-sm">
          {feature.detailsEn.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>
    </main>
  );
}
