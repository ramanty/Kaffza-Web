// ============================================
// Common / Shared Types
// ============================================

export interface IPaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface IPaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export enum NotificationType {
  ORDER = 'order',
  PAYMENT = 'payment',
  DISPUTE = 'dispute',
  SYSTEM = 'system',
}

export interface INotification {
  id: number;
  userId: number;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  type: NotificationType;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: Date;
}

export interface IReview {
  id: number;
  orderId: number;
  storeId: number;
  customerId: number;
  productId: number;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
}

/**
 * Oman Governorates — محافظات سلطنة عُمان
 */
export const OMAN_GOVERNORATES = [
  { nameAr: 'مسقط', nameEn: 'Muscat' },
  { nameAr: 'ظفار', nameEn: 'Dhofar' },
  { nameAr: 'مسندم', nameEn: 'Musandam' },
  { nameAr: 'البريمي', nameEn: 'Al Buraimi' },
  { nameAr: 'الداخلية', nameEn: 'Ad Dakhiliyah' },
  { nameAr: 'شمال الباطنة', nameEn: 'Al Batinah North' },
  { nameAr: 'جنوب الباطنة', nameEn: 'Al Batinah South' },
  { nameAr: 'شمال الشرقية', nameEn: 'Ash Sharqiyah North' },
  { nameAr: 'جنوب الشرقية', nameEn: 'Ash Sharqiyah South' },
  { nameAr: 'الظاهرة', nameEn: 'Ad Dhahirah' },
  { nameAr: 'الوسطى', nameEn: 'Al Wusta' },
] as const;
