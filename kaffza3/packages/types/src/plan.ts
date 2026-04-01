// ============================================
// Plan & Subscription Types
// ============================================

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

/**
 * خطط الاشتراك في منصة قفزة
 *
 * | الخطة     | السعر الشهري | نسبة العمولة |
 * |-----------|-------------|-------------|
 * | البداية   | 5 ر.ع       | 2%          |
 * | النمو     | 25 ر.ع      | 1%          |
 * | المحترف   | 75 ر.ع      | 0.5%        |
 *
 * لا رسوم تسجيل
 */
export interface IPlan {
  id: number;
  name: string;      // البداية | النمو | المحترف
  nameEn: string;    // Starter | Growth | Pro
  priceMonthly: number; // OMR
  commissionRate: number; // 0.02 | 0.01 | 0.005
  features: string[];
  isActive: boolean;
}

export interface ISubscription {
  id: number;
  storeId: number;
  planId: number;
  status: SubscriptionStatus;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
}

export const PLANS_SEED: Omit<IPlan, 'id'>[] = [
  {
    name: 'البداية',
    nameEn: 'Starter',
    priceMonthly: 5,
    commissionRate: 0.02,
    features: [
      'متجر إلكتروني كامل',
      'حتى 100 منتج',
      'دعم فني أساسي',
      'تقارير أساسية',
    ],
    isActive: true,
  },
  {
    name: 'النمو',
    nameEn: 'Growth',
    priceMonthly: 8,
    commissionRate: 0.01,
    features: [
      'متجر إلكتروني كامل',
      'حتى 1000 منتج',
      'نطاق مخصص',
      'دعم فني متقدم',
      'تقارير متقدمة',
      'كوبونات وخصومات',
    ],
    isActive: true,
  },
  {
    name: 'المحترف',
    nameEn: 'Pro',
    priceMonthly: 35,
    commissionRate: 0.005,
    features: [
      'متجر إلكتروني كامل',
      'منتجات غير محدودة',
      'نطاق مخصص',
      'دعم فني VIP',
      'تقارير احترافية',
      'كوبونات وخصومات',
      'API مخصص',
      'أولوية في الدعم',
    ],
    isActive: true,
  },
];
