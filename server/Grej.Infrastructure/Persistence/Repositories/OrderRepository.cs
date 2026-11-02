using Grej.Application.Common;
using Grej.Application.Orders;
using Grej.Domain.Orders;
using Grej.Domain.Payments;
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
        // Include also fetches the order's rows and payment (JOINs). Without it, Items
        // would be empty and Payment null.
        db.Orders
            .Include(o => o.Items)
            .Include(o => o.Payment)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);

    // The same two SQL queries as CategoryRepository.GetPageAsync: one counts, one fetches the page.
    public async Task<PagedResult<Order>> GetPageAsync(bool all, int page, int pageSize, CancellationToken cancellationToken)
    {
        // What the admin has to do is every paid order that is not shipped: Pending ones to ship,
        // and Cancelled ones to refund (Order.NeedsRefund). Order's properties cannot become SQL,
        // so the rule is written out here. It comes oldest first, so the order that has waited
        // longest is at the top (ambiguity.md). Every order comes newest first. The id decides
        // between two orders created at the same time, so the order never changes between pages.
        // The ! only quiets the compiler: in SQL, o.Payment is a JOIN, and every order has one.
        var query = all
            ? db.Orders.OrderByDescending(o => o.CreatedAt).ThenByDescending(o => o.Id)
            : db.Orders
                .Where(o => o.Status != OrderStatus.Shipped && o.Payment!.Status == PaymentStatus.Paid)
                .OrderBy(o => o.CreatedAt)
                .ThenBy(o => o.Id);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Include(o => o.Payment)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Order>(items, page, pageSize, totalCount);
    }

    public Task<bool> ContainsProductAsync(int productId, CancellationToken cancellationToken) =>
        // Becomes SQL EXISTS: the database only answers yes or no, no rows are fetched.
        db.Orders.AnyAsync(o => o.Items.Any(i => i.ProductId == productId), cancellationToken);

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        // The same as PaymentRepository.SaveChangesAsync: an UPDATE of only the columns that
        // changed, and the products changed by ProductService are saved in the same transaction.
        await db.SaveChangesAsync(cancellationToken);
    }
}
