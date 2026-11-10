using Grej.Application.Payments;
using Grej.Domain.Orders;
using Microsoft.Extensions.Configuration;
using Stripe;
using Stripe.Checkout;

namespace Grej.Infrastructure.Stripe;

// Creates Stripe Checkout sessions, Stripe's hosted payment page,
// so no card data ever passes through our API (architecture.md).
public class StripePaymentProvider(StripeClient stripe, IConfiguration configuration) : IPaymentProvider
{
    // Also read by StripeDashboard, so both agree on which payments are Stripe's.
    internal const string ProviderName = "Stripe";

    public string Name => ProviderName;

    public async Task<CheckoutSession> CreateCheckoutSessionAsync(Order order, CancellationToken cancellationToken)
    {
        // Where Stripe sends the customer afterwards: localhost locally, Vercel in production.
        var frontendUrl = configuration["Frontend:Url"]
            ?? throw new InvalidOperationException("Frontend:Url is not configured.");

        // CheckoutService always sets it, and the payment's amount already includes it.
        var shippingCost = order.ShippingCost
            ?? throw new InvalidOperationException("The order has no shipping.");

        var options = new SessionCreateOptions
        {
            Mode = "payment",
            // One line per order row, with the price we took from the database.
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
            // Checkout asks for a shipping address and only accepts Swedish ones (constraints.md).
            // The email is always asked for, and the name is part of the shipping address.
            ShippingAddressCollection = new SessionShippingAddressCollectionOptions
            {
                AllowedCountries = ["SE"],
            },
            // Our own cost as the only choice, instead of a rate saved in the Stripe dashboard,
            // so the API decides the shipping the same way as the prices. Shown as its own row.
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
            SuccessUrl = $"{frontendUrl}/kassa/tack?order={order.OrderNumber}",
            CancelUrl = $"{frontendUrl}/",
            Metadata = new Dictionary<string, string> { ["orderNumber"] = order.OrderNumber },
            // The dashboard's payment list shows the PaymentIntent, not the session, so the
            // order number goes there too, as the description shown in the list.
            PaymentIntentData = new SessionPaymentIntentDataOptions
            {
                Description = order.OrderNumber,
                Metadata = new Dictionary<string, string> { ["orderNumber"] = order.OrderNumber },
            },
        };

        var session = await stripe.V1.Checkout.Sessions.CreateAsync(options, cancellationToken: cancellationToken);
        return new CheckoutSession(session.Id, session.Url);
    }

    // Stripe wants amounts as whole numbers in the smallest unit: 450.00 kr is 45000 öre.
    // Prices have at most two decimals (numeric(10,2)), so nothing is lost.
    private static long ToMinorUnits(decimal amount) => (long)(amount * 100);
}
