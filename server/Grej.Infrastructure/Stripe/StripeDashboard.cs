using Grej.Application.Payments;
using Grej.Domain.Payments;

namespace Grej.Infrastructure.Stripe;

// Apart from StripePaymentProvider, so it needs no StripeClient and no Stripe key.
public class StripeDashboard : IPaymentDashboard
{
    // Test mode only (constraints.md).
    public string? UrlFor(Payment payment) =>
        payment.Provider == StripePaymentProvider.ProviderName && payment.ProviderPaymentId is { } id
            ? $"https://dashboard.stripe.com/test/payments/{id}"
            : null;
}
