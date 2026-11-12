using Grej.Application.Payments;
using Grej.Domain.Orders;
using Microsoft.Extensions.Configuration;
using Stripe;
using Stripe.Checkout;

namespace Grej.Infrastructure.Stripe;

// Stripe's hosted payment page, so no card data passes through the API.
public class StripePaymentProvider(StripeClient stripe, IConfiguration configuration) : IPaymentProvider
{
    internal const string ProviderName = "Stripe";

    public string Name => ProviderName;

    public async Task<CheckoutSession> CreateCheckoutSessionAsync(Order order, CancellationToken cancellationToken)
    {
        var frontendUrl = configuration["Frontend:Url"]
            ?? throw new InvalidOperationException("Frontend:Url is not configured.");

        // Always set by CheckoutService.
        var shippingCost = order.ShippingCost
            ?? throw new InvalidOperationException("The order has no shipping.");

        var options = new SessionCreateOptions
        {
            Mode = "payment",
            LineItems = order.Items.Select(item => new SessionLineItemOptions
            {
                Quantity = item.Quantity,
                PriceData = new SessionLineItemPriceDataOptions
                {
                    Currency = order.Currency.ToLowerInvariant(),
                    UnitAmount = ToMinorUnits(item.UnitPrice),
                    ProductData = new SessionLineItemPriceDataProductDataOptions
                    {
                        Name = item.TitleAtPurchase,
                    },
                },
            }).ToList(),
            // Swedish only (constraints.md). Checkout always collects the email and the name.
            ShippingAddressCollection = new SessionShippingAddressCollectionOptions
            {
                AllowedCountries = ["SE"],
            },
            // Our own cost, not a dashboard rate, so the API decides the shipping like the prices.
            ShippingOptions =
            [
                new SessionShippingOptionOptions
                {
                    ShippingRateData = new SessionShippingOptionShippingRateDataOptions
                    {
                        Type = "fixed_amount",
                        DisplayName = order.ShippingMethod,
                        FixedAmount = new SessionShippingOptionShippingRateDataFixedAmountOptions
                        {
                            Amount = ToMinorUnits(shippingCost),
                            Currency = order.Currency.ToLowerInvariant(),
                        },
                    },
                },
            ],
            // Stripe fills in {CHECKOUT_SESSION_ID}, which the success page fetches the order with.
            SuccessUrl = $"{frontendUrl}/kassa/tack?order={order.OrderNumber}&session={{CHECKOUT_SESSION_ID}}",
            CancelUrl = $"{frontendUrl}/",
            Metadata = new Dictionary<string, string> { ["orderNumber"] = order.OrderNumber },
            // The dashboard's payment list shows the PaymentIntent, not the session.
            PaymentIntentData = new SessionPaymentIntentDataOptions
            {
                Description = order.OrderNumber,
                Metadata = new Dictionary<string, string> { ["orderNumber"] = order.OrderNumber },
            },
        };

        var session = await stripe.V1.Checkout.Sessions.CreateAsync(options, cancellationToken: cancellationToken);
        return new CheckoutSession(session.Id, session.Url);
    }

    // Öre. Prices have at most two decimals, so nothing is lost.
    private static long ToMinorUnits(decimal amount) => (long)(amount * 100);
}
