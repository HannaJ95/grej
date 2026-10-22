namespace Grej.Application.Payments;

// Checks and reads webhooks from the payment provider. Implemented in
// Infrastructure (StripeWebhookReader), so the application does not depend on Stripe.
public interface IPaymentWebhookReader
{
    // True if the webhook really was sent by the provider and has not been changed.
    bool IsValid(string payload, string signature);

    // Translates a checked webhook into a PaymentUpdate. Null for events we do not handle.
    PaymentUpdate? Read(string payload);
}
