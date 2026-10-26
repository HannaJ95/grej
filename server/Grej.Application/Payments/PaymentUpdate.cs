using Grej.Domain.Orders;
using Grej.Domain.Payments;

namespace Grej.Application.Payments;

// What a webhook from the payment provider means for us: the payment with this
// Reference (for Stripe: cs_test_…) now has this Status. EventId (for Stripe: evt_…)
// is the webhook event's own id, used to skip events that arrive twice. Customer is
// only set when the payment is Paid, since that is when the provider has collected it.
public record PaymentUpdate(string EventId, string Reference, PaymentStatus Status, CustomerDetails? Customer = null);
