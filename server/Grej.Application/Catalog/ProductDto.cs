namespace Grej.Application.Catalog;

// What a customer sees of a product. Stock and IsActive are left out on
// purpose; the customer only needs to know whether it is sold out.
public record ProductDto(
    int Id,
    string Title,
    string Description,
    decimal Price,
    string Currency,
    bool IsSoldOut);
