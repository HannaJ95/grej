using Grej.Application.Catalog;
using Grej.Application.Payments;
using Grej.Domain.Orders;

namespace Grej.Application.Orders;

// The checkout use case: creates an order with prices from the database and
// returns the payment page that the customer is sent to.
public class CheckoutService(ProductService products, IOrderRepository orders, IPaymentProvider paymentProvider)
{
    // Returns null if a product does not exist, is hidden or is sold out.
    public async Task<string?> CreateCheckoutAsync(CheckoutRequest request, CancellationToken cancellationToken)
    {
        var order = new Order();

        foreach (var item in request.Items)
        {
            // Through Catalog's application service, not its repository (architecture.md).
            var product = await products.GetProductAsync(item.ProductId, cancellationToken);
            if (product is null || product.IsSoldOut)
            {
                return null;
            }

            // The price comes from the database, never from the browser (constraints.md).
            order.AddItem(product.Id, product.Title, product.Price, item.Quantity);
        }

        // The order only exists in memory until the provider has created the session,
        // so a failed call to Stripe never leaves an order without a payment.
        var session = await paymentProvider.CreateCheckoutSessionAsync(order, cancellationToken);
        order.AddPayment(paymentProvider.Name, session.Reference);

        // Saves the order, its rows and its payment in one transaction.
        await orders.AddAsync(order, cancellationToken);

        return session.Url;
    }
}
