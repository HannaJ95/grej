using Grej.Application.Catalog;
using Grej.Application.Common;
using Grej.Domain.Orders;

namespace Grej.Application.Orders;

public class OrderService(IOrderRepository orders, ProductService products, IEmailSender email)
{
    // The first time the payment becomes Paid. The webhook saves everything in one transaction.
    public async Task<Order> HandlePaidAsync(int orderId, CustomerDetails? customer, CancellationToken cancellationToken)
    {
        // A payment is always saved with its order.
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

        return order;
    }

    // Only after the webhook has saved, so no email goes out for a payment that was not saved.
    public Task SendConfirmationAsync(Order order, CancellationToken cancellationToken) =>
        order.CustomerEmail is null
            ? Task.CompletedTask
            : email.SendAsync(OrderConfirmationEmail.Create(order), cancellationToken);

    // Like HandlePaidAsync, the first time the payment becomes Expired.
    public async Task HandleExpiredAsync(int orderId, CancellationToken cancellationToken)
    {
        var order = await orders.GetByIdAsync(orderId, cancellationToken)
            ?? throw new InvalidOperationException($"Order {orderId} does not exist.");

        // No stock change, since the stock only decreases when an order is paid.
        order.Cancel();
    }

    // A product on an order is never hard deleted (constraints.md).
    public Task<bool> IsProductOrderedAsync(int productId, CancellationToken cancellationToken) =>
        orders.ContainsProductAsync(productId, cancellationToken);
}
