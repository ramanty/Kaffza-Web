// ============================================
// Wallet & Transaction Types
// ============================================

export enum TransactionType {
  ESCROW_HOLD = 'escrow_hold',
  ESCROW_RELEASE = 'escrow_release',
  WITHDRAWAL = 'withdrawal',
  COMMISSION = 'commission',
  REFUND = 'refund',
}

export enum WithdrawalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

export interface IWallet {
  id: number;
  storeId: number;
  availableBalance: number; // OMR — الرصيد المتاح للسحب
  pendingBalance: number;   // OMR — الرصيد المعلق (Escrow)
  totalEarned: number;      // OMR — إجمالي الأرباح
  totalWithdrawn: number;   // OMR — إجمالي المسحوبات
  updatedAt: Date;
}

export interface IWalletTransaction {
  id: number;
  walletId: number;
  amount: number;
  type: TransactionType;
  description: string;
  referenceId?: number;
  referenceType?: string; // 'order' | 'payment' | 'withdrawal'
  balanceAfter: number;
  createdAt: Date;
}

/**
 * الحد الأدنى للسحب: 10 ر.ع
 * لا حد أقصى للمحفظة
 */
export const WALLET_MIN_WITHDRAWAL = 10; // OMR

export interface ICreateWithdrawal {
  amount: number;
  bankName: string;
  accountNumber: string;
  iban: string;
}

export interface IWithdrawal {
  id: number;
  walletId: number;
  amount: number;
  bankName: string;
  accountNumber: string;
  iban: string;
  status: WithdrawalStatus;
  adminNotes?: string;
  processedAt?: Date;
  createdAt: Date;
}
