namespace Grej.Application.Payments;

// Reference: the provider's id for the session (for Stripe: cs_test_…), stored on the payment.
// Url: the provider's payment page that the customer is sent to.
public record CheckoutSession(string Reference, string Url);
