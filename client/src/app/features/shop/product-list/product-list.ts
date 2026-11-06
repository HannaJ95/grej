import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryService } from '../../../core/category.service';
import { ProductService } from '../../../core/product.service';
import { Breadcrumb } from '../../../shared/breadcrumb/breadcrumb';
import { toIdList } from '../../../shared/id-list';
import { toPageNumber } from '../../../shared/page-number';
import { Pagination } from '../../../shared/pagination/pagination';
import { CategoryTabs } from '../category-tabs/category-tabs';
import { ProductCard } from '../product-card/product-card';
import { ProductFilters } from '../product-filters/product-filters';

// The list of products in the shop, e.g. /produkter, /produkter?sida=2 or
// /produkter?kategori=1&kategori=3 (Figma: Shop page).
@Component({
  selector: 'app-product-list',
  imports: [RouterLink, Breadcrumb, CategoryTabs, Pagination, ProductCard, ProductFilters],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList {
  private readonly products = inject(ProductService);

  // The ?sida= in the URL, set by the router (withComponentInputBinding in app.config.ts).
  // alias: the URL uses the Swedish word, the code the English one.
  readonly page = input(1, { alias: 'sida', transform: toPageNumber });

  // The chosen categories, ?kategori=1&kategori=3 in the URL. Empty = all categories.
  readonly categoryIds = input([], { alias: 'kategori', transform: toIdList });

  // Fetched here once and given to both the tabs and the filter column.
  protected readonly categories = inject(CategoryService).getCategories();

  protected readonly result = this.products.getProducts(this.page, this.categoryIds);

  // Which products this page shows, for "Visar 13–24 av 40 grejer". Null until the API has
  // answered, and when there are no products.
  protected readonly shown = computed(() => {
    if (!this.result.hasValue() || this.result.value().items.length === 0) {
      return null;
    }
    const { page, pageSize, items, totalCount } = this.result.value();
    const from = (page - 1) * pageSize + 1;
    return { from, to: from + items.length - 1, total: totalCount };
  });
}
