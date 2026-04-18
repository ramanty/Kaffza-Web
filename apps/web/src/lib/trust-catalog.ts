export type TrustCatalogItem = {
  slug: 'escrow' | 'thawani-payments' | 'made-in-oman';
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  pointsAr: string[];
  pointsEn: string[];
};

export const TRUST_CATALOG: TrustCatalogItem[] = [
  {
    slug: 'escrow',
    titleAr: 'حماية Escrow',
    titleEn: 'Escrow Protection',
    summaryAr: 'حماية مالية تقلل المخاطر بين التاجر والعميل حتى اكتمال الطلب.',
    summaryEn: 'Financial protection that lowers risk until order requirements are completed.',
    pointsAr: [
      'يتم الاحتفاظ بالمبلغ بشكل آمن حتى استيفاء شروط التسليم.',
      'آلية واضحة لفض النزاعات عند وجود مشكلة في الطلب.',
      'تعزيز الثقة للطرفين في كل عملية شراء.',
    ],
    pointsEn: [
      'Funds stay protected until delivery requirements are met.',
      'Clear dispute flow when an order problem happens.',
      'Higher checkout confidence for both merchant and customer.',
    ],
  },
  {
    slug: 'thawani-payments',
    titleAr: 'دفع محلي عبر ثواني',
    titleEn: 'Local Payments via Thawani',
    summaryAr: 'تجربة دفع مناسبة للسوق العماني بتكامل مباشر مع ثواني.',
    summaryEn: 'Local checkout experience built around direct Thawani integration.',
    pointsAr: [
      'إتمام الدفع بسهولة داخل تجربة شراء موحدة.',
      'ربط حالات الدفع تلقائياً مع حالة الطلب.',
      'جاهزية تشغيلية محلية للتجار في سلطنة عمان.',
    ],
    pointsEn: [
      'Smooth payment completion inside one checkout journey.',
      'Automatic payment-status sync with order status.',
      'Operational readiness for merchants in Oman.',
    ],
  },
  {
    slug: 'made-in-oman',
    titleAr: 'صُنع في عُمان',
    titleEn: 'Made in Oman',
    summaryAr: 'منصة مبنية للسوق العماني من حيث اللغة، السياق، وتجربة المستخدم.',
    summaryEn: 'Product and UX tailored to Oman market language, context, and operations.',
    pointsAr: [
      'تجربة عربية أولاً مع دعم الإنجليزية.',
      'تدفق أعمال مناسب للتاجر المحلي.',
      'هوية محلية تدعم نمو التجارة الإلكترونية في عمان.',
    ],
    pointsEn: [
      'Arabic-first user experience with complete English support.',
      'Workflows aligned with local merchant operations.',
      'Local-first product identity for Oman e-commerce growth.',
    ],
  },
];

export function getTrustBySlug(slug: string) {
  return TRUST_CATALOG.find((item) => item.slug === slug);
}

export function getTrustTitle(item: TrustCatalogItem, isEn = false) {
  return isEn ? item.titleEn : item.titleAr;
}

export function getTrustSummary(item: TrustCatalogItem, isEn = false) {
  return isEn ? item.summaryEn : item.summaryAr;
}

export function getTrustPoints(item: TrustCatalogItem, isEn = false) {
  return isEn ? item.pointsEn : item.pointsAr;
}
