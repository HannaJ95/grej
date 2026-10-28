using Grej.Domain.Catalog;

namespace Grej.Application.Catalog;

// A product's image, as both the shop and the CMS see it. StoragePath is left out,
// since only the API uses it.
public record ProductImageDto(string Url, string AltText)
{
    // Null if the product has no image.
    public static ProductImageDto? From(ProductImage? image) =>
        image is null ? null : new ProductImageDto(image.Url, image.AltText);
}
