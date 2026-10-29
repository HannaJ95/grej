using Grej.Application.Common;
using Grej.Domain.Catalog;

namespace Grej.Application.Catalog;

// What the application needs from the database to work with materials and colors. T is
// Material or Color, so one interface works for both, like Repository<T> in TypeScript.
// Implemented in Infrastructure with EF Core (PropertyRepository).
public interface IPropertyRepository<T> where T : ProductProperty
{
    Task<T?> GetByIdAsync(int id, CancellationToken cancellationToken);

    // Ids that do not exist are skipped. Used when a product is saved.
    Task<IReadOnlyList<T>> GetByIdsAsync(IReadOnlyCollection<int> ids, CancellationToken cancellationToken);

    // How many products, hidden or not, have it. 0 if no row has this id.
    Task<int> CountProductsAsync(int id, CancellationToken cancellationToken);

    // All of them, sorted by name.
    Task<PagedResult<T>> GetPageAsync(int page, int pageSize, CancellationToken cancellationToken);

    // Only remembered here. The INSERT or DELETE happens in SaveChangesAsync.
    void Add(T property);
    void Remove(T property);

    // Saves what was added or removed above, and the changes made to rows fetched above.
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
