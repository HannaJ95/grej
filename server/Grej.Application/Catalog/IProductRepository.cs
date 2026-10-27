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

    // All products, hidden ones too, newest first. For the CMS.
    Task<PagedResult<Product>> GetPageAsync(int page, int pageSize, CancellationToken cancellationToken);

    // Only remembered here. The INSERT or DELETE happens in SaveChangesAsync.
    void Add(Product product);
    void Remove(Product product);

    // Saves the products added or removed above, and the changes made to products fetched above.
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
