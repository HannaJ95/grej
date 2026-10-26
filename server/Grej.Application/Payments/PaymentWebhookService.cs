using Grej.Application.Orders;
using Grej.Domain.Payments;

namespace Grej.Application.Payments;

// The webhook use case: updates a payment when the provider tells us what happened.
// The webhook is the source of truth for payments, never the browser (constraints.md).
public class PaymentWebhookService(IPaymentWebhookReader webhookReader, IPaymentRepository payments, OrderService orders)
{
    // Returns false if the webhook was not sent by the provider.
    public async Task<bool> HandleAsync(string payload, string signature, CancellationToken cancellationToken)
    {
        // Anyone can call the endpoint, so nothing in the request is trusted before this check.
        if (!webhookReader.IsValid(payload, signature))
        {
            return false;
        }

        var update = webhookReader.Read(payload);
        if (update is null)
        {
            // An event we do not handle. It is still answered with 200, so Stripe does not send it again.
            return true;
        }

        // The same event may arrive twice (constraints.md), e.g. when Stripe did not get
        // our answer in time and sends it again. The second time nothing is done.
        if (await payments.IsEventProcessedAsync(update.EventId, cancellationToken))
        {
            return true;
        }

        var payment = await payments.GetByReferenceAsync(update.Reference, cancellationToken);
        if (payment is null)
        {
            // A session whose order was never saved, e.g. if the database failed
            // after Stripe answered (architecture.md). There is nothing to update.
            return true;
        }

        // Refunded is added here in sprint 3.
        if (update.Status == PaymentStatus.Paid)
        {
            // False if the payment was already Paid, so an event that arrives
            // twice never decreases the stock twice (constraints.md).
            if (payment.MarkAsPaid())
            {
                await orders.HandlePaidAsync(payment.OrderId, update.Customer, cancellationToken);
            }
        }
        else if (update.Status == PaymentStatus.Expired)
        {
            // False if the payment was already Expired. Same pattern as Paid above.
            if (payment.MarkAsExpired())
            {
                await orders.HandleExpiredAsync(payment.OrderId, cancellationToken);
            }
        }

        // If the same event is handled by two requests at the same time, both get past the
        // check above, but only one can save the event id (it is the primary key). The other
        // save fails, nothing in that request is saved, and Stripe sends the event again later.
        payments.AddProcessedEvent(update.EventId);

        // Saves the payment, the order, the stock and the event id together, in one transaction.
        await payments.SaveChangesAsync(cancellationToken);
        return true;
    }
}
