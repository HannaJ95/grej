using Grej.Application.Catalog;
using Grej.Application.Common;
using Grej.Domain.Orders;

namespace Grej.Application.Orders;

// Use cases for orders in the CMS. Only admin endpoints use it. What the admin may do
// with an order is decided by Order itself (CanBeShipped, CanBeCancelledByAdmin).
public class AdminOrderService(IOrderRepository orders, ProductService products)
{
    public async Task<PagedResult<OrderSummaryDto>> GetOrdersAsync(OrderListQuery query, CancellationToken cancellationToken)
    {
        var page = await orders.GetPageAsync(query.All, query.Page, query.PageSize, cancellationToken);

        return new PagedResult<OrderSummaryDto>(
            page.Items.Select(ToSummaryDto).ToList(),
            page.Page,
            page.PageSize,
            page.TotalCount);
    }

    // Null if no order has this id.
    public async Task<OrderDetailsDto?> GetOrderAsync(int id, CancellationToken cancellationToken)
    {
        var order = await orders.GetByIdAsync(id, cancellationToken);
        return order is null ? null : ToDetailsDto(order);
    }

    public async Task<ChangeOrderStatusResult> ShipAsync(int id, CancellationToken cancellationToken)
    {
        var order = await orders.GetByIdAsync(id, cancellationToken);
        if (order is null)
        {
            return ChangeOrderStatusResult.NotFound;
        }

        // Asked first, so a refused change becomes an answer (409) and not an exception.
        if (!order.CanBeShipped)
        {
            return ChangeOrderStatusResult.NotAllowed;
        }

        order.MarkAsShipped();
        await orders.SaveChangesAsync(cancellationToken);
        return ChangeOrderStatusResult.Changed;
    }

    public async Task<ChangeOrderStatusResult> CancelAsync(int id, CancellationToken cancellationToken)
    {
        var order = await orders.GetByIdAsync(id, cancellationToken);
        if (order is null)
        {
            return ChangeOrderStatusResult.NotFound;
        }

        // The same as in ShipAsync. A second cancel is refused too, so the stock is never
        // increased twice.
        if (!order.CanBeCancelledByAdmin)
        {
            return ChangeOrderStatusResult.NotAllowed;
        }

        order.CancelByAdmin();

        // The order was paid, so its stock decreased (OrderService.HandlePaidAsync). It will not
        // be shipped, so the products go back in stock; the refund never changes the stock
        // (constraints.md). Through ProductService, since the stock belongs to the Catalog module.
        var items = order.Items.Select(item => new ProductQuantity(item.ProductId, item.Quantity)).ToList();
        await products.IncreaseStockAsync(items, cancellationToken);

        // The order and the stock in one transaction. If a webhook changed the same product's
        // stock since it was read, nothing is saved and this throws (ProductConfiguration).
        await orders.SaveChangesAsync(cancellationToken);
        return ChangeOrderStatusResult.Changed;
    }

    private static OrderSummaryDto ToSummaryDto(Order order) => new(
        order.Id,
        order.OrderNumber,
        order.CreatedAt,
        order.CustomerName,
        order.Total,
        order.Currency,
        order.Status.ToString(),
        PaymentStatusOf(order),
        order.NeedsRefund,
        order.NeedsCancelling);

    private static OrderDetailsDto ToDetailsDto(Order order) => new(
        order.Id,
        order.OrderNumber,
        order.CreatedAt,
        order.Total,
        order.Currency,
        order.Status.ToString(),
        PaymentStatusOf(order),
        order.NeedsRefund,
        order.NeedsCancelling,
        order.CanBeShipped,
        order.CanBeCancelledByAdmin,
        order.CustomerName,
        order.CustomerEmail,
        order.AddressLine1,
        order.AddressLine2,
        order.PostalCode,
        order.City,
        order.Country,
        order.ShippingMethod,
        order.ShippingCost,
        order.Items
            .Select(item => new OrderItemDto(item.TitleAtPurchase, item.UnitPrice, item.Quantity, item.UnitPrice * item.Quantity))
            .ToList());

    // Every saved order has a payment, since CheckoutService adds it before the order is saved.
    // It is only null if a query forgot Include(o => o.Payment), and then this says so at once.
    private static string PaymentStatusOf(Order order) =>
        order.Payment?.Status.ToString()
            ?? throw new InvalidOperationException($"Order {order.Id} was read without its payment.");
}
