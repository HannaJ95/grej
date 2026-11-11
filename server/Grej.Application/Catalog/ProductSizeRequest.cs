using System.ComponentModel.DataAnnotations;

namespace Grej.Application.Catalog;

// The item's own size and weight in the CMS form, shown in the shop. Every value is optional:
// the admin fills in what fits, e.g. diameter and height for a cup. [Range] lets null through.
public record ProductSizeRequest : IValidatableObject
{
    [Range(0.1, 999.9)]
    public decimal? LengthCm { get; init; }

    [Range(0.1, 999.9)]
    public decimal? WidthCm { get; init; }

    [Range(0.1, 999.9)]
    public decimal? HeightCm { get; init; }

    [Range(0.1, 999.9)]
    public decimal? DiameterCm { get; init; }

    // The same limit as the parcel.
    [Range(1, 100_000)]
    public int? WeightGrams { get; init; }

    // The database keeps one decimal and would round 2.25 without a word.
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var centimetres = new (decimal? Value, string Name)[]
        {
            (LengthCm, nameof(LengthCm)),
            (WidthCm, nameof(WidthCm)),
            (HeightCm, nameof(HeightCm)),
            (DiameterCm, nameof(DiameterCm)),
        };
        foreach (var (value, name) in centimetres)
        {
            if (value is { } cm && decimal.Round(cm, 1) != cm)
            {
                yield return new ValidationResult("At most one decimal.", [name]);
            }
        }
    }
}
