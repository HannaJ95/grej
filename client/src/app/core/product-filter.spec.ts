import { countChoices, NO_FILTER, toPrice, toQueryParams } from './product-filter';

describe('product-filter', () => {
  it('turns the filter into query parameters, with null for what is not chosen', () => {
    expect(toQueryParams({ ...NO_FILTER, materialIds: [4, 5], maxPrice: 800 })).toEqual({
      kategori: null,
      material: [4, 5],
      farg: null,
      minpris: null,
      maxpris: 800,
    });
  });

  it('counts each id, and a price range as one choice', () => {
    expect(countChoices(NO_FILTER)).toBe(0);
    expect(countChoices({ ...NO_FILTER, categoryIds: [1, 3], minPrice: 100, maxPrice: 500 })).toBe(3);
  });

  it('reads a whole price from the URL, and treats 0 and invalid values as no limit', () => {
    expect(toPrice('200')).toBe(200);
    expect(toPrice('0')).toBeUndefined();
    expect(toPrice('12.5')).toBeUndefined();
    expect(toPrice('abc')).toBeUndefined();
    expect(toPrice(undefined)).toBeUndefined();
  });
});
