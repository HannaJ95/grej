using System.ComponentModel.DataAnnotations;

namespace Grej.Application.Orders;

// What the browser sends to POST /api/checkout: only product ids and quantities.
// Prices are never sent, since they are always taken from the database (constraints.md).
public record CheckoutRequest(
    [Required, MinLength(1)] IReadOnlyList<CheckoutItemRequest> Items);

public record CheckoutItemRequest(
    int ProductId,
    [Range(1, 99)] int Quantity);
