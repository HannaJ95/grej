using Grej.Application.Catalog;
using Grej.Application.Common;
using Grej.Domain.Catalog;
using Microsoft.EntityFrameworkCore;

namespace Grej.Infrastructure.Persistence.Repositories;

// Reads and saves categories in PostgreSQL with EF Core.
public class CategoryRepository(GrejDbContext db) : ICategoryRepository
{
    public Task<Category?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
        db.Categories.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

    public Task<bool> ExistsAsync(int id, CancellationToken cancellationToken) =>
        db.Categories.AnyAsync(c => c.Id == id, cancellationToken);

    // The same two SQL queries as ProductRepository.ToPageAsync: one counts, one fetches the page.
    public async Task<PagedResult<Category>> GetPageAsync(int page, int pageSize, CancellationToken cancellationToken)
    {
        var totalCount = await db.Categories.CountAsync(cancellationToken);
        var items = await db.Categories
            // By name, and then by id, so two categories with the same name keep a fixed order.
            .OrderBy(c => c.Name)
            .ThenBy(c => c.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Category>(items, page, pageSize, totalCount);
    }

    public void Add(Category category) => db.Categories.Add(category);

    public void Remove(Category category) => db.Categories.Remove(category);

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await db.SaveChangesAsync(cancellationToken);
    }
}
