namespace Grej.Application.Common;

// One page of a list. Every list endpoint returns this, so no endpoint
// returns all rows of a table (constraints.md).
public record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount)
{
    // E.g. 13 products with 12 per page gives 2 pages.
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}
