import { Component, computed, inject, input, linkedSignal, LOCALE_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryService } from '../../../core/category.service';
import { countChoices, ProductFilter, toPrice, toSearch } from '../../../core/product-filter';
import { ProductPage, ProductService } from '../../../core/product.service';
import { PropertyService } from '../../../core/property.service';
import { Breadcrumb } from '../../../shared/breadcrumb/breadcrumb';
import { IconButton } from '../../../shared/icon-button/icon-button';
import { toIdList } from '../../../shared/id-list';
import { toPageNumber } from '../../../shared/page-number';
import { Pagination } from '../../../shared/pagination/pagination';
import { ActiveFilters } from '../active-filters/active-filters';
import { filterChips } from '../active-filters/filter-chips';
import { CategoryTabs } from '../category-tabs/category-tabs';
import { FilterDrawer } from '../filter-drawer/filter-drawer';
import { ProductCard } from '../product-card/product-card';
import { ProductFilters } from '../product-filters/product-filters';

// /produkter?sida=2&kategori=1&kategori=3&material=4&farg=2&minpris=200&maxpris=800&sok=skål
@Component({
  selector: 'app-product-list',
  imports: [
    RouterLink,
    ActiveFilters,
    Breadcrumb,
    CategoryTabs,
    FilterDrawer,
    IconButton,
    Pagination,
    ProductCard,
    ProductFilters,
  ],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList {
  private readonly products = inject(ProductService);
  private readonly properties = inject(PropertyService);
  private readonly locale = inject(LOCALE_ID);

  // Set by the router from the URL (withComponentInputBinding). The aliases are the Swedish
  // names in the URL, the same as in toQueryParams.
  readonly page = input(1, { alias: 'sida', transform: toPageNumber });
  readonly categoryIds = input([], { alias: 'kategori', transform: toIdList });
  readonly materialIds = input([], { alias: 'material', transform: toIdList });
  readonly colorIds = input([], { alias: 'farg', transform: toIdList });
  readonly minPrice = input(undefined, { alias: 'minpris', transform: toPrice });
  readonly maxPrice = input(undefined, { alias: 'maxpris', transform: toPrice });
  readonly search = input('', { alias: 'sok', transform: toSearch });

  protected readonly filter = computed<ProductFilter>(() => ({
    categoryIds: this.categoryIds(),
    materialIds: this.materialIds(),
    colorIds: this.colorIds(),
    minPrice: this.minPrice(),
    maxPrice: this.maxPrice(),
    search: this.search(),
  }));

  protected readonly hasChoices = computed(() => this.choiceCount() > 0);

  // Fetched here once and given to both the tabs and the filter.
  protected readonly categories = inject(CategoryService).getCategories();
  private readonly materials = this.properties.getProperties('materials');
  private readonly colors = this.properties.getProperties('colors');

  // Empty until the API has answered, and if it fails: the filter then has fewer groups.
  protected readonly options = computed(() => ({
    categories: this.categories.hasValue() ? this.categories.value() : [],
    materials: this.materials.hasValue() ? this.materials.value() : [],
    colors: this.colors.hasValue() ? this.colors.value() : [],
  }));

  protected readonly chips = computed(() =>
    filterChips(this.filter(), this.options(), this.locale),
  );

  protected readonly hasOptions = computed(() => {
    const { categories, materials, colors } = this.options();
    return categories.length + materials.length + colors.length > 0;
  });

  protected readonly result = this.products.getProducts(this.page, this.filter);

  // The resource has no value while it reloads, so the last answer is kept until the next one
  // comes: the products, the count and the price slider stay, and the page doesn't jump.
  protected readonly lastResult = linkedSignal<ProductPage | undefined, ProductPage | undefined>({
    source: () => (this.result.hasValue() ? this.result.value() : undefined),
    computation: (next, previous) => next ?? previous?.value,
  });

  protected readonly highestPrice = computed(() => this.lastResult()?.highestPrice);
  protected readonly totalCount = computed(() => this.lastResult()?.totalCount);
  protected readonly choiceCount = computed(() => countChoices(this.filter()));

  // For "Visar 13–24 av 40 grejer" and "0 grejer hittades". Null until the API has answered, and
  // on a page after the last one.
  protected readonly shown = computed(() => {
    const result = this.lastResult();
    if (!result || (result.items.length === 0 && result.totalCount > 0)) {
      return null;
    }
    const { page, pageSize, items, totalCount } = result;
    const from = (page - 1) * pageSize + 1;
    return { from, to: from + items.length - 1, total: totalCount };
  });
}
