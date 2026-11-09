namespace Grej.Domain.Orders;

// One cart row as the carrier sees it: the packed product's weight and size, and how many.
public record ShippingItem(int WeightGrams, int LengthCm, int WidthCm, int HeightCm, int Quantity);

// Priced like the carriers do (ambiguity.md): by the chargeable weight, the highest of the
// real weight and the volume weight. The cart shows a copy of this rule (client/src/app/core/
// shipping.ts), so a change here must be made there too.
public static class Shipping
{
    public const string Method = "Paket till ombud";

    // PostNord's volume weight: 280 kg per m³, which is 0.28 g per cm³.
    private const decimal GramsPerCubicCentimetre = 0.28m;

    // A parcel to a pickup point may weigh at most 20 kg, so a heavier order is several parcels.
    private const decimal MaxParcelGrams = 20_000m;

    // Each cost covers up to and including its weight.
    private static readonly (decimal UpToGrams, decimal Cost)[] Rates =
    [
        (1_000m, 59m),
        (3_000m, 79m),
        (10_000m, 129m),
        (MaxParcelGrams, 199m),
    ];

    public static decimal CostFor(IEnumerable<ShippingItem> items)
    {
        var chargeable = ChargeableGrams(items);

        if (chargeable > MaxParcelGrams)
        {
            // The price of a full parcel per started 20 kg.
            return Math.Ceiling(chargeable / MaxParcelGrams) * Rates[^1].Cost;
        }

        return Rates.First(rate => chargeable <= rate.UpToGrams).Cost;
    }

    // The volumes are added up as if the products filled the box exactly, so a real box is
    // never smaller than this (architecture.md, known limitations).
    private static decimal ChargeableGrams(IEnumerable<ShippingItem> items)
    {
        decimal weight = 0;
        decimal volume = 0;

        foreach (var item in items)
        {
            weight += (decimal)item.WeightGrams * item.Quantity;
            // decimal, since a large volume times the quantity does not fit in an int.
            volume += (decimal)item.LengthCm * item.WidthCm * item.HeightCm * item.Quantity;
        }

        return Math.Max(weight, volume * GramsPerCubicCentimetre);
    }
}
