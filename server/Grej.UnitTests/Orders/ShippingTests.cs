using Grej.Domain.Orders;

namespace Grej.UnitTests.Orders;

// The cart's copy of the rule (client/src/app/core/shipping.spec.ts) has the same examples,
// so a change to only one of them makes a test fail.
public class ShippingTests
{
    [Theory]
    // Earrings: 100 g, but the volume weighs 210 g.
    [InlineData(100, 15, 10, 5, 1, 59)]
    // Each cost includes its upper weight.
    [InlineData(1_000, 10, 10, 10, 1, 59)]
    [InlineData(1_001, 10, 10, 10, 1, 79)]
    // A bowl: light, but its volume weighs 2 625 g.
    [InlineData(800, 25, 25, 15, 1, 79)]
    // The quantity counts: two bowls weigh 5 250 g.
    [InlineData(800, 25, 25, 15, 2, 129)]
    // Heavy and small: the real weight decides.
    [InlineData(12_000, 40, 30, 20, 1, 199)]
    [InlineData(20_000, 10, 10, 10, 1, 199)]
    // Over 20 kg: 199 kr per started 20 kg.
    [InlineData(20_001, 10, 10, 10, 1, 398)]
    // A large painting: 3 kg, but its volume weighs 40 320 g.
    [InlineData(3_000, 150, 120, 8, 1, 597)]
    public void CostFor_OneRow_UsesChargeableWeight(
        int weightGrams, int lengthCm, int widthCm, int heightCm, int quantity, decimal expected)
    {
        var cost = Shipping.CostFor([new ShippingItem(weightGrams, lengthCm, widthCm, heightCm, quantity)]);

        Assert.Equal(expected, cost);
    }

    [Fact]
    public void CostFor_SeveralRows_AddsUpTheirVolumes()
    {
        // Alone, the bowl costs 79 kr and the mug 59 kr. Together their volume weighs 3 109 g.
        var bowl = new ShippingItem(800, 25, 25, 15, 1);
        var mug = new ShippingItem(400, 12, 12, 12, 1);

        Assert.Equal(129m, Shipping.CostFor([bowl, mug]));
    }
}
