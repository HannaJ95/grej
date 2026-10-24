using Grej.Application.Catalog;
using Grej.Application.Payments;
using Grej.Domain.Orders;

namespace Grej.Application.Orders;

// The checkout use case: creates an order with prices from the database and
// returns the payment page that the customer is sent to.
public class CheckoutService(ProductService products, IOrderRepository orders, IPaymentProvider paymentProvider)
{
    // If any row cannot be bought, nothing is created and all such rows are
    // returned, so the customer can fix the whole cart at once.
    public async Task<CheckoutResult> CreateCheckoutAsync(CheckoutRequest request, CancellationToken cancellationToken)
    {
        // One database query for the whole cart, through Catalog's application
        // service, not its repository (architecture.md).
        var ids = request.Items.Select(item => item.ProductId).ToList();
        var found = await products.GetProductsByIdsAsync(ids, cancellationToken);
        var productsById = found.ToDictionary(product => product.Id);

        var order = new Order();
        var unavailable = new List<UnavailableItem>();

        foreach (var item in request.Items)
        {
            // Not in the dictionary = the product does not exist or is hidden.
            if (!productsById.TryGetValue(item.ProductId, out var product))
            {
                unavailable.Add(new UnavailableItem(item.ProductId, 0));
            }
            // The stock may have changed while the product was in the cart, so it is
            // checked again here (constraints.md). A sold-out product has stock 0.
            else if (item.Quantity > product.Stock)
            {
                unavailable.Add(new UnavailableItem(item.ProductId, product.Stock));
            }
            else
            {
                // The price comes from the database, never from the browser (constraints.md).
                order.AddItem(product.Id, product.Title, product.Price, item.Quantity);
            }
        }

        if (unavailable.Count > 0)
        {
            return CheckoutResult.Unavailable(unavailable);
        }

        // The order only exists in memory until the provider has created the session,
        // so a failed call to Stripe never leaves an order without a payment.
        var session = await paymentProvider.CreateCheckoutSessionAsync(order, cancellationToken);
        order.AddPayment(paymentProvider.Name, session.Reference);

        // Saves the order, its rows and its payment in one transaction.
        await orders.AddAsync(order, cancellationToken);

        return CheckoutResult.Success(session.Url);
    }
}
