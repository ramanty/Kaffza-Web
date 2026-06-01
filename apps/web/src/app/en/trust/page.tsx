import Link from 'next/link';

import { Card } from '../../../components/Card';
import {
  TRUST_CATALOG,
  getTrustPoints,
  getTrustSummary,
  getTrustTitle,
} from '../../../lib/trust-catalog';

export default function EnTrustPage() {
  return (
    <main dir="ltr" className="mx-auto max-w-6xl px-6 py-12">
      <div className="bg-background rounded-2xl border border-border px-6 py-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-primary text-3xl font-extrabold">Trust & Safety</h1>
          <Link className="text-muted-foreground text-sm font-bold underline" href="/en">
            Home
          </Link>
        </div>

        <p className="text-foreground/80 mt-3 max-w-2xl text-sm leading-6">
          Practical credibility and protection layers designed to reduce risk for both merchants and
          customers.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {TRUST_CATALOG.map((item) => (
          <Link key={item.slug} href={`/en/trust/${item.slug}`}>
            <Card className="h-full border-border p-6 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="text-primary text-lg font-extrabold">
                {getTrustTitle(item, true)}
              </div>
              <p className="text-foreground/80 mt-2 text-sm leading-6">
                {getTrustSummary(item, true)}
              </p>
              <ul className="text-muted-foreground mt-3 space-y-1 text-xs">
                {getTrustPoints(item, true)
                  .slice(0, 2)
                  .map((point) => (
                    <li key={point}>• {point}</li>
                  ))}
              </ul>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
