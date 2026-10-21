using Grej.Domain.Orders;

namespace Grej.Application.Payments;

// A payment provider that the customer is sent to, e.g. Stripe Checkout.
// Implemented in Infrastructure (StripePaymentProvider), so the application
// does not depend on Stripe, and more providers can be added later.
public interface IPaymentProvider
{
    // Stored on the payment, e.g. "Stripe".
    string Name { get; }

    // Creates a payment session for the order and returns where to send the customer.
    Task<CheckoutSession> CreateCheckoutSessionAsync(Order order, CancellationToken cancellationToken);
}
