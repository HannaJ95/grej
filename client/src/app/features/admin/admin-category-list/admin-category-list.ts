import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminCategoryService } from '../../../core/admin-category.service';
import { categoryLabel } from '../../../core/category';
import { Button } from '../../../shared/button/button';
import { toPageNumber } from '../../../shared/page-number';
import { Pagination } from '../../../shared/pagination/pagination';

// The CMS's category list, /admin/kategorier: the main categories by name, each with its
// subcategories in a list of its own below it.
@Component({
  selector: 'app-admin-category-list',
  imports: [RouterLink, Button, Pagination],
  templateUrl: './admin-category-list.html',
})
export class AdminCategoryList {
  private readonly categories = inject(AdminCategoryService);

  // The ?sida= in the URL, the same way as in AdminProductList.
  readonly page = input(1, { alias: 'sida', transform: toPageNumber });

  protected readonly result = this.categories.getCategories(this.page);

  // The page's categories as a tree with one level. A subcategory whose main category is on
  // another page (only with more than 100 categories) is shown on its own, as "Keramik › Skålar".
  protected readonly groups = computed(() => {
    const items = this.result.hasValue() ? this.result.value().items : [];
    const mainIds = new Set(items.filter((c) => c.parentId === null).map((c) => c.id));
    return items
      .filter((c) => c.parentId === null || !mainIds.has(c.parentId))
      .map((c) => ({ category: c, subcategories: items.filter((s) => s.parentId === c.id) }));
  });

  protected readonly categoryLabel = categoryLabel;
}
