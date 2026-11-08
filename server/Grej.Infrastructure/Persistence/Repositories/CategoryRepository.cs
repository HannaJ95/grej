using Grej.Application.Catalog;
using Grej.Application.Common;
using Grej.Domain.Catalog;
using Microsoft.EntityFrameworkCore;

namespace Grej.Infrastructure.Persistence.Repositories;

public class CategoryRepository(GrejDbContext db) : ICategoryRepository
{
    public Task<Category?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
        db.Categories.Include(c => c.Parent).FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

    public Task<bool> ExistsAsync(int id, CancellationToken cancellationToken) =>
        db.Categories.AnyAsync(c => c.Id == id, cancellationToken);

    public async Task<PagedResult<Category>> GetPageAsync(int page, int pageSize, CancellationToken cancellationToken)
    {
        var totalCount = await db.Categories.CountAsync(cancellationToken);
        var items = await db.Categories
            .Include(c => c.Parent)
            // By the main category's name and id (its own for a main category), so a subcategory
            // lands right after its main category.
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

    public Task<bool> HasSubcategoriesAsync(int id, CancellationToken cancellationToken) =>
        db.Categories.AnyAsync(c => c.ParentId == id, cancellationToken);

    public async Task<IReadOnlyList<Category>> GetSubcategoriesAsync(
        IReadOnlyCollection<int> parentIds, CancellationToken cancellationToken) =>
        await db.Categories
            .Where(c => c.ParentId != null && parentIds.Contains(c.ParentId.Value))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Category>> GetAllAsync(CancellationToken cancellationToken) =>
        await db.Categories.OrderBy(c => c.Name).ThenBy(c => c.Id).ToListAsync(cancellationToken);

    public void Add(Category category) => db.Categories.Add(category);

    public void Remove(Category category) => db.Categories.Remove(category);

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await db.SaveChangesAsync(cancellationToken);
    }
}
