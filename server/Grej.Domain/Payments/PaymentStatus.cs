namespace Grej.Domain.Payments;

// Whether the order is paid. Only the payment provider changes it, through
// the webhook (constraints.md).
public enum PaymentStatus
{
    Pending,
    Paid,
    Expired,
    Refunded,
}
