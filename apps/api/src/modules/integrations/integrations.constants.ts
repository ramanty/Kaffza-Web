export const INTEGRATION_EVENT_TYPES = [
  'order.created',
  'order.updated',
  'payment.status_changed',
  'product.created',
  'product.updated',
  'customer.created',
] as const;

export type IntegrationEventType = (typeof INTEGRATION_EVENT_TYPES)[number];

export const INTEGRATION_EVENT_DB_MAP: Record<IntegrationEventType, string> = {
  'order.created': 'order_created',
  'order.updated': 'order_updated',
  'payment.status_changed': 'payment_status_changed',
  'product.created': 'product_created',
  'product.updated': 'product_updated',
  'customer.created': 'customer_created',
};

export const INTEGRATION_EVENT_NAME_MAP: Record<string, IntegrationEventType> = {
  order_created: 'order.created',
  order_updated: 'order.updated',
  payment_status_changed: 'payment.status_changed',
  product_created: 'product.created',
  product_updated: 'product.updated',
  customer_created: 'customer.created',
};
