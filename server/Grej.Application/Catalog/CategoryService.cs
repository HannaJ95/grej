namespace Grej.Application.Catalog;

// Categories for the shop, open to everyone like ProductService. The CMS uses AdminCategoryService.
public class CategoryService(ICategoryRepository categories, IProductRepository products)
{
    // The main categories with active products, sorted by name, each with its subcategories that
    // have active products. Not paged: the filter shows them all at once, and a small shop has
    // few categories.
    public async Task<IReadOnlyList<ShopCategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken)
    {
        var all = await categories.GetAllAsync(cancellationToken);
        var counts = await products.CountActiveByCategoryAsync(cancellationToken);

        // A category without active products is left out, so the customer never picks a
        // category that shows nothing. Main category id → its subcategories, sorted like all.
        var subcategories = all
            .Where(c => c.ParentId is not null && counts.ContainsKey(c.Id))
            .ToLookup(c => c.ParentId!.Value, c => new ShopCategoryDto(c.Id, c.Name, counts[c.Id], []));

        return all
            .Where(c => c.ParentId is null)
            .Select(main =>
            {
                var subs = subcategories[main.Id].ToList();
                var count = counts.GetValueOrDefault(main.Id) + subs.Sum(s => s.ProductCount);
                return new ShopCategoryDto(main.Id, main.Name, count, subs);
            })
            .Where(main => main.ProductCount > 0)
            .ToList();
    }
}
