using System.ComponentModel.DataAnnotations;

namespace Grej.Application.Catalog;

// The query string of GET /api/products, e.g. ?page=2&pageSize=12&categoryId=1&categoryId=3.
// More filters (search, price) are added here in sprint 4.
public record ProductListQuery
{
    // The upper limit keeps (Page - 1) * PageSize far from int's max value.
    [Range(1, 10_000)]
    public int Page { get; init; } = 1;

    [Range(1, 48)]
    public int PageSize { get; init; } = 12;

    // Products in any of these categories ("or", ambiguity.md). Empty = all categories.
    // Singular, since the name is what the URL repeats: ?categoryId=1&categoryId=3. The upper
    // limit stops a URL with thousands of ids.
    [MaxLength(100)]
    public int[] CategoryId { get; init; } = [];
}
