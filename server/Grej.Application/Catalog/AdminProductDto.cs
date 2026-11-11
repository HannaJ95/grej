namespace Grej.Application.Catalog;

// Unlike ProductDto: IsActive, and the real stock, also below 0 (constraints.md).
public record AdminProductDto(
    int Id,
    string Title,
    string Description,
    decimal Price,
    string Currency,
    int Stock,
    bool IsActive,
    int CategoryId,
    // Ids for the form's checkboxes, where ProductDto has the names.
    IReadOnlyList<int> MaterialIds,
    IReadOnlyList<int> ColorIds,
    IReadOnlyList<ProductImageDto> Images,
    ParcelDto Parcel,
    ProductSizeDto Size);
