using Grej.Application.Common;
using Grej.Domain.Catalog;

namespace Grej.Application.Catalog;

// Implemented in Infrastructure with EF Core (ProductRepository).
public interface IProductRepository
{
    Task<Product?> GetByIdAsync(int id, CancellationToken cancellationToken);

    // Hidden products are included. Ids that do not exist are skipped, and the order is not fixed.
    Task<IReadOnlyList<Product>> GetByIdsAsync(IReadOnlyCollection<int> ids, CancellationToken cancellationToken);

    // Only active products that match the filter, whatever its IsActive, in the sort's order.
    Task<PagedResult<Product>> GetActivePageAsync(
        int page, int pageSize, ProductFilter filter, ProductSort sort, CancellationToken cancellationToken);

    // The highest price among the active products that match the filter. Null if none match.
    Task<decimal?> GetHighestActivePriceAsync(ProductFilter filter, CancellationToken cancellationToken);

    // For the CMS: hidden products too, unless the filter's IsActive says otherwise.
    Task<PagedResult<Product>> GetPageAsync(
        int page, int pageSize, ProductFilter filter, ProductSort sort, CancellationToken cancellationToken);

    // True if any product, hidden or not, is in the category.
    Task<bool> AnyInCategoryAsync(int categoryId, CancellationToken cancellationToken);

    // How many active products each category has, as category id → count. A category without
    // active products is missing from the dictionary.
    Task<IReadOnlyDictionary<int, int>> CountActiveByCategoryAsync(CancellationToken cancellationToken);

    // The same, but for all products, hidden ones too. For the CMS.
    Task<IReadOnlyDictionary<int, int>> CountByCategoryAsync(CancellationToken cancellationToken);

    // The INSERT or DELETE happens in SaveChangesAsync.
    void Add(Product product);
    void Remove(Product product);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
