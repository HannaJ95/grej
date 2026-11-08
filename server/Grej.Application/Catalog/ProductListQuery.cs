using System.ComponentModel.DataAnnotations;

namespace Grej.Application.Catalog;

// The query string of GET /api/products, e.g. ?page=2&categoryId=1&categoryId=3&minPrice=200.
public record ProductListQuery
{
    // The upper limit keeps (Page - 1) * PageSize far from int's max value.
    [Range(1, 10_000)]
    public int Page { get; init; } = 1;

    [Range(1, 48)]
    public int PageSize { get; init; } = 12;

    // Singular, since the name is what the URL repeats. The upper limit stops a URL with
    // thousands of ids. Empty = no filter.
    [MaxLength(100)]
    public int[] CategoryId { get; init; } = [];

    [MaxLength(100)]
    public int[] MaterialId { get; init; } = [];

    [MaxLength(100)]
    public int[] ColorId { get; init; } = [];

    // The same upper limit as ProductRequest.Price. Null = no limit.
    [Range(0, 999_999.99)]
    public decimal? MinPrice { get; init; }

    [Range(0, 999_999.99)]
    public decimal? MaxPrice { get; init; }
}
