// ============================================
// Kaffza (قفزة) — Shared Validators
// Zod schemas shared between frontend and backend
// ============================================

import { z } from 'zod';

// ---- Phone Validation (Oman format: +968XXXXXXXX) ----
export const omanPhoneSchema = z
  .string()
  .regex(/^\+968[0-9]{8}$/, 'رقم الهاتف يجب أن يكون بصيغة عُمانية صحيحة (+968XXXXXXXX)');

// ---- Email Validation ----
export const emailSchema = z.string().email('البريد الإلكتروني غير صالح');

// ---- Password Validation ----
export const passwordSchema = z
  .string()
  .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
  .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير واحد على الأقل')
  .regex(/[a-z]/, 'يجب أن تحتوي على حرف صغير واحد على الأقل')
  .regex(/[0-9]/, 'يجب أن تحتوي على رقم واحد على الأقل');

// ---- OTP Validation ----
export const otpSchema = z
  .string()
  .length(6, 'رمز التحقق يجب أن يكون 6 أرقام')
  .regex(/^[0-9]+$/, 'رمز التحقق يجب أن يحتوي على أرقام فقط');

// ---- User Registration ----
export const registerSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100),
  email: emailSchema,
  phone: omanPhoneSchema,
  password: passwordSchema,
  role: z.enum(['merchant', 'customer']),
  locale: z.enum(['ar', 'en']).optional().default('ar'),
});

// ---- Login ----
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

// ---- Store Creation ----
export const createStoreSchema = z.object({
  nameAr: z.string().min(2, 'اسم المتجر بالعربية مطلوب').max(100),
  nameEn: z.string().min(2, 'اسم المتجر بالإنجليزية مطلوب').max(100),
  subdomain: z
    .string()
    .min(3, 'النطاق الفرعي يجب أن يكون 3 أحرف على الأقل')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'النطاق الفرعي يجب أن يحتوي على أحرف صغيرة وأرقام وشرطات فقط'),
  descriptionAr: z.string().max(500).optional(),
  descriptionEn: z.string().max(500).optional(),
  planId: z.number().int().positive(),
});

// ---- Product Creation ----
export const createProductSchema = z.object({
  categoryId: z.number().int().positive().optional(),
  nameAr: z.string().min(2).max(200),
  nameEn: z.string().min(2).max(200),
  descriptionAr: z.string().max(2000).optional(),
  descriptionEn: z.string().max(2000).optional(),
  price: z.number().positive('السعر يجب أن يكون أكبر من صفر'),
  compareAtPrice: z.number().positive().optional(),
  stock: z.number().int().min(0, 'المخزون لا يمكن أن يكون سالباً'),
  images: z.array(z.string().url()).max(10).optional(),
  sku: z.string().max(50).optional(),
  weightKg: z.number().positive().optional(),
});

// ---- Product Update ----
export const updateProductSchema = createProductSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ---- Category Creation ----
export const createCategorySchema = z.object({
  nameAr: z.string().min(2, 'اسم التصنيف بالعربية يجب أن يكون حرفين على الأقل').max(100),
  nameEn: z.string().min(2, 'Category name in English must be at least 2 characters').max(100),
  parentId: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

// ---- Category Update ----
export const updateCategorySchema = createCategorySchema.partial().extend({
  parentId: z.string().nullable().optional(),
});

// ---- Order Address ----
export const addressSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: omanPhoneSchema,
  addressLine1: z.string().min(5).max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  postalCode: z.string().max(10).optional(),
  country: z.string().default('OM'),
});

// ---- Create Order ----
export const createOrderSchema = z.object({
  storeId: z.number().int().positive(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        variantId: z.number().int().positive().optional(),
        quantity: z.number().int().positive('الكمية يجب أن تكون 1 على الأقل'),
      })
    )
    .min(1, 'يجب إضافة منتج واحد على الأقل'),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  customerNotes: z.string().max(500).optional(),
});

// ---- Withdrawal Request ----
export const createWithdrawalSchema = z.object({
  amount: z.number().min(10, 'الحد الأدنى للسحب هو 10 ر.ع'),
  bankName: z.string().min(2).max(100),
  accountNumber: z.string().min(5).max(30),
  iban: z.string().regex(/^OM[0-9]{2}[A-Z0-9]{23}$/, 'رقم IBAN يجب أن يكون بصيغة عُمانية صحيحة'),
});

// ---- Dispute Creation ----
export const createDisputeSchema = z.object({
  orderId: z.number().int().positive(),
  type: z.enum(['product_issue', 'not_received', 'wrong_item', 'other']),
  reason: z.string().min(10, 'سبب النزاع يجب أن يكون 10 أحرف على الأقل').max(1000),
  evidence: z.array(z.string().url()).max(5).optional(),
});

// ---- Add to Cart ----
export const addToCartSchema = z.object({
  productId: z.string().min(1, 'معرّف المنتج مطلوب'),
  variantId: z.string().optional(),
  quantity: z.number().int().positive('الكمية يجب أن تكون 1 على الأقل'),
});

// ---- Update Cart Quantity ----
export const updateCartSchema = z.object({
  productId: z.string().min(1, 'معرّف المنتج مطلوب'),
  variantId: z.string().optional(),
  quantity: z.number().int().positive('الكمية يجب أن تكون 1 على الأقل'),
});

// ---- Update Order Status ----
export const updateOrderStatusSchema = z.object({
  status: z.enum(
    ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    {
      errorMap: () => ({ message: 'حالة الطلب غير صالحة' }),
    }
  ),
});

// ---- Pagination ----
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().max(100).optional(),
});

// Export types inferred from schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartInput = z.infer<typeof updateCartSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CreateWithdrawalInput = z.infer<typeof createWithdrawalSchema>;
export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;

// DTO type aliases (for compatibility with NestJS naming conventions)
export type RegisterDTO = RegisterInput;
export type LoginDTO = LoginInput;
export type CreateProductDTO = CreateProductInput;
export type UpdateProductDTO = UpdateProductInput;
export type CreateCategoryDTO = CreateCategoryInput;
export type UpdateCategoryDTO = UpdateCategoryInput;
export type CreateOrderDTO = CreateOrderInput;
export type AddToCartDTO = AddToCartInput;
export type UpdateCartDTO = UpdateCartInput;
export type UpdateOrderStatusDTO = UpdateOrderStatusInput;
