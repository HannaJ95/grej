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
    bool IsSoldOut);
