namespace Grej.Application.Catalog;

// A material or a color in the shop's filter, with its number of active products.
public record ShopPropertyDto(int Id, string Name, int ProductCount);
