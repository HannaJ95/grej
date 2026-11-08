using Grej.Application.Common;

namespace Grej.Application.Catalog;

// One page of the shop's products. HighestPrice ignores the price filter, so the price slider
// keeps its scale while the customer drags it. Null when no product matches the other filters.
public record ProductPageDto(
    IReadOnlyList<ProductDto> Items,
    int Page,
    int PageSize,
    int TotalCount,
    decimal? HighestPrice)
    : PagedResult<ProductDto>(Items, Page, PageSize, TotalCount);
