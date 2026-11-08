import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryService } from '../../../core/category.service';
import { ProductService } from '../../../core/product.service';
import { Button } from '../../../shared/button/button';
import { Icon } from '../../../shared/icons/icon';
import { ProductCard } from '../product-card/product-card';

const marqueeWords = ['Handgjort', 'Unikt', 'Från skapare'];

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

  // Empty until the API has answered.
  protected readonly newest = computed(() =>
    this.result.hasValue() ? this.result.value().items.slice(0, 4) : [],
  );

  // The band's words: the three words four times, so one list is wider than the screen.
  // The template shows the list twice in a row, so the band can move one list's width and
  // start over without a visible jump.
  protected readonly marqueeWords = Array(4).fill(marqueeWords).flat();

  // Only the categories that have products, sorted by name.
  protected readonly categories = inject(CategoryService).getCategories();
}
