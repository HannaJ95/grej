// The item's own size and weight (ProductSizeDto in the API). Null = not given.
export interface ProductSize {
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  diameterCm: number | null;
  weightGrams: number | null;
}
