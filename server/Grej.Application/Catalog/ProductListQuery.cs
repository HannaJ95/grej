using System.ComponentModel.DataAnnotations;

namespace Grej.Application.Catalog;

// The query string of GET /api/products, e.g. ?page=2&pageSize=12.
// Filters (category, search, price) are added here in sprint 3 and 4.
public record ProductListQuery
{
    // The upper limit keeps (Page - 1) * PageSize far from int's max value.
    [Range(1, 10_000)]
    public int Page { get; init; } = 1;

    [Range(1, 48)]
    public int PageSize { get; init; } = 12;
}
