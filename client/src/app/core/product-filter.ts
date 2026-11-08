import { Params } from '@angular/router';

// The shop's product filter (ProductFilter in the API). "Or" within a list, "and" between them
// (ambiguity.md). An empty list or an undefined price means no filter.
export interface ProductFilter {
  categoryIds: number[];
  materialIds: number[];
  colorIds: number[];
  minPrice: number | undefined;
  maxPrice: number | undefined;
}

export const NO_FILTER: ProductFilter = {
  categoryIds: [],
  materialIds: [],
  colorIds: [],
  minPrice: undefined,
  maxPrice: undefined,
};

// How many choices are made, e.g. for "Filter (3)". A price range counts as one.
export function countChoices(filter: ProductFilter): number {
  const price = filter.minPrice !== undefined || filter.maxPrice !== undefined ? 1 : 0;
  return filter.categoryIds.length + filter.materialIds.length + filter.colorIds.length + price;
}

// The filter as the URL's query parameters, the same names as ProductList's input aliases.
// null removes a parameter when the router merges them.
export function toQueryParams(filter: ProductFilter): Params {
  return {
    kategori: filter.categoryIds.length > 0 ? filter.categoryIds : null,
    material: filter.materialIds.length > 0 ? filter.materialIds : null,
    farg: filter.colorIds.length > 0 ? filter.colorIds : null,
    minpris: filter.minPrice ?? null,
    maxpris: filter.maxPrice ?? null,
  };
}

// ?minpris=200 becomes 200. Missing, invalid or 0 becomes undefined, since 0 is no limit anyway.
export function toPrice(value: string | undefined): number | undefined {
  const price = Number(value);
  return Number.isInteger(price) && price >= 1 ? price : undefined;
}
