using Grej.Domain.Orders;
using Grej.Domain.Payments;

namespace Grej.Application.Payments;

// What a webhook from the payment provider means for us: the payment with this
// Reference (for Stripe: cs_test_…) now has this Status. Customer is only set when
// the payment is Paid, since that is when the provider has collected it.
public record PaymentUpdate(string Reference, PaymentStatus Status, CustomerDetails? Customer = null);
