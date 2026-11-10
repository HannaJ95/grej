// The values of ?sortera= in the URL.
export type ProductSort = 'nyast' | 'lagst-pris' | 'hogst-pris';

// Also the API's own order, so it is never sent or put in the URL.
export const DEFAULT_SORT: ProductSort = 'nyast';

// The text in the select and ProductSort in the API, in the order the select shows them. Record
// makes the compiler demand one entry per sort.
export const SORTS: Record<ProductSort, { label: string; api: string }> = {
  nyast: { label: 'Nyast först', api: 'newest' },
  'lagst-pris': { label: 'Lägst pris', api: 'priceAscending' },
  'hogst-pris': { label: 'Högst pris', api: 'priceDescending' },
};

// ?sortera=lagst-pris becomes 'lagst-pris'. Missing or unknown becomes the default. Object.hasOwn,
// not `in`, which would also accept inherited names such as "toString".
export function toSort(value: string | undefined): ProductSort {
  return value !== undefined && Object.hasOwn(SORTS, value) ? (value as ProductSort) : DEFAULT_SORT;
}
