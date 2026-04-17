import Link from 'next/link';

import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { FEATURE_CATALOG } from '../../lib/feature-catalog';

const FEATURE_PAGES = FEATURE_CATALOG.slice(0, 6);

export default function FeaturesPage() {
  return (
    <main dir="rtl" className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-kaffza-primary text-3xl font-extrabold">مميزات Kaffza</h1>
        <a className="text-kaffza-text/70 text-sm font-bold underline" href="https://kaffza.me">
          الرئيسية
        </a>
      </div>

      <p className="text-kaffza-text/80 mt-3 max-w-3xl text-sm">
        كل بطاقة أدناه تفتح صفحة شرح مفصلة للميزة.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURE_PAGES.map((feature, idx) => (
          <Link key={feature.slug} href={`/features/${feature.slug}`}>
            <Card className="h-full p-6 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="text-kaffza-primary text-2xl font-extrabold">{idx + 1}</div>
              <div className="text-kaffza-primary mt-2 text-lg font-extrabold">
                {feature.titleAr}
              </div>
              <p className="text-kaffza-text/80 mt-2 text-sm">{feature.summaryAr}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/merchant/register">
          <Button>سجّل كتاجر</Button>
        </Link>
        <Link href="/pricing">
          <Button variant="secondary">شاهد الخطط</Button>
        </Link>
      </div>
    </main>
  );
}
