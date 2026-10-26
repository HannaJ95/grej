using Grej.Domain.Payments;

namespace Grej.Application.Payments;

// What the application needs from the database to update payments.
// Implemented in Infrastructure with EF Core (PaymentRepository).
public interface IPaymentRepository
{
    // Null if no payment has this reference.
    Task<Payment?> GetByReferenceAsync(string reference, CancellationToken cancellationToken);

    // True if a webhook event with this id has already been handled.
    Task<bool> IsEventProcessedAsync(string eventId, CancellationToken cancellationToken);

    // Remembers that the event has been handled. Saved by SaveChangesAsync below,
    // in the same transaction as the payment.
    void AddProcessedEvent(string eventId);

    // Saves the changes made to payments fetched above, together with all other
    // changes in the same request (e.g. the stock), in one transaction.
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
