namespace Grej.Domain.Orders;

// Where the order is in handling. Only the admin changes it, except that the
// order is cancelled automatically when its payment expires (constraints.md).
public enum OrderStatus
{
    Pending,
    Shipped,
    Cancelled,
}
