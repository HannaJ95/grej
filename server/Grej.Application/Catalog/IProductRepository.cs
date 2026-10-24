using Grej.Application.Common;
using Grej.Domain.Catalog;

namespace Grej.Application.Catalog;

// What the application needs from the database to work with products.
// Implemented in Infrastructure with EF Core (ProductRepository).
public interface IProductRepository
{
    Task<Product?> GetByIdAsync(int id, CancellationToken cancellationToken);

    // Hidden products are included. Ids that do not exist are skipped, and the order is not fixed.
    Task<IReadOnlyList<Product>> GetByIdsAsync(IReadOnlyCollection<int> ids, CancellationToken cancellationToken);

    // Only active products, newest first.
    Task<PagedResult<Product>> GetActivePageAsync(int page, int pageSize, CancellationToken cancellationToken);
}
