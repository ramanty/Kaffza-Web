// ============================================
// Dispute Types
// ============================================

export enum DisputeType {
  PRODUCT_ISSUE = 'product_issue',
  NOT_RECEIVED = 'not_received',
  WRONG_ITEM = 'wrong_item',
  OTHER = 'other',
}

export enum DisputeStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  RESOLVED_MERCHANT = 'resolved_merchant',
  RESOLVED_CUSTOMER = 'resolved_customer',
  CLOSED = 'closed',
}

export interface IDispute {
  id: number;
  orderId: number;
  raisedBy: number;
  assignedTo?: number;
  type: DisputeType;
  reason: string;
  resolution?: string;
  status: DisputeStatus;
  evidence?: string[];
  messages?: IDisputeMessage[];
  resolvedAt?: Date;
  createdAt: Date;
}

export interface IDisputeMessage {
  id: number;
  disputeId: number;
  senderId: number;
  message: string;
  attachments?: string[];
  createdAt: Date;
}

export interface ICreateDispute {
  orderId: number;
  type: DisputeType;
  reason: string;
  evidence?: string[];
}

export interface IResolveDispute {
  resolution: string;
  status: DisputeStatus.RESOLVED_MERCHANT | DisputeStatus.RESOLVED_CUSTOMER;
  refundAmount?: number; // For partial settlements
}
