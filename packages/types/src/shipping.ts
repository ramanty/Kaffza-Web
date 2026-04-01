// ============================================
// Shipping Types (Jeena / جيناكم)
// ============================================

export enum ShipmentStatus {
  PENDING = 'pending',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  RETURNED = 'returned',
  FAILED = 'failed',
}

export interface IShipment {
  id: number;
  orderId: number;
  provider: string; // 'jeena'
  trackingNumber: string;
  awbNumber: string;
  status: ShipmentStatus;
  fromAddress: IShippingAddress;
  toAddress: IShippingAddress;
  weightKg: number;
  shippedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  governorate: string;
  postalCode?: string;
  country: string;
}

export interface ICreateShipment {
  orderId: number;
  fromAddress: IShippingAddress;
  toAddress: IShippingAddress;
  weightKg: number;
  description?: string;
}

/**
 * Jeena Mock API Response
 * سيتم استبدالها بالـ API الحقيقي لاحقاً
 */
export interface IJeenaCreateResponse {
  success: boolean;
  trackingNumber: string;
  awbNumber: string;
  estimatedDelivery: string;
  labelUrl: string;
}

export interface IJeenaTrackResponse {
  success: boolean;
  trackingNumber: string;
  status: ShipmentStatus;
  events: {
    status: string;
    location: string;
    timestamp: string;
    description: string;
  }[];
}
