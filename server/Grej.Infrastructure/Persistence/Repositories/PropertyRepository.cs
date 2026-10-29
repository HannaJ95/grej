using Grej.Application.Catalog;
using Grej.Application.Common;
using Grej.Domain.Catalog;
using Microsoft.EntityFrameworkCore;

namespace Grej.Infrastructure.Persistence.Repositories;

// Reads and saves materials or colors in PostgreSQL with EF Core. db.Set<T>() is the same
// as db.Materials when T is Material, and db.Colors when T is Color.
public class PropertyRepository<T>(GrejDbContext db) : IPropertyRepository<T> where T : ProductProperty
{
    public Task<T?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
        db.Set<T>().FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    // One SQL query for all ids, like ProductRepository.GetByIdsAsync.
    public async Task<IReadOnlyList<T>> GetByIdsAsync(IReadOnlyCollection<int> ids, CancellationToken cancellationToken) =>
        await db.Set<T>().Where(p => ids.Contains(p.Id)).ToListAsync(cancellationToken);

    // A COUNT in SQL on the join table; the products themselves are never loaded.
    public Task<int> CountProductsAsync(int id, CancellationToken cancellationToken) =>
        db.Set<T>().Where(p => p.Id == id).Select(p => p.Products.Count).SingleOrDefaultAsync(cancellationToken);

    // The same two SQL queries as CategoryRepository.GetPageAsync.
    public async Task<PagedResult<T>> GetPageAsync(int page, int pageSize, CancellationToken cancellationToken)
    {
        var totalCount = await db.Set<T>().CountAsync(cancellationToken);
        var items = await db.Set<T>()
            // By name, and then by id, so two with the same name keep a fixed order.
            .OrderBy(p => p.Name)
            .ThenBy(p => p.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<T>(items, page, pageSize, totalCount);
    }

    public void Add(T property) => db.Set<T>().Add(property);

    public void Remove(T property) => db.Set<T>().Remove(property);

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await db.SaveChangesAsync(cancellationToken);
    }
}
