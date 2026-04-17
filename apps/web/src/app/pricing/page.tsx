import Link from 'next/link';

import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

const PLANS = [
  {
    name: 'Starter (البداية)',
    price: '5 ر.ع / شهر',
    commission: '2%',
    notes: ['متجر جاهز', 'دعم أساسي', 'ربط دفع'],
  },
  {
    name: 'Growth (النمو)',
    price: '8 ر.ع / شهر',
    commission: '1%',
    notes: ['مناسب للتوسع', 'تقارير أفضل', 'مرونة أكبر'],
    popular: true,
  },
  {
    name: 'Pro (المحترف)',
    price: '35 ر.ع / شهر',
    commission: '0.5%',
    notes: ['ميزات متقدمة', 'أولوية أعلى', 'تشغيل احترافي'],
  },
];

export default function PricingPage() {
  return (
    <main dir="rtl" className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-kaffza-primary text-3xl font-extrabold">الخطط والأسعار</h1>
        <Link className="text-kaffza-text/70 text-sm font-bold underline" href="/">
          الرئيسية
        </Link>
      </div>

      <p className="text-kaffza-text/80 mt-3 text-sm">
        اختر الخطة المناسبة لمرحلة متجرك. العمولة تُحسب على الطلبات الناجحة حسب الخطة.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={
              'p-6 ' + (plan.popular ? 'border-kaffza-premium ring-kaffza-premium/40 ring-1' : '')
            }
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-kaffza-primary text-lg font-extrabold">{plan.name}</div>
              {plan.popular ? (
                <span className="bg-kaffza-premium text-kaffza-dark-blue rounded-full px-3 py-1 text-xs font-extrabold">
                  الأكثر طلباً
                </span>
              ) : null}
            </div>
            <div className="text-kaffza-info mt-3 text-2xl font-extrabold">{plan.price}</div>
            <div className="text-kaffza-text/80 mt-1 text-sm">العمولة: {plan.commission}</div>
            <ul className="text-kaffza-text/80 mt-4 space-y-2 text-sm">
              {plan.notes.map((n) => (
                <li key={n}>• {n}</li>
              ))}
            </ul>
            <div className="mt-5">
              <Link href="/merchant/register">
                <Button className="w-full">سجّل كتاجر</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
