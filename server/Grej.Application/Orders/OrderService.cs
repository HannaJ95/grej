using Grej.Application.Catalog;
using Grej.Domain.Orders;

namespace Grej.Application.Orders;

// Use cases for orders after the checkout. More are added when the webhook
// and the CMS handle orders.
public class OrderService(IOrderRepository orders, ProductService products)
{
    // Called by the webhook the first time the order's payment becomes Paid.
    // Nothing is saved here; the webhook saves everything in one transaction.
    public async Task HandlePaidAsync(int orderId, CustomerDetails? customer, CancellationToken cancellationToken)
    {
        // A payment is only saved together with its order, so the order always exists.
        var order = await orders.GetByIdAsync(orderId, cancellationToken)
            ?? throw new InvalidOperationException($"Order {orderId} does not exist.");

        // Null for sessions created before Checkout asked for a shipping address.
        if (customer is not null)
        {
            order.SetCustomerDetails(customer);
        }

        // The stock decreases when the order is paid, never when a product is
        // added to the cart (constraints.md).
        var items = order.Items.Select(item => new ProductQuantity(item.ProductId, item.Quantity)).ToList();
        await products.DecreaseStockAsync(items, cancellationToken);
    }

    // Called by the webhook the first time the order's payment becomes Expired.
    // Like HandlePaidAsync, nothing is saved here.
    public async Task HandleExpiredAsync(int orderId, CancellationToken cancellationToken)
    {
        var order = await orders.GetByIdAsync(orderId, cancellationToken)
            ?? throw new InvalidOperationException($"Order {orderId} does not exist.");

        // The customer never paid, so the order will never be shipped (constraints.md).
        // The stock is not touched: it only decreases when an order is paid.
        order.Cancel();
    }
}
