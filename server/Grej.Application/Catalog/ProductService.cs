using Grej.Domain.Catalog;

namespace Grej.Application.Catalog;

public class ProductService(IProductRepository products, ICategoryRepository categories)
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

    // Hidden products are never included.
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

    // Called when an order is paid. Hidden products are included, since a product
    // can be hidden after it was ordered. Nothing is saved here; the caller saves.
    public Task DecreaseStockAsync(IReadOnlyCollection<ProductQuantity> items, CancellationToken cancellationToken) =>
        ChangeStockAsync(items, (product, quantity) => product.DecreaseStock(quantity), cancellationToken);

    // Called when the admin cancels a paid order. Like DecreaseStockAsync, nothing is saved here.
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

    private async Task ChangeStockAsync(
        IReadOnlyCollection<ProductQuantity> items,
        Action<Product, int> change,
        CancellationToken cancellationToken)
    {
        var ids = items.Select(item => item.ProductId).ToList();
        var found = await products.GetByIdsAsync(ids, cancellationToken);
        var productsById = found.ToDictionary(product => product.Id);

        foreach (var item in items)
        {
            // An ordered product is never hard deleted (constraints.md), so it is always found.
            change(productsById[item.ProductId], item.Quantity);
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
