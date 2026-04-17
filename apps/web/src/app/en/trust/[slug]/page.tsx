import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Card } from '../../../../components/Card';
import { TRUST_CATALOG, getTrustBySlug } from '../../../../lib/trust-catalog';

export function generateStaticParams() {
  return TRUST_CATALOG.map((item) => ({ slug: item.slug }));
}

export default function EnTrustDetailsPage({ params }: { params: { slug: string } }) {
  const item = getTrustBySlug(params.slug);
  if (!item) notFound();

  return (
    <main dir="ltr" className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-kaffza-primary text-3xl font-extrabold">{item.title}</h1>
        <Link className="text-kaffza-text/70 text-sm font-bold underline" href="/en/trust">
          Back to Trust & Safety
        </Link>
      </div>

      <p className="text-kaffza-text/80 mt-3 text-sm">{item.summary}</p>

      <Card className="mt-8 p-6">
        <ul className="text-kaffza-text/85 space-y-3 text-sm">
          {item.points.map((point) => (
            <li key={point} className="flex items-start gap-2">
              <span className="text-kaffza-primary mt-0.5">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </Card>
    </main>
  );
}
