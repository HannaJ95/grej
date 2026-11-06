using Grej.Application.Catalog;
using Grej.Application.Common;
using Grej.Domain.Catalog;
using Microsoft.EntityFrameworkCore;

namespace Grej.Infrastructure.Persistence.Repositories;

// Reads and saves categories in PostgreSQL with EF Core.
public class CategoryRepository(GrejDbContext db) : ICategoryRepository
{
    // Include adds a JOIN, so the main category comes in the same SQL query.
    public Task<Category?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
        db.Categories.Include(c => c.Parent).FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

    public Task<bool> ExistsAsync(int id, CancellationToken cancellationToken) =>
        db.Categories.AnyAsync(c => c.Id == id, cancellationToken);

    // The same two SQL queries as ProductRepository.ToPageAsync: one counts, one fetches the page.
    public async Task<PagedResult<Category>> GetPageAsync(int page, int pageSize, CancellationToken cancellationToken)
    {
        var totalCount = await db.Categories.CountAsync(cancellationToken);
        var items = await db.Categories
            .Include(c => c.Parent)
            // Each category is sorted by its main category's name and id (its own for a main
            // category), so a subcategory lands right after its main category. The id keeps two
            // main categories with the same name apart.
            .OrderBy(c => c.Parent == null ? c.Name : c.Parent.Name)
            .ThenBy(c => c.ParentId ?? c.Id)
            // The main category first (false sorts before true), then its subcategories by name.
            .ThenBy(c => c.ParentId != null)
            .ThenBy(c => c.Name)
            .ThenBy(c => c.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Category>(items, page, pageSize, totalCount);
    }

    // EXISTS in SQL, like ProductRepository.AnyInCategoryAsync.
    public Task<bool> HasSubcategoriesAsync(int id, CancellationToken cancellationToken) =>
        db.Categories.AnyAsync(c => c.ParentId == id, cancellationToken);

    // Contains becomes "ParentId" = ANY (@ids) in PostgreSQL, like in ProductRepository.
    public async Task<IReadOnlyList<int>> GetSubcategoryIdsAsync(
        IReadOnlyCollection<int> parentIds, CancellationToken cancellationToken) =>
        await db.Categories
            .Where(c => c.ParentId != null && parentIds.Contains(c.ParentId.Value))
            .Select(c => c.Id)
            .ToListAsync(cancellationToken);

    // Sorted by name.
    public async Task<IReadOnlyList<Category>> GetAllAsync(CancellationToken cancellationToken) =>
        await db.Categories.OrderBy(c => c.Name).ThenBy(c => c.Id).ToListAsync(cancellationToken);

    public void Add(Category category) => db.Categories.Add(category);

    public void Remove(Category category) => db.Categories.Remove(category);

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await db.SaveChangesAsync(cancellationToken);
    }
}
