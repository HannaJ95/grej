namespace Grej.Application.Catalog;

// A category as the CMS's API shows it. ParentId and ParentName are null for a main category;
// the name lets the product form show "Keramik › Skålar". ProductCount counts hidden products
// too, and for a main category also its subcategories' products. SubcategoryCount is 0 for a
// subcategory. The shop's filter uses ShopCategoryDto.
public record CategoryDto(
    int Id,
    string Name,
    int? ParentId,
    string? ParentName,
    int ProductCount,
    int SubcategoryCount);
