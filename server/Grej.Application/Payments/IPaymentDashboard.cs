using Grej.Domain.Payments;

namespace Grej.Application.Payments;

// Where the admin finds a payment at its provider, e.g. in Stripe's dashboard. Implemented in
// Infrastructure (StripeDashboard), like IPaymentProvider, so the application does not know Stripe.
public interface IPaymentDashboard
{
    // Null when the provider has no page for it: unpaid, demo and old payments have no id.
    string? UrlFor(Payment payment);
}
