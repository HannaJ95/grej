using Grej.Application.Payments;
using Grej.Domain.Payments;

namespace Grej.Infrastructure.Stripe;

// Its own class and not part of StripePaymentProvider, since it needs no StripeClient,
// so the admin's order page works in tests and CI without a Stripe key.
public class StripeDashboard : IPaymentDashboard
{
    // "/test/", since Stripe runs in test mode only (constraints.md).
    public string? UrlFor(Payment payment) =>
        payment.Provider == StripePaymentProvider.ProviderName && payment.ProviderPaymentId is { } id
            ? $"https://dashboard.stripe.com/test/payments/{id}"
            : null;
}
