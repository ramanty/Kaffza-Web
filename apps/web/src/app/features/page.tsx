import Link from 'next/link';

import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

const FEATURES = [
  {
    title: 'متجر كامل لكل تاجر',
    text: 'منتجات، سلة، دفع، طلبات، ومتابعة الشحن ضمن واجهة واحدة.',
  },
  {
    title: 'دفع محلي عبر ثواني',
    text: 'تجربة دفع مناسبة للسوق العماني مع ربط مباشر ببوابة الدفع.',
  },
  {
    title: 'حماية Escrow',
    text: 'حماية مالية مرنة حسب مستوى ثقة التاجر وسلوك الطلبات.',
  },
  {
    title: 'لوحة تاجر احترافية',
    text: 'إدارة المنتجات، التصنيفات، الطلبات، والمحفظة بسهولة.',
  },
  {
    title: 'لوحة منصة للأدمن',
    text: 'متابعة النزاعات، المدفوعات، السحوبات، والحسابات المركزية.',
  },
  {
    title: 'دعم عربي/إنجليزي',
    text: 'واجهة عربية RTL مع دعم إنجليزي عبر نفس المنصة.',
  },
];

export default function FeaturesPage() {
  return (
    <main dir="rtl" className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-kaffza-primary text-3xl font-extrabold">مميزات Kaffza</h1>
        <Link className="text-kaffza-text/70 text-sm font-bold underline" href="/">
          الرئيسية
        </Link>
      </div>

      <p className="text-kaffza-text/80 mt-3 max-w-3xl text-sm">
        Kaffza مبنية لتخدم التجارة الإلكترونية في عُمان من أول خطوة تسجيل وحتى إدارة الطلبات
        والمدفوعات.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <Card key={feature.title} className="p-6">
            <div className="text-kaffza-primary text-lg font-extrabold">{feature.title}</div>
            <p className="text-kaffza-text/80 mt-2 text-sm">{feature.text}</p>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/merchant/register">
          <Button>ابدأ كتاجر</Button>
        </Link>
        <Link href="/register">
          <Button variant="secondary">إنشاء حساب عميل</Button>
        </Link>
      </div>
    </main>
  );
}
