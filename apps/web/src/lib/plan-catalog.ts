export type PlanCatalogItem = {
  slug: 'starter' | 'growth' | 'pro';
  name: string;
  subtitleAr: string;
  subtitleEn: string;
  priceOmr: number;
  commission: string;
  popular?: boolean;
  notesAr: string[];
  notesEn: string[];
  detailsAr: string[];
  detailsEn: string[];
};

export const PLAN_CATALOG: PlanCatalogItem[] = [
  {
    slug: 'starter',
    name: 'Starter',
    subtitleAr: 'البداية',
    subtitleEn: 'Getting started',
    priceOmr: 5,
    commission: '2%',
    notesAr: ['متجر جاهز', 'دعم أساسي', 'ربط دفع'],
    notesEn: ['Ready storefront', 'Basic support', 'Payment setup'],
    detailsAr: [
      'مناسب للتجار الجدد في بداية مشروعهم.',
      'واجهة متجر جاهزة مع إعدادات أساسية سريعة.',
      'دعم فني أساسي عبر قنوات المساندة.',
      'ربط الدفع المحلي للبدء باستقبال الطلبات.',
    ],
    detailsEn: [
      'Best for merchants launching their first store.',
      'Ready storefront with quick basic setup.',
      'Core technical support through support channels.',
      'Local payment integration to start receiving orders.',
    ],
  },
  {
    slug: 'growth',
    name: 'Growth',
    subtitleAr: 'النمو',
    subtitleEn: 'Scale with confidence',
    priceOmr: 8,
    commission: '1%',
    popular: true,
    notesAr: ['مناسب للتوسع', 'تقارير أفضل', 'مرونة أكبر'],
    notesEn: ['Built for scaling', 'Better reports', 'More flexibility'],
    detailsAr: [
      'أفضل خيار للتاجر الذي دخل مرحلة التوسع.',
      'تقارير ومؤشرات أقوى لفهم الأداء اليومي.',
      'مرونة أعلى في إدارة العروض والمنتجات.',
      'تكلفة عمولة أقل من خطة البداية.',
    ],
    detailsEn: [
      'Best fit for merchants entering a growth phase.',
      'Stronger reports and metrics for daily decisions.',
      'More flexibility in products and promotional setup.',
      'Lower commission than the starter plan.',
    ],
  },
  {
    slug: 'pro',
    name: 'Pro',
    subtitleAr: 'المحترف',
    subtitleEn: 'Advanced operations',
    priceOmr: 35,
    commission: '0.5%',
    notesAr: ['ميزات متقدمة', 'أولوية أعلى', 'تشغيل احترافي'],
    notesEn: ['Advanced features', 'Higher priority', 'Pro operations'],
    detailsAr: [
      'خطة مخصصة للعلامات التجارية الجادة.',
      'أولوية أعلى في الدعم والخدمة.',
      'تشغيل احترافي مع مميزات متقدمة.',
      'أقل عمولة للطلبات الناجحة.',
    ],
    detailsEn: [
      'Built for serious brands and larger operations.',
      'Higher support and service priority.',
      'Professional operations with advanced capabilities.',
      'Lowest commission rate for successful orders.',
    ],
  },
];

export function getPlanBySlug(slug: string) {
  return PLAN_CATALOG.find((plan) => plan.slug === slug);
}

export function getPlanSubtitle(plan: PlanCatalogItem, isEn = false) {
  return isEn ? plan.subtitleEn : plan.subtitleAr;
}

export function getPlanNotes(plan: PlanCatalogItem, isEn = false) {
  return isEn ? plan.notesEn : plan.notesAr;
}

export function getPlanDetails(plan: PlanCatalogItem, isEn = false) {
  return isEn ? plan.detailsEn : plan.detailsAr;
}
