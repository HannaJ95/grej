using Grej.Application.Payments;
using Grej.Domain.Orders;
using Grej.Domain.Payments;
using Microsoft.Extensions.Configuration;
using Stripe;
using Stripe.Checkout;

namespace Grej.Infrastructure.Stripe;

// Checks and reads webhooks from Stripe. Only this class knows what Stripe's
// events look like; the rest of the API only sees PaymentUpdate.
public class StripeWebhookReader(IConfiguration configuration) : IPaymentWebhookReader
{
    public bool IsValid(string payload, string signature)
    {
        // "Stripe:WebhookSecret" (whsec_…) comes from User Secrets locally (printed by `stripe listen`)
        // and Stripe__WebhookSecret in hosting (from the webhook endpoint in the Stripe dashboard).
        var secret = configuration["Stripe:WebhookSecret"]
            ?? throw new InvalidOperationException("Stripe:WebhookSecret is not configured.");

        try
        {
            // Stripe signs the body with the secret. This throws if the body has been changed,
            // was signed with another secret, or is more than 5 minutes old.
            EventUtility.ValidateSignature(payload, signature, secret);
            return true;
        }
        catch (StripeException)
        {
            return false;
        }
    }

    public PaymentUpdate? Read(string payload)
    {
        var stripeEvent = EventUtility.ConstructEventWithoutVerification(payload);

        // Sent when the customer has finished Stripe Checkout.
        if (stripeEvent.Type != EventTypes.CheckoutSessionCompleted)
        {
            return null;
        }

        // With cards the money is taken at once, but some payment methods pay later,
        // so Stripe's own payment status is checked as well.
        var session = (Session)stripeEvent.Data.Object;
        if (session.PaymentStatus != "paid")
        {
            return null;
        }

        return new PaymentUpdate(session.Id, PaymentStatus.Paid, ReadCustomer(session));
    }

    // The name is taken from the shipping address, not from the card: it is the name
    // the package is sent to, and the card holder may be someone else.
    private static CustomerDetails? ReadCustomer(Session session)
    {
        // Missing for sessions created before Checkout asked for a shipping address.
        var shipping = session.CollectedInformation?.ShippingDetails;
        if (shipping is null)
        {
            return null;
        }

        return new CustomerDetails(
            Name: shipping.Name,
            Email: session.CustomerDetails.Email,
            AddressLine1: shipping.Address.Line1,
            AddressLine2: shipping.Address.Line2,
            PostalCode: shipping.Address.PostalCode,
            City: shipping.Address.City,
            Country: shipping.Address.Country);
    }
}
