// ============================================
// Kaffza (قفزة) — Mobile API Client
// ============================================

import axios from 'axios';
import type { IProduct } from '@kaffza/types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Mock data (fallback when API is unavailable) ────────────────────────────

export const MOCK_PRODUCTS: IProduct[] = [
  {
    id: 1,
    storeId: 1,
    nameAr: 'قهوة عربية فاخرة',
    nameEn: 'Premium Arabic Coffee',
    descriptionAr: 'قهوة عربية أصيلة محمصة بعناية فائقة',
    descriptionEn: 'Authentic Arabic coffee carefully roasted',
    price: 4.5,
    stock: 50,
    images: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    storeId: 1,
    nameAr: 'كافيه لاتيه',
    nameEn: 'Café Latte',
    descriptionAr: 'إسبريسو ناعم مع حليب مبخر كريمي',
    descriptionEn: 'Smooth espresso with creamy steamed milk',
    price: 3.0,
    stock: 30,
    images: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    storeId: 1,
    nameAr: 'كابوتشينو',
    nameEn: 'Cappuccino',
    descriptionAr: 'إسبريسو مع رغوة الحليب الناعمة',
    descriptionEn: 'Espresso topped with silky milk foam',
    price: 3.25,
    stock: 40,
    images: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 4,
    storeId: 1,
    nameAr: 'فلات وايت',
    nameEn: 'Flat White',
    descriptionAr: 'إسبريسو مزدوج مع حليب مبخر ناعم',
    descriptionEn: 'Double espresso with velvety steamed milk',
    price: 3.5,
    stock: 25,
    images: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 5,
    storeId: 1,
    nameAr: 'كيك الشوكولاتة',
    nameEn: 'Chocolate Cake',
    descriptionAr: 'كيك شوكولاتة بلجيكية داكنة',
    descriptionEn: 'Rich dark Belgian chocolate cake',
    price: 2.0,
    stock: 20,
    images: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 6,
    storeId: 1,
    nameAr: 'أمريكانو',
    nameEn: 'Americano',
    descriptionAr: 'إسبريسو مخفف بالماء الساخن',
    descriptionEn: 'Espresso diluted with hot water',
    price: 2.5,
    stock: 60,
    images: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// ── API helpers ─────────────────────────────────────────────────────────────

export async function fetchProducts(storeId?: number): Promise<IProduct[]> {
  const params = storeId ? { storeId } : {};
  const response = await apiClient.get<IProduct[]>('/products', { params });
  return response.data;
}
