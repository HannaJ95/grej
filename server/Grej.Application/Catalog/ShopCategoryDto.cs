namespace Grej.Application.Catalog;

// A category in the shop's filter. ProductCount is the number of active products in it, shown
// next to the name (Figma: Category tab).
public record ShopCategoryDto(int Id, string Name, int ProductCount);
