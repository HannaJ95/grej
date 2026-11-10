using Grej.Application.Catalog;
using Grej.Domain.Orders;

namespace Grej.Application.Orders;

public class OrderService(IOrderRepository orders, ProductService products)
{
    // The first time the payment becomes Paid. Nothing is saved here, since the webhook saves
    // the payment, the order and the stock in one transaction.
    public async Task HandlePaidAsync(int orderId, CustomerDetails? customer, CancellationToken cancellationToken)
    {
        // A payment is only saved together with its order.
        var order = await orders.GetByIdAsync(orderId, cancellationToken)
            ?? throw new InvalidOperationException($"Order {orderId} does not exist.");

        // Null for sessions created before Checkout asked for a shipping address.
        if (customer is not null)
        {
            order.SetCustomerDetails(customer);
        }

        var items = order.Items.Select(item => new ProductQuantity(item.ProductId, item.Quantity)).ToList();
        if (await products.DecreaseStockAsync(items, cancellationToken))
        {
            order.MarkAsOversold();
        }
    }

    // Like HandlePaidAsync, the first time the payment becomes Expired.
    public async Task HandleExpiredAsync(int orderId, CancellationToken cancellationToken)
    {
        var order = await orders.GetByIdAsync(orderId, cancellationToken)
            ?? throw new InvalidOperationException($"Order {orderId} does not exist.");

        // The stock is not touched, since it only decreases when an order is paid.
        order.Cancel();
    }

    // A product on an order is never hard deleted (constraints.md).
    public Task<bool> IsProductOrderedAsync(int productId, CancellationToken cancellationToken) =>
        orders.ContainsProductAsync(productId, cancellationToken);
}
