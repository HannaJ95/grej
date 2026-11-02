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
    string PaymentStatus);

// One order with everything the admin needs to pack and send it.
public record OrderDetailsDto(
    int Id,
    string OrderNumber,
    DateTime CreatedAt,
    decimal Total,
    string Currency,
    string Status,
    string PaymentStatus,
    // All null until the order is paid, like CustomerName above.
    string? CustomerName,
    string? CustomerEmail,
    string? AddressLine1,
    string? AddressLine2,
    string? PostalCode,
    string? City,
    string? Country,
    IReadOnlyList<OrderItemDto> Items);

// One row on the order, with the title and price from the time of purchase. LineTotal is
// calculated here, so all money is calculated in the API (architecture.md).
public record OrderItemDto(string Title, decimal UnitPrice, int Quantity, decimal LineTotal);
