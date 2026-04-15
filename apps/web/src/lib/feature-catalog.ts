export type FeatureItem = {
  slug: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  detailsAr: string[];
  detailsEn: string[];
};

export const FEATURE_CATALOG: FeatureItem[] = [
  {
    slug: 'store-builder',
    titleAr: 'متجر كامل لكل تاجر',
    titleEn: 'Complete Store Builder',
    summaryAr: 'واجهة متجر جاهزة مع صفحات المنتجات والسلة والدفع.',
    summaryEn: 'Launch-ready storefront with product, cart, and checkout pages.',
    detailsAr: [
      'صفحات متجر جاهزة عبر رابط مخصص لكل تاجر.',
      'دعم عرض المنتجات والتصنيفات والصور والأسعار.',
      'رحلة شراء متكاملة من السلة حتى الدفع.',
    ],
    detailsEn: [
      'Ready storefront pages with a dedicated merchant URL.',
      'Product, category, image, and pricing presentation out of the box.',
      'Full purchase journey from cart to payment.',
    ],
  },
  {
    slug: 'payments',
    titleAr: 'دفع محلي عبر ثواني',
    titleEn: 'Local Payments via Thawani',
    summaryAr: 'تكامل محلي مع ثواني لتجربة دفع مناسبة للسوق العماني.',
    summaryEn: 'Native Thawani integration for Oman-focused checkout.',
    detailsAr: [
      'إنشاء جلسات الدفع من داخل رحلة الطلب.',
      'متابعة حالة الدفع وربطها بالطلب.',
      'تجربة دفع مناسبة للعملاء داخل السلطنة.',
    ],
    detailsEn: [
      'Payment session creation directly from order flow.',
      'Payment status tracking tied to order lifecycle.',
      'Checkout experience tuned for local Omani customers.',
    ],
  },
  {
    slug: 'escrow-protection',
    titleAr: 'حماية Escrow',
    titleEn: 'Escrow Protection',
    summaryAr: 'نظام حماية مالي يوازن الثقة بين التاجر والعميل.',
    summaryEn: 'Escrow lifecycle to protect both merchants and customers.',
    detailsAr: [
      'احتجاز المبالغ حتى استيفاء شروط التسليم.',
      'تحرير ذكي للمبالغ حسب مستوى الثقة.',
      'تقليل النزاعات وحماية الأطراف.',
    ],
    detailsEn: [
      'Funds are held until delivery requirements are met.',
      'Smart release logic based on merchant trust level.',
      'Lower dispute risk and stronger confidence for both parties.',
    ],
  },
  {
    slug: 'merchant-dashboard',
    titleAr: 'لوحة تاجر احترافية',
    titleEn: 'Professional Merchant Dashboard',
    summaryAr: 'إدارة المنتجات والطلبات والشحن والمحفظة من مكان واحد.',
    summaryEn: 'Manage products, orders, shipping, and wallet in one console.',
    detailsAr: [
      'إدارة الكتالوج والتصنيفات بسهولة.',
      'متابعة الطلبات وحالات الشحن بشكل مباشر.',
      'عرض الرصيد والسحوبات وسجل الحركات المالية.',
    ],
    detailsEn: [
      'Simple catalog and category management tools.',
      'Live order and shipping status visibility.',
      'Wallet balance, withdrawals, and transaction history.',
    ],
  },
  {
    slug: 'admin-control',
    titleAr: 'لوحة منصة للأدمن',
    titleEn: 'Admin Control Center',
    summaryAr: 'تحكم مركزي لإدارة الحسابات والمدفوعات والنزاعات.',
    summaryEn: 'Centralized platform controls for users, payments, and disputes.',
    detailsAr: [
      'إدارة التجار والعملاء من لوحة مركزية.',
      'مراجعة السحوبات وحالات المدفوعات.',
      'متابعة النزاعات واتخاذ القرارات الإدارية.',
    ],
    detailsEn: [
      'Manage merchants and customers from one control panel.',
      'Review withdrawals and payment operations.',
      'Handle dispute workflows with admin decisions.',
    ],
  },
  {
    slug: 'bilingual-rtl',
    titleAr: 'دعم عربي/إنجليزي',
    titleEn: 'Arabic/English with RTL',
    summaryAr: 'واجهة ثنائية اللغة مع دعم اتجاه الكتابة العربي RTL.',
    summaryEn: 'Bilingual UX with proper RTL support for Arabic.',
    detailsAr: [
      'تجربة عربية افتراضية مناسبة للسوق المحلي.',
      'إمكانية التحويل بين العربية والإنجليزية.',
      'تنسيق RTL/LTR متوافق مع المحتوى التجاري.',
    ],
    detailsEn: [
      'Arabic-first experience for local users.',
      'Quick language switching between Arabic and English.',
      'RTL/LTR layouts aligned with e-commerce workflows.',
    ],
  },
];

export function getFeatureBySlug(slug: string) {
  return FEATURE_CATALOG.find((item) => item.slug === slug);
}
