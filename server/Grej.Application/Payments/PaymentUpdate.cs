using Grej.Domain.Payments;

namespace Grej.Application.Payments;

// What a webhook from the payment provider means for us: the payment with this
// Reference (for Stripe: cs_test_…) now has this Status.
public record PaymentUpdate(string Reference, PaymentStatus Status);
