// ============================================
// Order Types
// ============================================

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export interface IAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string; // Governorate in Oman
  postalCode?: string;
  country: string; // Default: OM
}

export interface IOrderItem {
  id: number;
  orderId: number;
  productId: number;
  variantId?: number;
  productName: string;
  quantity: number;
  unitPrice: number; // OMR
  totalPrice: number;
}

export interface IOrder {
  id: number;
  orderNumber: string; // KFZ-YYYYMMDD-XXXX
  storeId: number;
  customerId: number;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  commissionAmount: number;
  merchantAmount: number;
  shippingAddress: IAddress;
  billingAddress?: IAddress;
  customerNotes?: string;
  customerConfirmed: boolean;
  confirmedAt?: Date;
  items: IOrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateOrder {
  storeId: number;
  items: {
    productId: number;
    variantId?: number;
    quantity: number;
  }[];
  shippingAddress: IAddress;
  billingAddress?: IAddress;
  customerNotes?: string;
}
