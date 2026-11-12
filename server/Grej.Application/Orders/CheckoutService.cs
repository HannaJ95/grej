using Grej.Application.Catalog;
using Grej.Application.Payments;
using Grej.Domain.Orders;

namespace Grej.Application.Orders;

public class CheckoutService(ProductService products, IOrderRepository orders, IPaymentProvider paymentProvider)
{
    // Nothing is created if a row cannot be bought, and every such row is returned,
    // so the customer can fix the whole cart at once.
    public async Task<CheckoutResult> CreateCheckoutAsync(CheckoutRequest request, CancellationToken cancellationToken)
    {
        // Through Catalog's service, not its repository (architecture.md).
        var ids = request.Items.Select(item => item.ProductId).ToList();
        var found = await products.GetProductsByIdsAsync(ids, cancellationToken);
        var productsById = found.ToDictionary(product => product.Id);

        var order = new Order();
        var unavailable = new List<UnavailableItem>();
        var parcels = new List<ShippingItem>();

        foreach (var item in request.Items)
        {
            // Missing = does not exist or is hidden.
            if (!productsById.TryGetValue(item.ProductId, out var product))
            {
                unavailable.Add(new UnavailableItem(item.ProductId, 0));
            }
            // Checked again, since the stock may have changed while in the cart (constraints.md).
            else if (item.Quantity > product.Stock)
            {
                unavailable.Add(new UnavailableItem(item.ProductId, product.Stock));
            }
            else
            {
                // From the database, never from the browser (constraints.md).
                order.AddItem(product.Id, product.Title, product.Price, item.Quantity);
                var parcel = product.Parcel;
                parcels.Add(new ShippingItem(parcel.WeightGrams, parcel.LengthCm, parcel.WidthCm, parcel.HeightCm, item.Quantity));
            }
        }

        if (unavailable.Count > 0)
        {
            return CheckoutResult.Unavailable(unavailable);
        }

        // From the database too. The cart's amount is only shown.
        order.SetShipping(Shipping.Method, Shipping.CostFor(parcels));

        // Saved only after Stripe has answered, so a failed call never leaves an order without a payment.
        var session = await paymentProvider.CreateCheckoutSessionAsync(order, cancellationToken);
        order.AddPayment(paymentProvider.Name, session.Reference);

        await orders.AddAsync(order, cancellationToken);

        return CheckoutResult.Success(session.Url);
    }

    // Only reads, since the webhook decides what is paid (constraints.md).
    public async Task<OrderConfirmationDto?> GetOrderAsync(string sessionId, CancellationToken cancellationToken)
    {
        var order = await orders.GetByPaymentReferenceAsync(sessionId, cancellationToken);
        if (order is null)
        {
            return null;
        }

        return new OrderConfirmationDto(
            order.OrderNumber,
            // Found by its payment, so the payment is always there.
            order.Payment!.Status.ToString(),
            order.CustomerName,
            order.CustomerEmail,
            order.AddressLine1,
            order.AddressLine2,
            order.PostalCode,
            order.City,
            order.ShippingMethod,
            order.ShippingCost,
            order.Total,
            order.Currency,
            order.Items.Select(OrderItemDto.From).ToList());
    }
}
