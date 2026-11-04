import { Component, inject, input } from '@angular/core';
import { ProductService } from '../../../core/product.service';
import { toPageNumber } from '../../../shared/page-number';
import { Pagination } from '../../../shared/pagination/pagination';
import { ProductCard } from '../product-card/product-card';

// The list of products in the shop, e.g. /produkter or /produkter?sida=2 (Figma: Shop page).
@Component({
  selector: 'app-product-list',
  imports: [Pagination, ProductCard],
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
