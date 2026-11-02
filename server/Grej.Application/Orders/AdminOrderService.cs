using Grej.Application.Common;
using Grej.Domain.Orders;

namespace Grej.Application.Orders;

// Use cases for orders in the CMS. Only admin endpoints use it. Setting an order to
// Shipped or Cancelled is added in the next sprint item.
public class AdminOrderService(IOrderRepository orders)
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

    private static OrderSummaryDto ToSummaryDto(Order order) => new(
        order.Id,
        order.OrderNumber,
        order.CreatedAt,
        order.CustomerName,
        order.Total,
        order.Currency,
        order.Status.ToString(),
        PaymentStatusOf(order));

    private static OrderDetailsDto ToDetailsDto(Order order) => new(
        order.Id,
        order.OrderNumber,
        order.CreatedAt,
        order.Total,
        order.Currency,
        order.Status.ToString(),
        PaymentStatusOf(order),
        order.CustomerName,
        order.CustomerEmail,
        order.AddressLine1,
        order.AddressLine2,
        order.PostalCode,
        order.City,
        order.Country,
        order.Items
            .Select(item => new OrderItemDto(item.TitleAtPurchase, item.UnitPrice, item.Quantity, item.UnitPrice * item.Quantity))
            .ToList());

    // Every saved order has a payment, since CheckoutService adds it before the order is saved.
    // It is only null if a query forgot Include(o => o.Payment), and then this says so at once.
    private static string PaymentStatusOf(Order order) =>
        order.Payment?.Status.ToString()
            ?? throw new InvalidOperationException($"Order {order.Id} was read without its payment.");
}
