using Grej.Application.Common;
using Grej.Domain.Catalog;

namespace Grej.Application.Catalog;

// Use cases for products in the shop.
public class ProductService(IProductRepository products)
{
    // Returns null if the product does not exist or is hidden (IsActive = false),
    // so a customer cannot tell a draft from a product that does not exist.
    public async Task<ProductDto?> GetProductAsync(int id, CancellationToken cancellationToken)
    {
        var product = await products.GetByIdAsync(id, cancellationToken);
        if (product is null || !product.IsActive)
        {
            return null;
        }

        return ToDto(product);
    }

    // One page of the products in the shop. Hidden products are never included.
    public async Task<PagedResult<ProductDto>> GetProductsAsync(ProductListQuery query, CancellationToken cancellationToken)
    {
        var page = await products.GetActivePageAsync(query.Page, query.PageSize, cancellationToken);

        return new PagedResult<ProductDto>(
            page.Items.Select(ToDto).ToList(),
            page.Page,
            page.PageSize,
            page.TotalCount);
    }

    private static ProductDto ToDto(Product product) => new(
        product.Id,
        product.Title,
        product.Description,
        product.Price,
        product.Currency,
        product.IsSoldOut);
}
