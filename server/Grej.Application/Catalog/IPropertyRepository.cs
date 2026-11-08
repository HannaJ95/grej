using Grej.Application.Common;
using Grej.Domain.Catalog;

namespace Grej.Application.Catalog;

// T is Material or Color, so one interface works for both. Implemented in Infrastructure with
// EF Core (PropertyRepository).
public interface IPropertyRepository<T> where T : ProductProperty
{
    Task<T?> GetByIdAsync(int id, CancellationToken cancellationToken);

    // Ids that do not exist are skipped. Used when a product is saved.
    Task<IReadOnlyList<T>> GetByIdsAsync(IReadOnlyCollection<int> ids, CancellationToken cancellationToken);

    // How many products, hidden or not, have it. 0 if no row has this id.
    Task<int> CountProductsAsync(int id, CancellationToken cancellationToken);

    // Sorted by name.
    Task<PagedResult<T>> GetPageAsync(int page, int pageSize, CancellationToken cancellationToken);

    // Sorted by name. Not paged, since the shop's filter shows them all at once.
    Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken);

    // Id → number of active products. One without active products is missing from the dictionary.
    Task<IReadOnlyDictionary<int, int>> CountActiveProductsAsync(CancellationToken cancellationToken);

    // The INSERT or DELETE happens in SaveChangesAsync.
    void Add(T property);
    void Remove(T property);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
