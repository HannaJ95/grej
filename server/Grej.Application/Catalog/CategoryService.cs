namespace Grej.Application.Catalog;

// Categories for the shop, open to everyone like ProductService. The CMS uses AdminCategoryService.
public class CategoryService(ICategoryRepository categories, IProductRepository products)
{
    // All categories with active products, sorted by name. Not paged: the filter shows them all
    // at once, and a small shop has few categories.
    public async Task<IReadOnlyList<ShopCategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken)
    {
        var all = await categories.GetAllAsync(cancellationToken);
        var counts = await products.CountActiveByCategoryAsync(cancellationToken);

        // A category without active products is left out, so the customer never picks a
        // category that shows nothing.
        return all
            .Where(category => counts.ContainsKey(category.Id))
            .Select(category => new ShopCategoryDto(category.Id, category.Name, counts[category.Id]))
            .ToList();
    }
}
