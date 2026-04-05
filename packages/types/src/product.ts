// ============================================
// Product Types
// ============================================

export interface IProduct {
  id: number;
  storeId: number;
  categoryId?: number;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  price: number; // OMR
  compareAtPrice?: number;
  stock: number;
  images: string[];
  sku?: string;
  weightKg?: number;
  isActive: boolean;
  variants?: IProductVariant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductVariant {
  id: number;
  productId: number;
  nameAr: string;
  nameEn: string;
  price: number;
  stock: number;
  sku?: string;
}

export interface ICategory {
  id: number;
  storeId: number;
  parentId?: number;
  nameAr: string;
  nameEn: string;
  slug: string;
  sortOrder: number;
  children?: ICategory[];
}

export interface ICreateProduct {
  categoryId?: number;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  images?: string[];
  sku?: string;
  weightKg?: number;
}

export interface IUpdateProduct extends Partial<ICreateProduct> {
  isActive?: boolean;
}

export interface ICreateCategory {
  nameAr: string;
  nameEn: string;
  parentId?: string;
  sortOrder?: number;
}

export interface IUpdateCategory extends Partial<ICreateCategory> {
  parentId?: string | null;
}
