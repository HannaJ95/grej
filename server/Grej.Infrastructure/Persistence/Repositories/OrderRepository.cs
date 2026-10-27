using Grej.Application.Orders;
using Grej.Domain.Orders;
using Microsoft.EntityFrameworkCore;

namespace Grej.Infrastructure.Persistence.Repositories;

// Saves and reads orders in PostgreSQL with EF Core.
public class OrderRepository(GrejDbContext db) : IOrderRepository
{
    public async Task AddAsync(Order order, CancellationToken cancellationToken)
    {
        // Add also picks up the order's rows and payment, and SaveChangesAsync inserts
        // all of them in one transaction: either everything is saved or nothing is.
        db.Orders.Add(order);
        await db.SaveChangesAsync(cancellationToken);
    }

    public Task<Order?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
        // Include also fetches the order's rows (a JOIN). Without it, Items would be empty.
        db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id, cancellationToken);

    public Task<bool> ContainsProductAsync(int productId, CancellationToken cancellationToken) =>
        // Becomes SQL EXISTS: the database only answers yes or no, no rows are fetched.
        db.Orders.AnyAsync(o => o.Items.Any(i => i.ProductId == productId), cancellationToken);
}
