using Grej.Application.Common;
using Grej.Application.Orders;
using Grej.Domain.Orders;
using Grej.Domain.Payments;
using Microsoft.EntityFrameworkCore;

namespace Grej.Infrastructure.Persistence.Repositories;

public class OrderRepository(GrejDbContext db) : IOrderRepository
{
    public async Task AddAsync(Order order, CancellationToken cancellationToken)
    {
        db.Orders.Add(order);
        await db.SaveChangesAsync(cancellationToken);
    }

    public Task<Order?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
        db.Orders
            .Include(o => o.Items)
            .Include(o => o.Payment)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);

    // Fast, since ProviderReference has a unique index (PaymentConfiguration).
    public Task<Order?> GetByPaymentReferenceAsync(string reference, CancellationToken cancellationToken) =>
        db.Orders
            .Include(o => o.Items)
            .Include(o => o.Payment)
            .FirstOrDefaultAsync(o => o.Payment!.ProviderReference == reference, cancellationToken);

    public async Task<PagedResult<Order>> GetPageAsync(
        bool all, IReadOnlyCollection<string> searchWords, int page, int pageSize, CancellationToken cancellationToken)
    {
        IQueryable<Order> query = db.Orders;

        // Paid and not shipped (to ship or to refund), or pending and refunded (to cancel).
        // Order's NeedsRefund and NeedsCancelling cannot become SQL, so the rules are written out.
        // The ! only quiets the compiler: every order has a payment.
        if (!all)
        {
            query = query.Where(o => (o.Status != OrderStatus.Shipped && o.Payment!.Status == PaymentStatus.Paid)
                || (o.Status == OrderStatus.Pending && o.Payment!.Status == PaymentStatus.Refunded));
        }

        // One Where per word, so every word must match, like ProductRepository. The null checks
        // are for the in-memory database the tests use.
        foreach (var word in searchWords.Select(w => w.ToLowerInvariant()))
        {
            query = query.Where(o => o.OrderNumber.ToLower().Contains(word)
                || (o.CustomerName != null && o.CustomerName.ToLower().Contains(word))
                || (o.CustomerEmail != null && o.CustomerEmail.ToLower().Contains(word))
                || o.Items.Any(i => i.TitleAtPurchase.ToLower().Contains(word)));
        }

        // What waits comes oldest first, so the order that has waited longest is at the top
        // (ambiguity.md). The id decides between orders created at the same time, so the order
        // never changes between pages.
        query = all
            ? query.OrderByDescending(o => o.CreatedAt).ThenByDescending(o => o.Id)
            : query.OrderBy(o => o.CreatedAt).ThenBy(o => o.Id);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Include(o => o.Payment)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Order>(items, page, pageSize, totalCount);
    }

    public Task<bool> ContainsProductAsync(int productId, CancellationToken cancellationToken) =>
        db.Orders.AnyAsync(o => o.Items.Any(i => i.ProductId == productId), cancellationToken);

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await db.SaveChangesAsync(cancellationToken);
    }
}
