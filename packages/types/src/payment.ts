// ============================================
// Payment & Escrow Types
// ============================================

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum EscrowStatus {
  HELD = 'held',
  RELEASED = 'released',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed',
}

export enum PaymentGateway {
  THAWANI = 'thawani',
}

export const CURRENCY = 'OMR' as const;

export interface IPayment {
  id: number;
  orderId: number;
  amount: number;
  currency: typeof CURRENCY;
  status: PaymentStatus;
  gateway: PaymentGateway;
  gatewaySessionId?: string;
  gatewayPaymentId?: string;
  escrowStatus: EscrowStatus;
  releaseAt?: Date;
  releasedAt?: Date;
  createdAt: Date;
}

export interface IThawaniCreateSession {
  clientReferenceId: string;
  products: {
    name: string;
    quantity: number;
    unitAmount: number; // In Baisas (1 OMR = 1000 Baisas)
  }[];
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface IThawaniSessionResponse {
  success: boolean;
  code: number;
  description: string;
  data: {
    sessionId: string;
    publishableKey: string;
    invoiceValue: string;
    customerId: string;
    url: string;
  };
}

/**
 * قواعد نظام الضمان (Escrow Rules)
 *
 * - تاجر جديد (أول 3 طلبات): 14 يوم من تأكيد الشحن
 * - تاجر عادي: 7 أيام من تأكيد الشحن
 * - تاجر موثوق (+50 طلب، تقييم 4.5+): 3 أيام من تأكيد الشحن
 * - تأكيد العميل للاستلام: تحرير فوري
 * - لا يمكن للعميل الاسترجاع بعد التأكيد (فقط عبر نزاع قبل التأكيد)
 */
export interface IEscrowConfig {
  newMerchantDays: number;       // 14
  standardDays: number;          // 7
  trustedDays: number;           // 3
  newMerchantOrderThreshold: number; // 3
  trustedOrderThreshold: number;     // 50
  trustedRatingThreshold: number;    // 4.5
}
