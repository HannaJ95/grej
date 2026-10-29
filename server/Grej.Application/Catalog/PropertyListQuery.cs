using System.ComponentModel.DataAnnotations;

namespace Grej.Application.Catalog;

// The query string of GET /api/admin/materials and /api/admin/colors, e.g. ?page=2.
// The same limits as CategoryListQuery, so the product form gets them all from the first page.
public record PropertyListQuery
{
    [Range(1, 10_000)]
    public int Page { get; init; } = 1;

    [Range(1, 100)]
    public int PageSize { get; init; } = 100;
}
