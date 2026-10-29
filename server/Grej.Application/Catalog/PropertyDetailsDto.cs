namespace Grej.Application.Catalog;

// One material or color in the CMS form. The form tells the admin about ProductCount before
// deleting, since deleting it also removes it from those products.
public record PropertyDetailsDto(int Id, string Name, int ProductCount);
