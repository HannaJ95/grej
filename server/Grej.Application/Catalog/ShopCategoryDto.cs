namespace Grej.Application.Catalog;

// A category in the shop's filter. ProductCount is the number of active products in it. A main
// category counts its subcategories' products too, since choosing it shows them all.
// Subcategories is empty for a subcategory.
public record ShopCategoryDto(
    int Id,
    string Name,
    int ProductCount,
    IReadOnlyList<ShopCategoryDto> Subcategories);
