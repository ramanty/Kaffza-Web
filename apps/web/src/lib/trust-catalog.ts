export type TrustCatalogItem = {
  slug: 'escrow' | 'thawani-payments' | 'made-in-oman';
  title: string;
  summary: string;
  points: string[];
};

export const TRUST_CATALOG: TrustCatalogItem[] = [
  {
    slug: 'escrow',
    title: 'Escrow Protection',
    summary: 'حماية مالية تقلل المخاطر بين التاجر والعميل حتى اكتمال الطلب.',
    points: [
      'يتم الاحتفاظ بالمبلغ بشكل آمن حتى استيفاء شروط التسليم.',
      'آلية واضحة لفض النزاعات عند وجود مشكلة في الطلب.',
      'تعزيز الثقة للطرفين في كل عملية شراء.',
    ],
  },
  {
    slug: 'thawani-payments',
    title: 'دفع محلي عبر ثواني',
    summary: 'تجربة دفع مناسبة للسوق العماني بتكامل مباشر مع ثواني.',
    points: [
      'إتمام الدفع بسهولة داخل تجربة شراء موحدة.',
      'ربط حالات الدفع تلقائياً مع حالة الطلب.',
      'جاهزية تشغيلية محلية للتجار في سلطنة عمان.',
    ],
  },
  {
    slug: 'made-in-oman',
    title: 'Made in Oman',
    summary: 'منصة مبنية للسوق العماني من حيث اللغة، السياق، وتجربة المستخدم.',
    points: [
      'تجربة عربية أولاً مع دعم الإنجليزية.',
      'تدفق أعمال مناسب للتاجر المحلي.',
      'هوية محلية تدعم نمو التجارة الإلكترونية في عمان.',
    ],
  },
];

export function getTrustBySlug(slug: string) {
  return TRUST_CATALOG.find((item) => item.slug === slug);
}
