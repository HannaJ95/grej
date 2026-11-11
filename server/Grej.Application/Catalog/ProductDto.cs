namespace Grej.Application.Catalog;

// What a customer sees of a product. IsActive is left out on purpose, and
// Stock is never below 0 here (see ProductService.ToDto).
public record ProductDto(
    int Id,
    string Title,
    string Description,
    decimal Price,
    string Currency,
    int Stock,
    bool IsSoldOut,
    // The main image first, which the lists and the cart show. Empty if the product has none.
    IReadOnlyList<ProductImageDto> Images,
    // Only the names, sorted, e.g. ["Glas", "Keramik"]. Empty if the product has none.
    IReadOnlyList<string> Materials,
    IReadOnlyList<string> Colors,
    ParcelDto Parcel,
    ProductSizeDto Size);
