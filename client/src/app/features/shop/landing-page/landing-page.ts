import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryService } from '../../../core/category.service';
import { ProductService } from '../../../core/product.service';
import { Button } from '../../../shared/button/button';
import { Icon } from '../../../shared/icons/icon';
import { ProductCard } from '../product-card/product-card';

// The words in the moving band, in the design's order.
const marqueeWords = ['Handgjort', 'Unikt', 'Från skapare'];

// The start page (/), built from the design in Figma: a big title, a moving band of words,
// the newest products and links to the categories.
@Component({
  selector: 'app-landing-page',
  imports: [NgOptimizedImage, RouterLink, Button, Icon, ProductCard],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
})
export class LandingPage {
  private readonly products = inject(ProductService);

  // The first page of products. The API sorts the newest first, so its first four are the
  // newest. signal(1): getProducts expects a signal, and this page never changes it.
  protected readonly result = this.products.getProducts(signal(1));

  // computed: recalculated only when result changes. Empty until the API has answered.
  protected readonly newest = computed(() =>
    this.result.hasValue() ? this.result.value().items.slice(0, 4) : [],
  );

  // The band's words: the three words four times, so one list is wider than the screen.
  // The template shows the list twice in a row, so the band can move one list's width and
  // start over without a visible jump.
  protected readonly marqueeWords = Array(4).fill(marqueeWords).flat();

  // The categories with products, sorted by name. Each link shows the product list filtered on
  // that category, like a category tab.
  protected readonly categories = inject(CategoryService).getCategories();
}
