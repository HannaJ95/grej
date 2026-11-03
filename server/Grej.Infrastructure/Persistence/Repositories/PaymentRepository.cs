using Grej.Application.Payments;
using Grej.Domain.Payments;
using Microsoft.EntityFrameworkCore;

namespace Grej.Infrastructure.Persistence.Repositories;

// Reads and updates payments in PostgreSQL with EF Core.
public class PaymentRepository(GrejDbContext db) : IPaymentRepository
{
    public Task<Payment?> GetByReferenceAsync(string reference, CancellationToken cancellationToken) =>
        // Checkout's events carry the session id (cs_…) and refund events the PaymentIntent id
        // (pi_…), so both columns are searched. Stripe's ids start differently, so one never
        // matches the other column. Fast, since both have a unique index (PaymentConfiguration).
        db.Payments.SingleOrDefaultAsync(
            p => p.ProviderReference == reference || p.ProviderPaymentId == reference, cancellationToken);

    public Task<bool> IsEventProcessedAsync(string eventId, CancellationToken cancellationToken) =>
        // Fast, since EventId is the primary key.
        db.ProcessedWebhookEvents.AnyAsync(e => e.EventId == eventId, cancellationToken);

    public void AddProcessedEvent(string eventId) =>
        // Only tracked here. The INSERT happens in SaveChangesAsync.
        db.ProcessedWebhookEvents.Add(new ProcessedWebhookEvent(eventId));

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        // EF Core remembers the payment it read above and sees which properties changed,
        // so this becomes an UPDATE of only those columns. All repositories in a request
        // share the same DbContext, so the products changed by ProductService are
        // saved here too, in the same transaction.
        await db.SaveChangesAsync(cancellationToken);
    }
}
