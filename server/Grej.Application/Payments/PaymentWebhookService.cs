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

        var payment = await payments.GetByReferenceAsync(update.Reference, cancellationToken);
        if (payment is null)
        {
            // A session whose order was never saved, e.g. if the database failed
            // after Stripe answered (architecture.md). There is nothing to update.
            return true;
        }

        // Expired and Refunded are added here in later sprint items.
        if (update.Status == PaymentStatus.Paid)
        {
            // False if the payment was already Paid, so an event that arrives
            // twice never decreases the stock twice (constraints.md).
            if (payment.MarkAsPaid())
            {
                await orders.HandlePaidAsync(payment.OrderId, update.Customer, cancellationToken);
            }
        }

        // Saves the payment, the customer details and the stock together, in one transaction.
        await payments.SaveChangesAsync(cancellationToken);
        return true;
    }
}
