using Grej.Domain.Catalog;

namespace Grej.Application.Catalog;

// The packed product's weight and size. The checkout calculates the shipping from it, and the
// cart shows a copy of the same calculation.
public record ParcelDto(int WeightGrams, int LengthCm, int WidthCm, int HeightCm)
{
    public static ParcelDto From(Product product) =>
        new(product.WeightGrams, product.LengthCm, product.WidthCm, product.HeightCm);
}
