using Grej.Application.Common;
using Grej.Domain.Catalog;

namespace Grej.Application.Catalog;

// What the application needs from the database to work with categories.
// Implemented in Infrastructure with EF Core (CategoryRepository).
public interface ICategoryRepository
{
    Task<Category?> GetByIdAsync(int id, CancellationToken cancellationToken);

    // True if a category has this id. Used when a product is saved.
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);

    // All categories, sorted by name.
    Task<PagedResult<Category>> GetPageAsync(int page, int pageSize, CancellationToken cancellationToken);

    // Only remembered here. The INSERT or DELETE happens in SaveChangesAsync.
    void Add(Category category);
    void Remove(Category category);

    // Saves the categories added or removed above, and the changes made to categories fetched above.
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
