namespace Grej.Application.Catalog;

// A category as the CMS's API shows it. The shop's filter uses ShopCategoryDto, with the count.
public record CategoryDto(int Id, string Name);
