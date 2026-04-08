import Link from 'next/link';

import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';

const STEPS = [
  {
    title: 'register',
    text: 'أنشئ حساب التاجر خلال أقل من دقيقة.',
    href: '/merchant/register',
    cta: 'ابدأ التسجيل',
  },
  {
    title: 'create store',
    text: 'أنشئ متجرك وحدد خطتك (Starter / Growth / Pro).',
    href: '/onboarding',
    cta: 'أنشئ متجرك',
  },
  {
    title: 'add product',
    text: 'أضف أول منتج وشارك رابط متجرك مباشرة.',
    href: '/dashboard/products/new',
    cta: 'أضف منتجك',
  },
];

export default function DemoOmanPage() {
  return (
    <main dir="rtl" className="mx-auto max-w-4xl px-6 py-12">
      <div className="text-center">
        <div className="text-kaffza-text/70 text-xs font-bold">kaffza.om/store/demo-oman</div>
        <h1 className="text-kaffza-primary mt-2 text-3xl font-extrabold">Demo — Oman</h1>
        <p className="text-kaffza-text/80 mt-3 text-sm">
          جرب رحلة التاجر في 3 خطوات: register → create store → add product
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {STEPS.map((step, idx) => (
          <Card key={step.title} className="p-5">
            <div className="text-kaffza-primary text-2xl font-extrabold">{idx + 1}</div>
            <div className="text-kaffza-primary mt-2 text-sm font-extrabold">{step.title}</div>
            <div className="text-kaffza-text/80 mt-2 text-sm">{step.text}</div>
            <div className="mt-4">
              <Link href={step.href}>
                <Button className="w-full">{step.cta}</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Link href="/merchant/register">
          <Button variant="premium">ابدأ الآن</Button>
        </Link>
      </div>
    </main>
  );
}
