namespace Grej.Application.Catalog;

// No IsActive, and Stock is never below 0 (ProductService.ToDto).
public record ProductDto(
    int Id,
    string Title,
    string Description,
    decimal Price,
    string Currency,
    int Stock,
    bool IsSoldOut,
    // The main image first.
    IReadOnlyList<ProductImageDto> Images,
    // Names, sorted.
    IReadOnlyList<string> Materials,
    IReadOnlyList<string> Colors,
    ParcelDto Parcel,
    ProductSizeDto Size);
