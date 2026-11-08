using Grej.Application.Catalog;
using Grej.Application.Common;
using Grej.Domain.Catalog;
using Microsoft.EntityFrameworkCore;

namespace Grej.Infrastructure.Persistence.Repositories;

// db.Set<T>() is db.Materials when T is Material, and db.Colors when T is Color.
public class PropertyRepository<T>(GrejDbContext db) : IPropertyRepository<T> where T : ProductProperty
{
    public Task<T?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
        db.Set<T>().FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    public async Task<IReadOnlyList<T>> GetByIdsAsync(IReadOnlyCollection<int> ids, CancellationToken cancellationToken) =>
        await db.Set<T>().Where(p => ids.Contains(p.Id)).ToListAsync(cancellationToken);

    // A COUNT on the join table; the products themselves are never loaded.
    public Task<int> CountProductsAsync(int id, CancellationToken cancellationToken) =>
        db.Set<T>().Where(p => p.Id == id).Select(p => p.Products.Count).SingleOrDefaultAsync(cancellationToken);

    public async Task<PagedResult<T>> GetPageAsync(int page, int pageSize, CancellationToken cancellationToken)
    {
        var totalCount = await db.Set<T>().CountAsync(cancellationToken);
        var items = await SortedByName()
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<T>(items, page, pageSize, totalCount);
    }

    public async Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken) =>
        await SortedByName().ToListAsync(cancellationToken);

    // One SQL query with a COUNT per row, like CountProductsAsync.
    public async Task<IReadOnlyDictionary<int, int>> CountActiveProductsAsync(CancellationToken cancellationToken) =>
        await db.Set<T>()
            .Select(p => new { p.Id, Count = p.Products.Count(product => product.IsActive) })
            .Where(row => row.Count > 0)
            .ToDictionaryAsync(row => row.Id, row => row.Count, cancellationToken);

    public void Add(T property) => db.Set<T>().Add(property);

    public void Remove(T property) => db.Set<T>().Remove(property);

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await db.SaveChangesAsync(cancellationToken);
    }

    // Then by id, so two with the same name keep a fixed order.
    private IQueryable<T> SortedByName() => db.Set<T>().OrderBy(p => p.Name).ThenBy(p => p.Id);
}
