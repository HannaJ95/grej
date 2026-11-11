using Grej.Domain.Catalog;

namespace Grej.Application.Catalog;

// The item's own size and weight, which the product page shows. Null = not given.
public record ProductSizeDto(
    decimal? LengthCm,
    decimal? WidthCm,
    decimal? HeightCm,
    decimal? DiameterCm,
    int? WeightGrams)
{
    public static ProductSizeDto From(Product product) => new(
        product.ItemLengthCm,
        product.ItemWidthCm,
        product.ItemHeightCm,
        product.ItemDiameterCm,
        product.ItemWeightGrams);
}
