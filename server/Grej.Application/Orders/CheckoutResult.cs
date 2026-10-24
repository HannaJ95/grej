namespace Grej.Application.Orders;

// What CreateCheckoutAsync returns: either the payment page to send the customer
// to, or the rows that stopped the checkout. Never both.
public record CheckoutResult(string? Url, IReadOnlyList<UnavailableItem> UnavailableItems)
{
    public static CheckoutResult Success(string url) => new(url, []);

    public static CheckoutResult Unavailable(IReadOnlyList<UnavailableItem> items) => new(null, items);
}

// A row that cannot be bought in the quantity asked for. Available is how many
// can be bought right now: 0 if the product is sold out, hidden or does not exist.
public record UnavailableItem(int ProductId, int Available);
