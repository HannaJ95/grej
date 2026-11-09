import { Parcel } from './parcel';

// A copy of the rule in the API (Shipping.cs), only to show the shipping in the cart. The
// checkout calculates what the customer pays. shipping.spec.ts has the same examples as the
// API's ShippingTests, so a change to only one of them makes a test fail.

// PostNord's volume weight: 280 kg per m³, which is 0.28 g per cm³.
const GRAMS_PER_CUBIC_CENTIMETRE = 0.28;

// A parcel to a pickup point may weigh at most 20 kg, so a heavier cart is several parcels.
const MAX_PARCEL_GRAMS = 20_000;

// Each cost covers up to and including its weight.
const RATES = [
  { upToGrams: 1_000, cost: 59 },
  { upToGrams: 3_000, cost: 79 },
  { upToGrams: 10_000, cost: 129 },
  { upToGrams: MAX_PARCEL_GRAMS, cost: 199 },
];

export function shippingCost(rows: { parcel: Parcel; quantity: number }[]): number {
  let weight = 0;
  let volume = 0;
  for (const { parcel, quantity } of rows) {
    weight += parcel.weightGrams * quantity;
    volume += parcel.lengthCm * parcel.widthCm * parcel.heightCm * quantity;
  }
  const chargeable = Math.max(weight, volume * GRAMS_PER_CUBIC_CENTIMETRE);

  if (chargeable > MAX_PARCEL_GRAMS) {
    // The price of a full parcel per started 20 kg.
    return Math.ceil(chargeable / MAX_PARCEL_GRAMS) * RATES[RATES.length - 1].cost;
  }
  return RATES.find((rate) => chargeable <= rate.upToGrams)!.cost;
}
