using Grej.Domain.Orders;
using Grej.Domain.Payments;

namespace Grej.Application.Payments;

// What a webhook from the payment provider means for us: the payment with this
// Reference now has this Status. Reference is the id the event carries (for Stripe: the
// session's cs_test_… in Checkout events, the PaymentIntent's pi_… in refund events).
// EventId (for Stripe: evt_…) is the webhook event's own id, used to skip events that
// arrive twice. Customer and ProviderPaymentId (for Stripe: pi_…) are only set when the
// payment is Paid: that is when the provider has collected the customer, and the id is
// stored then so a later refund can find the payment.
public record PaymentUpdate(
    string EventId,
    string Reference,
    PaymentStatus Status,
    CustomerDetails? Customer = null,
    string? ProviderPaymentId = null);
