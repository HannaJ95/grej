import { Params } from '@angular/router';
import { ShopCategory } from './category';

// The shop's product filter (ProductFilter in the API). "Or" within a list, "and" between them
// (ambiguity.md). An empty list or an undefined price means no filter.
export interface ProductFilter {
  categoryIds: number[];
  materialIds: number[];
  colorIds: number[];
  minPrice: number | undefined;
  maxPrice: number | undefined;
  // '' = no search. The API splits it into words.
  search: string;
}

export const NO_FILTER: ProductFilter = {
  categoryIds: [],
  materialIds: [],
  colorIds: [],
  minPrice: undefined,
  maxPrice: undefined,
  search: '',
};

// How many choices are made, e.g. for "Filter (3)". A price range and a search count as one each.
export function countChoices(filter: ProductFilter): number {
  const price = filter.minPrice !== undefined || filter.maxPrice !== undefined ? 1 : 0;
  const search = filter.search ? 1 : 0;
  return (
    filter.categoryIds.length + filter.materialIds.length + filter.colorIds.length + price + search
  );
}

// A subcategory only narrows its main category, so removing the main category removes its
// subcategories too.
export function withoutCategory(filter: ProductFilter, category: ShopCategory): ProductFilter {
  const removed = [category.id, ...category.subcategories.map((subcategory) => subcategory.id)];
  return { ...filter, categoryIds: filter.categoryIds.filter((id) => !removed.includes(id)) };
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
    sok: filter.search || null,
  };
}

// ?minpris=200 becomes 200. Missing, invalid or 0 becomes undefined, since 0 is no limit anyway.
export function toPrice(value: string | undefined): number | undefined {
  const price = Number(value);
  return Number.isInteger(price) && price >= 1 ? price : undefined;
}

// ?sok=%20skål becomes "skål". Missing becomes '', which is no search.
export function toSearch(value: string | undefined): string {
  return value?.trim() ?? '';
}
