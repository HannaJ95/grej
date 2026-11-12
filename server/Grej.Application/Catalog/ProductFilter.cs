namespace Grej.Application.Catalog;

// What a product list is filtered on. "Or" within a list, "and" between them (ambiguity.md). An
// empty list or a null value means no filter, and both prices are included.
public record ProductFilter
{
    public IReadOnlyCollection<int> CategoryIds { get; init; } = [];
    public IReadOnlyCollection<int> MaterialIds { get; init; } = [];
    public IReadOnlyCollection<int> ColorIds { get; init; } = [];
    public decimal? MinPrice { get; init; }
    public decimal? MaxPrice { get; init; }

    // Every word must be somewhere in the title, in any case (ambiguity.md).
    public IReadOnlyCollection<string> SearchWords { get; init; } = [];

    // Only the CMS uses it, since the shop only ever shows active products.
    public bool? IsActive { get; init; }

    // Shared by the shop and the CMS, so a category means the same products in both.
    public static async Task<ProductFilter> FromQueryAsync(
        ProductListQuery query, ICategoryRepository categories, CancellationToken cancellationToken) =>
        new()
        {
            CategoryIds = await WithSubcategoriesAsync(query.CategoryId, categories, cancellationToken),
            MaterialIds = query.MaterialId,
            ColorIds = query.ColorId,
            MinPrice = query.MinPrice,
            MaxPrice = query.MaxPrice,
            SearchWords = query.Search?.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries) ?? [],
        };

    // A main category shows its subcategories' products too, unless one of its subcategories is
    // chosen: then only the chosen subcategories are shown (ambiguity.md).
    private static async Task<IReadOnlyCollection<int>> WithSubcategoriesAsync(
        IReadOnlyCollection<int> chosenIds, ICategoryRepository categories, CancellationToken cancellationToken)
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
}
