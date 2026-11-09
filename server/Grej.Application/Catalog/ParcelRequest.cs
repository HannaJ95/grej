using System.ComponentModel.DataAnnotations;

namespace Grej.Application.Catalog;

// The packed product's weight and size in the CMS form, which the shipping is calculated from.
// A missing value is 0, which gives 400, like CategoryId.
public record ParcelRequest
{
    // At most 100 kg and 3 m per side, far above any parcel to a pickup point.
    [Range(1, 100_000)]
    public int WeightGrams { get; init; }

    [Range(1, 300)]
    public int LengthCm { get; init; }

    [Range(1, 300)]
    public int WidthCm { get; init; }

    [Range(1, 300)]
    public int HeightCm { get; init; }
}
