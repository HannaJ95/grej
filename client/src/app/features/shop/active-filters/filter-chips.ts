import { formatNumber } from '@angular/common';
import { ShopCategory } from '../../../core/category';
import { ProductFilter, withoutCategory } from '../../../core/product-filter';
import { ShopProperty } from '../../../core/product-property';

type IdList = 'categoryIds' | 'materialIds' | 'colorIds';

// The filter's choices, whose names the chips show.
export interface FilterOptions {
  categories: ShopCategory[];
  materials: ShopProperty[];
  colors: ShopProperty[];
}

// One chosen filter: its text, and the filter without it.
export interface FilterChip {
  key: string;
  label: string;
  without: ProductFilter;
}

// The chosen filters in the filter's order: the search, the categories, the price, the materials
// and the colors. An id that is not among the options has no name, so it gets no chip; "Rensa
// alla" still removes it.
export function filterChips(
  filter: ProductFilter,
  options: FilterOptions,
  locale: string,
): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filter.search) {
    chips.push({ key: 'search', label: `”${filter.search}”`, without: { ...filter, search: '' } });
  }

  for (const category of options.categories) {
    if (filter.categoryIds.includes(category.id)) {
      chips.push({
        key: `categoryIds-${category.id}`,
        label: category.name,
        without: withoutCategory(filter, category),
      });
    }
    chips.push(...idChips(filter, 'categoryIds', category.subcategories));
  }

  const price = priceLabel(filter, locale);
  if (price) {
    chips.push({
      key: 'price',
      label: price,
      without: { ...filter, minPrice: undefined, maxPrice: undefined },
    });
  }

  chips.push(...idChips(filter, 'materialIds', options.materials));
  chips.push(...idChips(filter, 'colorIds', options.colors));
  return chips;
}

function idChips(
  filter: ProductFilter,
  list: IdList,
  choices: { id: number; name: string }[],
): FilterChip[] {
  return choices
    .filter((choice) => filter[list].includes(choice.id))
    .map((choice) => ({
      key: `${list}-${choice.id}`,
      label: choice.name,
      without: { ...filter, [list]: filter[list].filter((id) => id !== choice.id) },
    }));
}

// "200–800 kr", "Från 200 kr" or "Max 800 kr". Null when no price is chosen.
function priceLabel({ minPrice, maxPrice }: ProductFilter, locale: string): string | null {
  const kronor = (value: number) => formatNumber(value, locale, '1.0-0');
  if (minPrice !== undefined && maxPrice !== undefined) {
    return `${kronor(minPrice)}–${kronor(maxPrice)} kr`;
  }
  if (minPrice !== undefined) {
    return `Från ${kronor(minPrice)} kr`;
  }
  if (maxPrice !== undefined) {
    return `Max ${kronor(maxPrice)} kr`;
  }
  return null;
}
