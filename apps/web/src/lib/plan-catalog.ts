export type PlanCatalogItem = {
  slug: 'starter' | 'growth' | 'pro';
  name: string;
  subtitle: string;
  priceOmr: number;
  commission: string;
  popular?: boolean;
  notes: string[];
  details: string[];
};

export const PLAN_CATALOG: PlanCatalogItem[] = [
  {
    slug: 'starter',
    name: 'Starter',
    subtitle: 'البداية',
    priceOmr: 5,
    commission: '2%',
    notes: ['متجر جاهز', 'دعم أساسي', 'ربط دفع'],
    details: [
      'مناسب للتجار الجدد في بداية مشروعهم.',
      'واجهة متجر جاهزة مع إعدادات أساسية سريعة.',
      'دعم فني أساسي عبر قنوات المساندة.',
      'ربط الدفع المحلي للبدء باستقبال الطلبات.',
    ],
  },
  {
    slug: 'growth',
    name: 'Growth',
    subtitle: 'النمو',
    priceOmr: 8,
    commission: '1%',
    popular: true,
    notes: ['مناسب للتوسع', 'تقارير أفضل', 'مرونة أكبر'],
    details: [
      'أفضل خيار للتاجر الذي دخل مرحلة التوسع.',
      'تقارير ومؤشرات أقوى لفهم الأداء اليومي.',
      'مرونة أعلى في إدارة العروض والمنتجات.',
      'تكلفة عمولة أقل من خطة البداية.',
    ],
  },
  {
    slug: 'pro',
    name: 'Pro',
    subtitle: 'المحترف',
    priceOmr: 35,
    commission: '0.5%',
    notes: ['ميزات متقدمة', 'أولوية أعلى', 'تشغيل احترافي'],
    details: [
      'خطة مخصصة للعلامات التجارية الجادة.',
      'أولوية أعلى في الدعم والخدمة.',
      'تشغيل احترافي مع مميزات متقدمة.',
      'أقل عمولة للطلبات الناجحة.',
    ],
  },
];

export function getPlanBySlug(slug: string) {
  return PLAN_CATALOG.find((plan) => plan.slug === slug);
}
