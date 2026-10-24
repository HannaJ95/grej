using System.ComponentModel.DataAnnotations;

namespace Grej.Application.Orders;

// What the browser sends to POST /api/checkout: only product ids and quantities.
// Prices are never sent, since they are always taken from the database (constraints.md).
public record CheckoutRequest(
    // Stripe Checkout accepts at most 100 rows in one payment.
    [Required, MinLength(1), MaxLength(100)] IReadOnlyList<CheckoutItemRequest> Items) : IValidatableObject
{
    // Rules that need the whole list. ASP.NET Core only runs this when the
    // attributes above have passed, so Items is never null here.
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        // The JSON can still contain empty rows, e.g. {"items": [null]}.
        if (Items.Any(item => item is null))
        {
            yield return new ValidationResult("Rows cannot be null.", [nameof(Items)]);
            yield break;
        }

        // The cart has one row per product. Two rows for the same product could
        // together ask for more than the stock, so they are rejected.
        var productIds = Items.Select(item => item.ProductId).ToList();
        if (productIds.Distinct().Count() != productIds.Count)
        {
            yield return new ValidationResult("Each product can only appear once.", [nameof(Items)]);
        }
    }
}

public record CheckoutItemRequest(
    int ProductId,
    [Range(1, 99)] int Quantity);
