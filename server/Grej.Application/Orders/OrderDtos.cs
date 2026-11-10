namespace Grej.Application.Orders;

// Statuses as text ("Paid"), so the frontend needs no enum numbers.
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
    // Null for unpaid and demo orders.
    string? PaymentDashboardUrl,
    // From Order's rules, so the CMS needs none of its own.
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

// All money is calculated in the API (architecture.md).
public record OrderItemDto(string Title, decimal UnitPrice, int Quantity, decimal LineTotal);
