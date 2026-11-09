// The packed product's weight and size (ParcelDto in the API), which the shipping is calculated from.
export interface Parcel {
  weightGrams: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}
