using Grej.Domain.Catalog;

namespace Grej.Application.Catalog;

// A product's image, as both the shop and the CMS see it. StoragePath is left out, since only
// the API uses it. The CMS needs the id to remove or move the image.
public record ProductImageDto(int Id, string Url, string AltText)
{
    // In order, the main image first. Empty if the product has no image.
    public static IReadOnlyList<ProductImageDto> ListFrom(Product product) =>
        product.Images.Select(image => new ProductImageDto(image.Id, image.Url, image.AltText)).ToList();
}
