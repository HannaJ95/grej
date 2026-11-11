import { Component, computed, inject, input, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AdminCategoryService } from '../../../core/admin-category.service';
import { AdminProductQuery, isFiltered } from '../../../core/admin-product.service';
import { AdminPropertyService } from '../../../core/admin-property.service';
import { DEFAULT_SORT, SORTS } from '../../../core/product-sort';
import { Icon } from '../../../shared/icons/icon';
import { LinkButton } from '../../../shared/link-button/link-button';
import { SearchField } from '../../../shared/search-field/search-field';

// The search and the menus above the CMS product list. Every choice goes in the URL.
// <app-admin-product-filters [query]="query()" [hits]="hits()" />
@Component({
  selector: 'app-admin-product-filters',
  imports: [Icon, LinkButton, SearchField],
  templateUrl: './admin-product-filters.html',
  styleUrls: [
    '../admin-form.scss',
    '../../../shared/select.scss',
    '../search-info.scss',
    './admin-product-filters.scss',
  ],
})
export class AdminProductFilters {
  private readonly router = inject(Router);
  private readonly properties = inject(AdminPropertyService);

  readonly query = input.required<AdminProductQuery>();
  // E.g. "3 träffar". Empty while the list loads.
  readonly hits = input('');

  // The same request as the category pages and the menu's numbers.
  private readonly categories = inject(AdminCategoryService).loadAll();
  private readonly materials = this.properties.getProperties(signal('materials'), signal(1));
  private readonly colors = this.properties.getProperties(signal('colors'), signal(1));

  protected readonly categoryGroups = computed(() => {
    const all = this.categories.hasValue() ? this.categories.value().items : [];
    return all
      .filter((c) => c.parentId === null)
      .map((main) => ({ main, subcategories: all.filter((c) => c.parentId === main.id) }));
  });
  protected readonly materialChoices = computed(() =>
    this.materials.hasValue() ? this.materials.value().items : [],
  );
  protected readonly colorChoices = computed(() =>
    this.colors.hasValue() ? this.colors.value().items : [],
  );
  protected readonly sorts = Object.entries(SORTS).map(([value, { label }]) => ({ value, label }));

  protected readonly filtered = computed(() => isFiltered(this.query()));

  private readonly searchField = viewChild.required(SearchField);

  // A new choice starts on page 1, and the page doesn't scroll. '' and the default sort leave
  // the URL.
  protected choose(param: string, value: string): void {
    const empty = value === '' || (param === 'sortera' && value === DEFAULT_SORT);
    this.show({ [param]: empty ? null : value });
  }

  // Keeps the sort, which is not a filter.
  protected clear(): void {
    this.show({ sok: null, kategori: null, material: null, farg: null, visa: null });
    this.searchField().focus();
  }

  private show(queryParams: Record<string, string | null>): void {
    this.router.navigate(['/admin/produkter'], {
      queryParams: { ...queryParams, sida: null },
      queryParamsHandling: 'merge',
      scroll: 'manual',
    });
  }
}
