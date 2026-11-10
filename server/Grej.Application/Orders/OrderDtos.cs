namespace Grej.Application.Orders;

// The statuses are sent as text ("Paid"), so the frontend does not need to know the enums' numbers.
public record OrderSummaryDto(
    int Id,
    string OrderNumber,
    DateTime CreatedAt,
    // Null until the order is paid.
    string? CustomerName,
    decimal Total,
    string Currency,
    string Status,
    string PaymentStatus,
    bool NeedsRefund,
    bool NeedsCancelling,
    bool NeedsAttention);

public record OrderDetailsDto(
    int Id,
    string OrderNumber,
    DateTime CreatedAt,
    decimal Total,
    string Currency,
    string Status,
    string PaymentStatus,
    // Null when the payment has no page at its provider (IPaymentDashboard).
    string? PaymentDashboardUrl,
    // Order's own answers to its rules, so the CMS shows the right buttons without
    // knowing the rules itself.
    bool NeedsRefund,
    bool NeedsCancelling,
    bool NeedsAttention,
    bool CanBeShipped,
    bool CanBeCancelled,
    // Null until the order is paid.
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

// LineTotal is calculated here, so all money is calculated in the API (architecture.md).
public record OrderItemDto(string Title, decimal UnitPrice, int Quantity, decimal LineTotal);
