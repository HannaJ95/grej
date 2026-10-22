using Grej.Application.Payments;
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

        return new PaymentUpdate(session.Id, PaymentStatus.Paid);
    }
}
