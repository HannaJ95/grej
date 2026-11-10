using Grej.Domain.Payments;

namespace Grej.Application.Payments;

// The payment's page at its provider, e.g. Stripe's dashboard. Implemented in Infrastructure.
public interface IPaymentDashboard
{
    // Null without an id: unpaid, demo and old payments.
    string? UrlFor(Payment payment);
}
