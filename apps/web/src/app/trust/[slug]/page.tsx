import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Card } from '../../../components/Card';
import {
  TRUST_CATALOG,
  getTrustBySlug,
  getTrustPoints,
  getTrustSummary,
  getTrustTitle,
} from '../../../lib/trust-catalog';

export function generateStaticParams() {
  return TRUST_CATALOG.map((item) => ({ slug: item.slug }));
}

export default function TrustDetailsPage({ params }: { params: { slug: string } }) {
  const item = getTrustBySlug(params.slug);
  if (!item) notFound();

  return (
    <main dir="rtl" className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-primary text-3xl font-extrabold">{getTrustTitle(item)}</h1>
        <Link className="text-muted-foreground text-sm font-bold underline" href="/trust">
          العودة للثقة والأمان
        </Link>
      </div>

      <p className="text-foreground/80 mt-3 text-sm">{getTrustSummary(item)}</p>

      <Card className="mt-8 p-6">
        <ul className="text-foreground/85 space-y-3 text-sm">
          {getTrustPoints(item).map((point) => (
            <li key={point} className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </Card>
    </main>
  );
}
