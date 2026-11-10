using Grej.Domain.Catalog;

namespace Grej.Application.Catalog;

// How AdminProductService.UpdateAsync ended.
public enum UpdateProductResult
{
    Updated,
    NotFound,
    // A customer has bought the product since the admin opened the form.
    StockChanged,
    // The category, a material or a color in the request does not exist.
    ChoiceNotFound,
}

// How AdminProductService.DeleteAsync ended.
public enum DeleteProductResult
{
    Deleted,
    NotFound,
    // The product is on an order, so it can only be hidden (constraints.md).
    OnOrder,
}

// How a change to a product's images ended (AdminProductService.AddImageAsync and the others).
public enum ImageChangeStatus
{
    Changed,
    // No product, or no image of the product, has the id.
    NotFound,
    // The product already has Product.MaxImages images.
    Full,
    // The new order is not exactly the product's images.
    WrongImages,
}

// Images is the product's images after the change, in order. Empty unless it was changed.
public record ImageChangeResult(ImageChangeStatus Status, IReadOnlyList<ProductImageDto> Images)
{
    public static ImageChangeResult Changed(Product product) =>
        new(ImageChangeStatus.Changed, ProductImageDto.ListFrom(product));

    public static ImageChangeResult Failed(ImageChangeStatus status) => new(status, []);
}
