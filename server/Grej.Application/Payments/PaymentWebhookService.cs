using Grej.Application.Orders;
using Grej.Domain.Orders;
using Grej.Domain.Payments;

namespace Grej.Application.Payments;

// The source of truth for payments, never the browser (constraints.md).
public class PaymentWebhookService(IPaymentWebhookReader webhookReader, IPaymentRepository payments, OrderService orders)
{
    // Returns false if the webhook was not sent by the provider.
    public async Task<bool> HandleAsync(string payload, string signature, CancellationToken cancellationToken)
    {
        // Anyone can call the endpoint, so nothing in the request is trusted before this.
        if (!webhookReader.IsValid(payload, signature))
        {
            return false;
        }

        var update = webhookReader.Read(payload);
        if (update is null)
        {
            // An event we do not handle. 200 anyway, so Stripe does not send it again.
            return true;
        }

        // The same event may arrive twice (constraints.md). The second time nothing is done.
        if (await payments.IsEventProcessedAsync(update.EventId, cancellationToken))
        {
            return true;
        }

        var payment = await payments.GetByReferenceAsync(update.Reference, cancellationToken);
        if (payment is null)
        {
            // E.g. a session whose order was never saved (architecture.md), or a refund of a
            // payment paid before its PaymentIntent id was stored.
            return true;
        }

        Order? paidOrder = null;
        if (update.Status == PaymentStatus.Paid)
        {
            // False if already Paid, so the stock never decreases twice (constraints.md).
            if (payment.MarkAsPaid(update.ProviderPaymentId))
            {
                paidOrder = await orders.HandlePaidAsync(payment.OrderId, update.Customer, cancellationToken);
            }
        }
        else if (update.Status == PaymentStatus.Expired)
        {
            if (payment.MarkAsExpired())
            {
                await orders.HandleExpiredAsync(payment.OrderId, cancellationToken);
            }
        }
        else if (update.Status == PaymentStatus.Refunded)
        {
            // Only the payment: the admin decides about the order, and a refund never changes
            // the stock (constraints.md).
            payment.MarkAsRefunded();
        }

        // Two requests with the same event both get past the check above, but only one can save
        // the id (the primary key). The other save fails, and Stripe sends the event again.
        payments.AddProcessedEvent(update.EventId);

        // The payment, the order, the stock and the event id in one transaction.
        await payments.SaveChangesAsync(cancellationToken);

        // After the save, and MarkAsPaid lets only the first event through, so an order gets
        // at most one email.
        if (paidOrder is not null)
        {
            await orders.SendConfirmationAsync(paidOrder, cancellationToken);
        }

        return true;
    }
}
