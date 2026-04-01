// ============================================
// Store Types
// ============================================

export enum TrustLevel {
  NEW = 'new',
  STANDARD = 'standard',
  TRUSTED = 'trusted',
}

export interface IStore {
  id: number;
  ownerId: number;
  planId: number;
  nameAr: string;
  nameEn: string;
  subdomain: string;
  customDomain?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  logoUrl?: string;
  bannerUrl?: string;
  isActive: boolean;
  totalOrders: number;
  avgRating: number;
  trustLevel: TrustLevel;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateStore {
  nameAr: string;
  nameEn: string;
  subdomain: string;
  descriptionAr?: string;
  descriptionEn?: string;
  planId: number;
}

export interface IUpdateStore {
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  logoUrl?: string;
  bannerUrl?: string;
  customDomain?: string;
}
