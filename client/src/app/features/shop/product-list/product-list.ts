import { CurrencyPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../core/product.service';
import { toPageNumber } from '../../../shared/page-number';
import { Pagination } from '../../../shared/pagination/pagination';

// The list of products in the shop, e.g. /produkter or /produkter?sida=2.
@Component({
  selector: 'app-product-list',
  imports: [CurrencyPipe, RouterLink, Pagination],
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
