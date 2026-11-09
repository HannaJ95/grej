import {
  countChoices,
  NO_FILTER,
  toPrice,
  toQueryParams,
  toSearch,
  withoutCategory,
} from './product-filter';

describe('product-filter', () => {
  it('turns the filter into query parameters, with null for what is not chosen', () => {
    expect(
      toQueryParams({ ...NO_FILTER, materialIds: [4, 5], maxPrice: 800, search: 'blå skål' }),
    ).toEqual({
      kategori: null,
      material: [4, 5],
      farg: null,
      minpris: null,
      maxpris: 800,
      sok: 'blå skål',
    });
    expect(toQueryParams(NO_FILTER)['sok']).toBeNull();
  });

  it('counts each id, and a price range and a search as one choice each', () => {
    expect(countChoices(NO_FILTER)).toBe(0);
    expect(countChoices({ ...NO_FILTER, categoryIds: [1, 3], minPrice: 100, maxPrice: 500 })).toBe(3);
    expect(countChoices({ ...NO_FILTER, colorIds: [2], search: 'vas' })).toBe(2);
  });

  it('reads a whole price from the URL, and treats 0 and invalid values as no limit', () => {
    expect(toPrice('200')).toBe(200);
    expect(toPrice('0')).toBeUndefined();
    expect(toPrice('12.5')).toBeUndefined();
    expect(toPrice('abc')).toBeUndefined();
    expect(toPrice(undefined)).toBeUndefined();
  });

  it('removes a main category together with its subcategories, and keeps the rest', () => {
    const keramik = {
      id: 1,
      name: 'Keramik',
      productCount: 3,
      subcategories: [{ id: 5, name: 'Skålar', productCount: 1, subcategories: [] }],
    };

    const filter = withoutCategory(
      { ...NO_FILTER, categoryIds: [1, 5, 2], colorIds: [6] },
      keramik,
    );

    expect(filter).toEqual({ ...NO_FILTER, categoryIds: [2], colorIds: [6] });
  });

  it('reads the search from the URL without the spaces around it', () => {
    expect(toSearch('  blå skål ')).toBe('blå skål');
    expect(toSearch('   ')).toBe('');
    expect(toSearch(undefined)).toBe('');
  });
});
