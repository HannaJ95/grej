namespace Grej.Application.Orders;

// How AdminOrderService.ShipAsync and CancelAsync ended.
public enum ChangeOrderStatusResult
{
    Changed,
    NotFound,
    // The order's status or payment does not allow it, e.g. shipping an unpaid order.
    NotAllowed,
}
