// The statuses as the API sends them, as text (OrderStatus and PaymentStatus in the API).
export type OrderStatus = 'Pending' | 'Shipped' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Paid' | 'Expired' | 'Refunded';

// One row in the CMS's order list (OrderSummaryDto in the API).
export interface OrderSummary {
  id: number;
  orderNumber: string;
  // In UTC, e.g. "2026-11-02T16:43:54Z". The date pipe shows it in the browser's time zone.
  createdAt: string;
  // Null until the order is paid, since Stripe Checkout collects it.
  customerName: string | null;
  total: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  // Cancelled but still paid, so the admin must refund it in Stripe.
  needsRefund: boolean;
}

// One order with its customer and rows (OrderDetailsDto in the API).
export interface OrderDetails extends OrderSummary {
  // The API's answers to the order's rules, so the CMS needs no rules of its own.
  canBeShipped: boolean;
  canBeCancelled: boolean;
  // All null until the order is paid, like customerName.
  customerEmail: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  items: OrderItem[];
}

// One row on an order, with the title and price from the time of purchase (OrderItemDto
// in the API). lineTotal is calculated by the API.
export interface OrderItem {
  title: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}
