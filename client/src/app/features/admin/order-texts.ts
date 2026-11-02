import { OrderStatus, PaymentStatus } from '../../core/order';

// The Swedish words for the statuses, which the API sends in English. Record makes
// TypeScript complain if a status is added in core/order.ts without a word here.
export const ORDER_STATUS_TEXTS: Record<OrderStatus, string> = {
  Pending: 'Ej skickad',
  Shipped: 'Skickad',
  Cancelled: 'Avbruten',
};

export const PAYMENT_STATUS_TEXTS: Record<PaymentStatus, string> = {
  Pending: 'Väntar på betalning',
  Paid: 'Betald',
  Expired: 'Utgången',
  Refunded: 'Återbetald',
};
