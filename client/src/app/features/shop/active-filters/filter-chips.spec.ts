import { registerLocaleData } from '@angular/common';
import localeSv from '@angular/common/locales/sv';
import { NO_FILTER } from '../../../core/product-filter';
import { filterChips } from './filter-chips';

describe('filterChips', () => {
  registerLocaleData(localeSv);

  // Keramik (1) with its subcategory Skålar (5), Textil (2), the material Lera (4) and the
  // color Blå (6).
  const options = {
    categories: [
      {
        id: 1,
        name: 'Keramik',
        productCount: 3,
        subcategories: [{ id: 5, name: 'Skålar', productCount: 1, subcategories: [] }],
      },
      { id: 2, name: 'Textil', productCount: 2, subcategories: [] },
    ],
    materials: [{ id: 4, name: 'Lera', productCount: 2 }],
    colors: [{ id: 6, name: 'Blå', productCount: 3 }],
  };

  // Swedish numbers use a no-break space between the thousands.
  function labels(filter: Partial<typeof NO_FILTER>): string[] {
    return filterChips({ ...NO_FILTER, ...filter }, options, 'sv').map((chip) =>
      chip.label.replace(/\s/g, ' '),
    );
  }

  it("names each choice in the filter's order", () => {
    expect(
      labels({
        search: 'skål',
        categoryIds: [5, 1],
        materialIds: [4],
        colorIds: [6],
        minPrice: 1500,
        maxPrice: 4500,
      }),
    ).toEqual(['”skål”', 'Keramik', 'Skålar', '1 500–4 500 kr', 'Lera', 'Blå']);
  });

  it('writes a price with one limit as Från or Max', () => {
    expect(labels({ minPrice: 200 })).toEqual(['Från 200 kr']);
    expect(labels({ maxPrice: 800 })).toEqual(['Max 800 kr']);
  });

  it('leaves out an id it has no name for', () => {
    expect(labels({ categoryIds: [99], colorIds: [6] })).toEqual(['Blå']);
  });

  it('gives each chip the filter without it, and a main category takes its subcategories along', () => {
    const filter = { ...NO_FILTER, categoryIds: [1, 5, 2], colorIds: [6], search: 'vas' };

    const [search, keramik, skalar, , bla] = filterChips(filter, options, 'sv');

    expect(search.without).toEqual({ ...filter, search: '' });
    expect(keramik.without.categoryIds).toEqual([2]);
    expect(skalar.without.categoryIds).toEqual([1, 2]);
    expect(bla.without.colorIds).toEqual([]);
  });
});
