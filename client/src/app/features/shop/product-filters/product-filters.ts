import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { ShopCategory } from '../../../core/category';
import {
  countChoices,
  NO_FILTER,
  ProductFilter,
  toQueryParams,
} from '../../../core/product-filter';
import { ShopProperty } from '../../../core/product-property';
import { LinkButton } from '../../../shared/link-button/link-button';
import { FilterGroup } from '../filter-group/filter-group';
import { FilterOption } from '../filter-option/filter-option';
import { FilterSearch } from '../filter-search/filter-search';
import { PriceLimits, PriceRange } from '../price-range/price-range';

type IdList = 'categoryIds' | 'materialIds' | 'colorIds';

// Every change goes into the URL, so the list, the tabs and the back button follow it. A group
// without choices is left out.
@Component({
  selector: 'app-product-filters',
  imports: [FilterGroup, FilterOption, FilterSearch, LinkButton, PriceRange],
  templateUrl: './product-filters.html',
  styleUrl: './product-filters.scss',
})
export class ProductFilters {
  private readonly router = inject(Router);

  readonly categories = input.required<ShopCategory[]>();
  readonly materials = input.required<ShopProperty[]>();
  readonly colors = input.required<ShopProperty[]>();
  readonly filter = input.required<ProductFilter>();
  // From the product list. Null when no product matches, undefined until the API has answered.
  readonly highestPrice = input<number | null>();

  protected readonly hasChoices = computed(() => countChoices(this.filter()) > 0);

  // The slider's end, rounded up to 100 kr so its steps land on round numbers.
  protected readonly priceLimit = computed(() => {
    const highest = this.highestPrice();
    return highest ? Math.ceil(highest / 100) * 100 : null;
  });

  protected showSearch(search: string): void {
    this.show({ ...this.filter(), search });
  }

  protected showPrices(limits: PriceLimits): void {
    this.show({ ...this.filter(), minPrice: limits.min, maxPrice: limits.max });
  }

  protected toggle(list: IdList, id: number, checked: boolean): void {
    const filter = this.filter();
    const ids = filter[list];
    this.show({ ...filter, [list]: checked ? [...ids, id] : ids.filter((other) => other !== id) });
  }

  // A subcategory only narrows its main category, so unticking the main category unticks them too.
  protected toggleCategory(category: ShopCategory, checked: boolean): void {
    const ids = this.filter().categoryIds;
    const removed = [category.id, ...category.subcategories.map((subcategory) => subcategory.id)];
    this.showCategories(
      checked ? [...ids, category.id] : ids.filter((id) => !removed.includes(id)),
    );
  }

  protected clear(): void {
    this.show(NO_FILTER);
  }

  private showCategories(categoryIds: number[]): void {
    this.show({ ...this.filter(), categoryIds });
  }

  // ?sida= is removed, since the new list starts on page 1. scroll: 'manual' keeps the page still,
  // so the customer can tick several boxes in a row.
  private show(filter: ProductFilter): void {
    this.router.navigate(['/produkter'], {
      queryParams: { ...toQueryParams(filter), sida: null },
      queryParamsHandling: 'merge',
      scroll: 'manual',
    });
  }
}
