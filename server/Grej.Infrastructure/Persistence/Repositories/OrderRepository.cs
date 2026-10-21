using Grej.Application.Orders;
using Grej.Domain.Orders;

namespace Grej.Infrastructure.Persistence.Repositories;

// Saves orders in PostgreSQL with EF Core.
public class OrderRepository(GrejDbContext db) : IOrderRepository
{
    public async Task AddAsync(Order order, CancellationToken cancellationToken)
    {
        // Add also picks up the order's rows and payment, and SaveChangesAsync inserts
        // all of them in one transaction: either everything is saved or nothing is.
        db.Orders.Add(order);
        await db.SaveChangesAsync(cancellationToken);
    }
}
