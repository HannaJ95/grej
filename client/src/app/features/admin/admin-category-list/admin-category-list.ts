import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminCategoryService } from '../../../core/admin-category.service';
import { Button } from '../../../shared/button/button';
import { toPageNumber } from '../../../shared/page-number';
import { Pagination } from '../../../shared/pagination/pagination';

// The CMS's category list, /admin/kategorier, sorted by name.
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
}
