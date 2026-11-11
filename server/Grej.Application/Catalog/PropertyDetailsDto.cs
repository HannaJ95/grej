namespace Grej.Application.Catalog;

// A material or a color with how many products have it, hidden ones too. The CMS links to them,
// and warns before deleting, which removes it from them.
public record PropertyDetailsDto(int Id, string Name, int ProductCount);
