using Grej.Application.Payments;
using Grej.Domain.Payments;
using Microsoft.EntityFrameworkCore;

namespace Grej.Infrastructure.Persistence.Repositories;

// Reads and updates payments in PostgreSQL with EF Core.
public class PaymentRepository(GrejDbContext db) : IPaymentRepository
{
    public Task<Payment?> GetByReferenceAsync(string reference, CancellationToken cancellationToken) =>
        // Fast, since ProviderReference has a unique index (PaymentConfiguration).
        db.Payments.SingleOrDefaultAsync(p => p.ProviderReference == reference, cancellationToken);

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        // EF Core remembers the payment it read above and sees which properties changed,
        // so this becomes an UPDATE of only those columns.
        await db.SaveChangesAsync(cancellationToken);
    }
}
