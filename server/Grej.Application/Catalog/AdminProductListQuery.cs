namespace Grej.Application.Catalog;

// The query string of GET /api/admin/products: the shop's, plus e.g. ?isActive=false for only the
// hidden products. Null = both.
public record AdminProductListQuery : ProductListQuery
{
    public bool? IsActive { get; init; }
}
