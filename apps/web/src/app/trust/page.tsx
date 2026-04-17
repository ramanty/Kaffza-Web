import Link from 'next/link';

import { Card } from '../../components/Card';
import { TRUST_CATALOG } from '../../lib/trust-catalog';

export default function TrustPage() {
  return (
    <main dir="rtl" className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-kaffza-primary text-3xl font-extrabold">الثقة والأمان</h1>
        <Link className="text-kaffza-text/70 text-sm font-bold underline" href="/">
          الرئيسية
        </Link>
      </div>

      <p className="text-kaffza-text/80 mt-3 text-sm">
        منظومة أمان متكاملة لبناء الثقة بين التاجر والعميل.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {TRUST_CATALOG.map((item) => (
          <Link key={item.slug} href={`/trust/${item.slug}`}>
            <Card className="h-full p-6 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="text-kaffza-primary text-lg font-extrabold">{item.title}</div>
              <p className="text-kaffza-text/80 mt-2 text-sm">{item.summary}</p>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
