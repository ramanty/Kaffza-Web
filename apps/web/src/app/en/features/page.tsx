import Link from 'next/link';

import { Card } from '../../../components/Card';
import { FEATURE_CATALOG } from '../../../lib/feature-catalog';

const FEATURE_PAGES = FEATURE_CATALOG.slice(0, 6);

export default function EnFeaturesPage() {
  return (
    <main dir="ltr" className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-primary text-3xl font-extrabold">Kaffza Features</h1>
        <Link className="text-muted-foreground text-sm font-bold underline" href="/en">
          Home
        </Link>
      </div>

      <p className="text-foreground/80 mt-3 max-w-3xl text-sm">
        Click any feature card to open its dedicated details page.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURE_PAGES.map((feature, idx) => (
          <Link key={feature.slug} href={`/en/features/${feature.slug}`}>
            <Card className="h-full p-6 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="text-primary text-2xl font-extrabold">{idx + 1}</div>
              <div className="text-primary mt-2 text-lg font-extrabold">
                {feature.titleEn}
              </div>
              <p className="text-foreground/80 mt-2 text-sm">{feature.summaryEn}</p>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
