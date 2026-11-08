import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopCategory } from '../../../core/category';

// A tab is marked as chosen only when its category is the only main category chosen, alone or
// narrowed by its subcategories, since the filter can choose several.
@Component({
  selector: 'app-category-tabs',
  imports: [RouterLink],
  templateUrl: './category-tabs.html',
  styleUrl: './category-tabs.scss',
})
export class CategoryTabs {
  readonly categories = input.required<ShopCategory[]>();
  // The chosen category ids, from ?kategori= in the URL.
  readonly selected = input.required<number[]>();

  // The number next to "Alla". Every product is in exactly one category, so the sum is the
  // number of products in the shop.
  protected readonly total = computed(() =>
    this.categories().reduce((sum, category) => sum + category.productCount, 0),
  );

  protected isOnlyChosen(category: ShopCategory): boolean {
    const own = [category.id, ...category.subcategories.map((subcategory) => subcategory.id)];
    const selected = this.selected();
    return selected.includes(category.id) && selected.every((id) => own.includes(id));
  }
}
