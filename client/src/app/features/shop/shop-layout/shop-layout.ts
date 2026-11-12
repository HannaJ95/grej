import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CategoryService } from '../../../core/category.service';
import { ThemeToggle } from '../../../shared/theme-toggle/theme-toggle';
import { AddedToCart } from '../added-to-cart/added-to-cart';
import { CartDrawer } from '../cart-drawer/cart-drawer';
import { MobileMenu } from '../mobile-menu/mobile-menu';

// A longer list would push the footer's other content far down.
const FOOTER_CATEGORIES = 5;

// The header and footer around every shop page. The shop's routes are its children in
// app.routes.ts.
@Component({
  selector: 'app-shop-layout',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ThemeToggle,
    AddedToCart,
    CartDrawer,
    MobileMenu,
  ],
  templateUrl: './shop-layout.html',
  styleUrl: './shop-layout.scss',
})
export class ShopLayout {
  private readonly categories = inject(CategoryService).getCategories();

  // The biggest categories, kept in the API's name order. Empty until the API has answered.
  protected readonly footerCategories = computed(() => {
    if (!this.categories.hasValue()) {
      return [];
    }
    const all = this.categories.value();
    const biggest = new Set(
      [...all]
        .sort((a, b) => b.productCount - a.productCount)
        .slice(0, FOOTER_CATEGORIES)
        .map((category) => category.id),
    );
    return all.filter((category) => biggest.has(category.id));
  });
}
