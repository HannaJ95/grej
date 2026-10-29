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

    // The products in the shop with these ids. Missing and hidden products are
    // left out, so the caller can see which ids it did not get back.
    public async Task<IReadOnlyList<ProductDto>> GetProductsByIdsAsync(IReadOnlyCollection<int> ids, CancellationToken cancellationToken)
    {
        var found = await products.GetByIdsAsync(ids, cancellationToken);
        return found.Where(product => product.IsActive).Select(ToDto).ToList();
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

    // Called when an order is paid. Hidden products are included, since a product
    // can be hidden after it was ordered. Nothing is saved here; the caller saves.
    public async Task DecreaseStockAsync(IReadOnlyCollection<ProductQuantity> items, CancellationToken cancellationToken)
    {
        var ids = items.Select(item => item.ProductId).ToList();
        var found = await products.GetByIdsAsync(ids, cancellationToken);
        var productsById = found.ToDictionary(product => product.Id);

        foreach (var item in items)
        {
            // An ordered product is never hard deleted (constraints.md), so it is always found.
            productsById[item.ProductId].DecreaseStock(item.Quantity);
        }
    }

    private static ProductDto ToDto(Product product) => new(
        product.Id,
        product.Title,
        product.Description,
        product.Price,
        product.Currency,
        // Below 0 means the last item was sold twice (constraints.md). That is for
        // the admin; the customer only needs to know that none are left.
        Math.Max(product.Stock, 0),
        product.IsSoldOut,
        ProductImageDto.From(product.MainImage),
        // Sorted here, since the database returns them in no fixed order.
        product.Materials.Select(material => material.Name).Order().ToList(),
        product.Colors.Select(color => color.Name).Order().ToList());
}
