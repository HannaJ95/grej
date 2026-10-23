import { CurrencyPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../core/product.service';

// The list of products in the shop, e.g. /produkter or /produkter?sida=2.
@Component({
  selector: 'app-product-list',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList {
  private readonly products = inject(ProductService);

  // The ?sida= in the URL, set by the router (withComponentInputBinding in app.config.ts).
  // alias: the URL uses the Swedish word, the code the English one.
  readonly page = input(1, { alias: 'sida', transform: toPageNumber });

  protected readonly result = this.products.getProducts(this.page);
}

// "2" becomes 2. A missing or invalid page, e.g. ?sida=abc, becomes page 1.
function toPageNumber(value: string | undefined): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}
