using Grej.Application.Catalog;
using Grej.Application.Common;
using Grej.Domain.Catalog;
using Microsoft.EntityFrameworkCore;

namespace Grej.Infrastructure.Persistence.Repositories;

// Reads products from PostgreSQL with EF Core.
public class ProductRepository(GrejDbContext db) : IProductRepository
{
    public Task<Product?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
        db.Products.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    public async Task<PagedResult<Product>> GetActivePageAsync(int page, int pageSize, CancellationToken cancellationToken)
    {
        // Nothing is sent to the database yet; the query is only described here.
        var active = db.Products.Where(p => p.IsActive);

        // Two SQL queries: one counts all active products, one fetches only this page.
        var totalCount = await active.CountAsync(cancellationToken);
        var items = await active
            // A fixed order is needed, otherwise PostgreSQL may return the rows in any order
            // and a product could show up on two pages. Highest id = newest.
            .OrderByDescending(p => p.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Product>(items, page, pageSize, totalCount);
    }
}
