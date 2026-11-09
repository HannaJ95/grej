namespace Grej.Application.Orders;

// One row in the CMS's order list. The statuses are sent as text ("Paid"), since the API
// would otherwise send the enums as numbers, which the frontend would have to know.
public record OrderSummaryDto(
    int Id,
    string OrderNumber,
    DateTime CreatedAt,
    // Null until the order is paid, since Stripe Checkout collects it (Order.SetCustomerDetails).
    string? CustomerName,
    decimal Total,
    string Currency,
    string Status,
    string PaymentStatus,
    // Cancelled but still paid, shown as "needs refund" (Order.NeedsRefund).
    bool NeedsRefund,
    // Refunded but not cancelled, shown as "needs cancelling" (Order.NeedsCancelling).
    bool NeedsCancelling);

// One order with everything the admin needs to pack and send it.
public record OrderDetailsDto(
    int Id,
    string OrderNumber,
    DateTime CreatedAt,
    decimal Total,
    string Currency,
    string Status,
    string PaymentStatus,
    // Order's own answers to its rules, so the CMS shows the right buttons without
    // knowing the rules itself.
    bool NeedsRefund,
    bool NeedsCancelling,
    bool CanBeShipped,
    bool CanBeCancelled,
    // All null until the order is paid, like CustomerName above.
    string? CustomerName,
    string? CustomerEmail,
    string? AddressLine1,
    string? AddressLine2,
    string? PostalCode,
    string? City,
    string? Country,
    // Null on orders from before shipping was built. Total includes the cost.
    string? ShippingMethod,
    decimal? ShippingCost,
    IReadOnlyList<OrderItemDto> Items);

// One row on the order, with the title and price from the time of purchase. LineTotal is
// calculated here, so all money is calculated in the API (architecture.md).
public record OrderItemDto(string Title, decimal UnitPrice, int Quantity, decimal LineTotal);
