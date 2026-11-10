// As text, the way the API sends them.
export type OrderStatus = 'Pending' | 'Shipped' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Paid' | 'Expired' | 'Refunded';

// OrderSummaryDto in the API.
export interface OrderSummary {
  id: number;
  orderNumber: string;
  // In UTC. The date pipe shows it in the browser's time zone.
  createdAt: string;
  // Null until the order is paid.
  customerName: string | null;
  total: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  needsRefund: boolean;
  needsCancelling: boolean;
  // Paid after another customer had bought the last item, and not shipped or cancelled yet.
  needsAttention: boolean;
}

// OrderDetailsDto in the API.
export interface OrderDetails extends OrderSummary {
  // The API's answers to the order's rules, so the CMS needs no rules of its own.
  canBeShipped: boolean;
  canBeCancelled: boolean;
  // Null until the order is paid.
  customerEmail: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  // Null on orders from before shipping was built. total includes the cost.
  shippingMethod: string | null;
  shippingCost: number | null;
  items: OrderItem[];
}

// OrderItemDto in the API. The title and price are from the time of purchase.
export interface OrderItem {
  title: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}
