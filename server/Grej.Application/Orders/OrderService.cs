using Grej.Application.Catalog;

namespace Grej.Application.Orders;

// Use cases for orders after the checkout. More are added when the webhook
// and the CMS handle orders.
public class OrderService(IOrderRepository orders, ProductService products)
{
    // Called by the webhook the first time the order's payment becomes Paid.
    // Nothing is saved here; the webhook saves everything in one transaction.
    public async Task HandlePaidAsync(int orderId, CancellationToken cancellationToken)
    {
        // A payment is only saved together with its order, so the order always exists.
        var order = await orders.GetByIdAsync(orderId, cancellationToken)
            ?? throw new InvalidOperationException($"Order {orderId} does not exist.");

        // The stock decreases when the order is paid, never when a product is
        // added to the cart (constraints.md).
        var items = order.Items.Select(item => new ProductQuantity(item.ProductId, item.Quantity)).ToList();
        await products.DecreaseStockAsync(items, cancellationToken);
    }
}
