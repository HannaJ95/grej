using Grej.Domain.Payments;

namespace Grej.Application.Payments;

// What the application needs from the database to update payments.
// Implemented in Infrastructure with EF Core (PaymentRepository).
public interface IPaymentRepository
{
    // Null if no payment has this reference.
    Task<Payment?> GetByReferenceAsync(string reference, CancellationToken cancellationToken);

    // Saves the changes made to payments fetched above.
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
