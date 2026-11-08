using Grej.Application.Common;
using Grej.Domain.Catalog;

namespace Grej.Application.Catalog;

// Implemented in Infrastructure with EF Core (CategoryRepository).
public interface ICategoryRepository
{
    // Includes the main category, so a subcategory's DTO can show its name.
    Task<Category?> GetByIdAsync(int id, CancellationToken cancellationToken);

    // True if a category has this id. Used when a product is saved.
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);

    // All categories with their main category. Main categories are sorted by name, and each
    // one is followed by its subcategories, also sorted by name.
    Task<PagedResult<Category>> GetPageAsync(int page, int pageSize, CancellationToken cancellationToken);

    // True if any category has this one as its main category.
    Task<bool> HasSubcategoriesAsync(int id, CancellationToken cancellationToken);

    // The subcategories of these main categories, for the shop's product list.
    Task<IReadOnlyList<Category>> GetSubcategoriesAsync(IReadOnlyCollection<int> parentIds, CancellationToken cancellationToken);

    // All categories at once, sorted by name. For the shop's category filter.
    Task<IReadOnlyList<Category>> GetAllAsync(CancellationToken cancellationToken);

    // The INSERT or DELETE happens in SaveChangesAsync.
    void Add(Category category);
    void Remove(Category category);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
