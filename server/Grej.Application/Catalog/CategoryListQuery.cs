using System.ComponentModel.DataAnnotations;

namespace Grej.Application.Catalog;

// The query string of GET /api/admin/categories, e.g. ?page=2.
public record CategoryListQuery
{
    // The same upper limit as in ProductListQuery.
    [Range(1, 10_000)]
    public int Page { get; init; } = 1;

    // A small shop has few categories, so one page usually holds them all, e.g. for the
    // menu in the product form. Still paginated, since no list returns a whole table (constraints.md).
    [Range(1, 100)]
    public int PageSize { get; init; } = 100;
}
