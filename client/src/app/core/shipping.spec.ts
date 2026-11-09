import { shippingCost } from './shipping';

// The same examples as ShippingTests in the API.
describe('shippingCost', () => {
  it.each([
    // Earrings: 100 g, but the volume weighs 210 g.
    [100, 15, 10, 5, 1, 59],
    // Each cost includes its upper weight.
    [1_000, 10, 10, 10, 1, 59],
    [1_001, 10, 10, 10, 1, 79],
    // A bowl: light, but its volume weighs 2 625 g.
    [800, 25, 25, 15, 1, 79],
    // The quantity counts: two bowls weigh 5 250 g.
    [800, 25, 25, 15, 2, 129],
    // Heavy and small: the real weight decides.
    [12_000, 40, 30, 20, 1, 199],
    [20_000, 10, 10, 10, 1, 199],
    // Over 20 kg: 199 kr per started 20 kg.
    [20_001, 10, 10, 10, 1, 398],
    // A large painting: 3 kg, but its volume weighs 40 320 g.
    [3_000, 150, 120, 8, 1, 597],
  ])(
    '%i g, %i × %i × %i cm, %i st costs %i kr',
    (weightGrams, lengthCm, widthCm, heightCm, quantity, expected) => {
      const parcel = { weightGrams, lengthCm, widthCm, heightCm };

      expect(shippingCost([{ parcel, quantity }])).toBe(expected);
    },
  );

  it('adds up the volumes of several rows', () => {
    // Alone, the bowl costs 79 kr and the mug 59 kr. Together their volume weighs 3 109 g.
    const bowl = { parcel: { weightGrams: 800, lengthCm: 25, widthCm: 25, heightCm: 15 }, quantity: 1 };
    const mug = { parcel: { weightGrams: 400, lengthCm: 12, widthCm: 12, heightCm: 12 }, quantity: 1 };

    expect(shippingCost([bowl, mug])).toBe(129);
  });
});
