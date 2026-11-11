using Grej.Domain.Catalog;

namespace Grej.Application.Catalog;

// Null = not given.
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
