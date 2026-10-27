using Grej.Application.Catalog;
using Grej.Application.Common;
using Grej.Domain.Catalog;
using Microsoft.EntityFrameworkCore;

namespace Grej.Infrastructure.Persistence.Repositories;

// Reads and saves products in PostgreSQL with EF Core.
public class ProductRepository(GrejDbContext db) : IProductRepository
{
    public Task<Product?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
        db.Products.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    // One SQL query for all ids, instead of one query per product.
    public async Task<IReadOnlyList<Product>> GetByIdsAsync(IReadOnlyCollection<int> ids, CancellationToken cancellationToken) =>
        await db.Products.Where(p => ids.Contains(p.Id)).ToListAsync(cancellationToken);

    // Nothing is sent to the database yet; the query is only described here.
    public Task<PagedResult<Product>> GetActivePageAsync(int page, int pageSize, CancellationToken cancellationToken) =>
        ToPageAsync(db.Products.Where(p => p.IsActive), page, pageSize, cancellationToken);

    public Task<PagedResult<Product>> GetPageAsync(int page, int pageSize, CancellationToken cancellationToken) =>
        ToPageAsync(db.Products, page, pageSize, cancellationToken);

    public void Add(Product product) => db.Products.Add(product);

    public void Remove(Product product) => db.Products.Remove(product);

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        // EF Core remembers the products it read and sees which properties changed,
        // so a changed product becomes an UPDATE of only those columns.
        await db.SaveChangesAsync(cancellationToken);
    }

    // One page of the products in the query. Shared by both lists above.
    private static async Task<PagedResult<Product>> ToPageAsync(
        IQueryable<Product> query, int page, int pageSize, CancellationToken cancellationToken)
    {
        // Two SQL queries: one counts all products in the query, one fetches only this page.
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            // A fixed order is needed, otherwise PostgreSQL may return the rows in any order
            // and a product could show up on two pages. Highest id = newest.
            .OrderByDescending(p => p.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Product>(items, page, pageSize, totalCount);
    }
}
