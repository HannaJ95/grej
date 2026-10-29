namespace Grej.Application.Catalog;

// What the admin sees of a product in the CMS. Unlike ProductDto, it includes
// IsActive, and Stock is the real value, also below 0 (constraints.md).
public record AdminProductDto(
    int Id,
    string Title,
    string Description,
    decimal Price,
    string Currency,
    int Stock,
    bool IsActive,
    int CategoryId,
    // The ids the form ticks in its checkboxes.
    IReadOnlyList<int> MaterialIds,
    IReadOnlyList<int> ColorIds,
    ProductImageDto? Image);
