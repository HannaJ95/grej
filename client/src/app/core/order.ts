// As text, the way the API sends them.
export type OrderStatus = 'Pending' | 'Shipped' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Paid' | 'Expired' | 'Refunded';

// OrderSummaryDto in the API.
export interface OrderSummary {
  id: number;
  orderNumber: string;
  // UTC; the date pipe shows it in the browser's time zone.
  createdAt: string;
  // Null until the order is paid.
  customerName: string | null;
  total: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  needsRefund: boolean;
  needsCancelling: boolean;
  // Sold twice, and not shipped or cancelled yet.
  needsAttention: boolean;
}

// OrderDetailsDto in the API.
export interface OrderDetails extends OrderSummary {
  // Null for unpaid and demo orders.
  paymentDashboardUrl: string | null;
  // From the order's rules in the API, so the CMS needs none of its own.
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

// OrderConfirmationDto in the API, for the success page.
export interface OrderConfirmation {
  orderNumber: string;
  paymentStatus: PaymentStatus;
  // Null until the order is paid.
  customerName: string | null;
  customerEmail: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  city: string | null;
  shippingMethod: string | null;
  shippingCost: number | null;
  total: number;
  currency: string;
  items: OrderItem[];
}

// OrderItemDto in the API. The title and price are from the time of purchase.
export interface OrderItem {
  title: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}
