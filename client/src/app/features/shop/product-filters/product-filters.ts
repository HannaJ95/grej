import { Component, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ShopCategory } from '../../../core/category';
import { Icon } from '../../../shared/icons/icon';

// The filter column next to the products on a computer (Figma: Filters and Filter panel). Only
// the Kategori group is built; material, color and price come in sprint 4. Several categories
// can be chosen ("or", ambiguity.md), and every change goes into the URL, so the list, the tabs
// and the browser's back button all follow it.
@Component({
  selector: 'app-product-filters',
  imports: [Icon],
  templateUrl: './product-filters.html',
  styleUrl: './product-filters.scss',
})
export class ProductFilters {
  private readonly router = inject(Router);

  readonly categories = input.required<ShopCategory[]>();
  // The chosen category ids, from ?kategori= in the URL.
  readonly selected = input.required<number[]>();

  // The group's list is shown until the customer folds it with the minus button.
  protected readonly categoriesOpen = signal(true);

  protected toggleCategory(id: number, checked: boolean): void {
    const selected = this.selected();
    this.showCategories(checked ? [...selected, id] : selected.filter((other) => other !== id));
  }

  protected clear(): void {
    this.showCategories([]);
  }

  // Changes ?kategori= and keeps the URL's other query parameters, except ?sida=, since the
  // new list starts on page 1. null removes a parameter. scroll: 'manual' keeps the page where
  // it is, so the customer can tick several boxes in a row.
  private showCategories(ids: number[]): void {
    this.router.navigate(['/produkter'], {
      queryParams: { kategori: ids.length > 0 ? ids : null, sida: null },
      queryParamsHandling: 'merge',
      scroll: 'manual',
    });
  }
}
