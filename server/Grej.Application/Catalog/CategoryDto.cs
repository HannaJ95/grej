namespace Grej.Application.Catalog;

// A category as the CMS's API shows it. ParentId and ParentName are null for a main category;
// the name lets the product form show "Keramik › Skålar". The shop's filter uses ShopCategoryDto.
public record CategoryDto(int Id, string Name, int? ParentId, string? ParentName);
