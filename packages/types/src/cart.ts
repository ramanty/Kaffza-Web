// ============================================
// Cart Types
// ============================================

export interface ICartItem {
  id: number;
  cartId: number;
  productId: number;
  variantId?: number;
  quantity: number;
}

export interface ICart {
  id: number;
  userId: number;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAddToCart {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface IUpdateCartQuantity {
  productId: string;
  variantId?: string;
  quantity: number;
}
