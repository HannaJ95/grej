using Grej.Domain.Catalog;

namespace Grej.Application.Catalog;

public class ProductService(IProductRepository products, ICategoryRepository categories)
{
    // Null for a hidden product too, so a customer cannot tell a draft from a missing product.
    public async Task<ProductDto?> GetProductAsync(int id, CancellationToken cancellationToken)
    {
        var product = await products.GetByIdAsync(id, cancellationToken);
        if (product is null || !product.IsActive)
        {
            return null;
        }

        return ToDto(product);
    }

    // Missing and hidden products are left out, so the caller sees which ids it did not get.
    public async Task<IReadOnlyList<ProductDto>> GetProductsByIdsAsync(IReadOnlyCollection<int> ids, CancellationToken cancellationToken)
    {
        var found = await products.GetByIdsAsync(ids, cancellationToken);
        return found.Where(product => product.IsActive).Select(ToDto).ToList();
    }

    public async Task<ProductPageDto> GetProductsAsync(ProductListQuery query, CancellationToken cancellationToken)
    {
        var filter = new ProductFilter
        {
            CategoryIds = await WithSubcategoriesAsync(query.CategoryId, cancellationToken),
            MaterialIds = query.MaterialId,
            ColorIds = query.ColorId,
            MinPrice = query.MinPrice,
            MaxPrice = query.MaxPrice,
            SearchWords = query.Search?.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries) ?? [],
        };

        var page = await products.GetActivePageAsync(query.Page, query.PageSize, filter, cancellationToken);
        var highestPrice = await products.GetHighestActivePriceAsync(
            filter with { MinPrice = null, MaxPrice = null }, cancellationToken);

        return new ProductPageDto(
            page.Items.Select(ToDto).ToList(),
            page.Page,
            page.PageSize,
            page.TotalCount,
            highestPrice);
    }

    // True if the last item of one of the products was sold twice (constraints.md).
    public async Task<bool> DecreaseStockAsync(IReadOnlyCollection<ProductQuantity> items, CancellationToken cancellationToken)
    {
        var changed = await ChangeStockAsync(items, (product, quantity) => product.DecreaseStock(quantity), cancellationToken);
        return changed.Any(product => product.IsOversold);
    }

    public Task IncreaseStockAsync(IReadOnlyCollection<ProductQuantity> items, CancellationToken cancellationToken) =>
        ChangeStockAsync(items, (product, quantity) => product.IncreaseStock(quantity), cancellationToken);

    // A main category shows its subcategories' products too, unless one of its subcategories is
    // chosen: then only the chosen subcategories are shown (ambiguity.md).
    private async Task<IReadOnlyCollection<int>> WithSubcategoriesAsync(
        IReadOnlyCollection<int> chosenIds, CancellationToken cancellationToken)
    {
        if (chosenIds.Count == 0)
        {
            return chosenIds;
        }

        var subcategories = await categories.GetSubcategoriesAsync(chosenIds, cancellationToken);
        var narrowedIds = subcategories
            .Where(subcategory => chosenIds.Contains(subcategory.Id))
            .Select(subcategory => subcategory.ParentId!.Value)
            .ToHashSet();

        return
        [
            .. chosenIds.Where(id => !narrowedIds.Contains(id)),
            .. subcategories
                .Where(subcategory => !narrowedIds.Contains(subcategory.ParentId!.Value))
                .Select(subcategory => subcategory.Id),
        ];
    }

    // Hidden products are included, since a product can be hidden after it was ordered. Nothing
    // is saved here, so the caller saves the stock together with the order.
    private async Task<IReadOnlyList<Product>> ChangeStockAsync(
        IReadOnlyCollection<ProductQuantity> items,
        Action<Product, int> change,
        CancellationToken cancellationToken)
    {
        var ids = items.Select(item => item.ProductId).ToList();
        var found = await products.GetByIdsAsync(ids, cancellationToken);
        var productsById = found.ToDictionary(product => product.Id);

        foreach (var item in items)
        {
            // An ordered product is never hard deleted (constraints.md).
            change(productsById[item.ProductId], item.Quantity);
        }

        return found;
    }

    private static ProductDto ToDto(Product product) => new(
        product.Id,
        product.Title,
        product.Description,
        product.Price,
        product.Currency,
        // Only the admin sees a stock below 0. The customer only needs to know that none are left.
        Math.Max(product.Stock, 0),
        product.IsSoldOut,
        ProductImageDto.ListFrom(product),
        // The database returns them in no fixed order.
        product.Materials.Select(material => material.Name).Order().ToList(),
        product.Colors.Select(color => color.Name).Order().ToList(),
        ParcelDto.From(product));
}
