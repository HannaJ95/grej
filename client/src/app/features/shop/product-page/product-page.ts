import { CurrencyPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { ProductService } from '../../../core/product.service';

// The page for one product, e.g. /produkter/1.
@Component({
  selector: 'app-product-page',
  imports: [CurrencyPipe],
  templateUrl: './product-page.html',
  styleUrl: './product-page.scss',
})
export class ProductPage {
  private readonly products = inject(ProductService);

  // The :id from the URL, set by the router (withComponentInputBinding in app.config.ts).
  readonly id = input.required<string>();

  protected readonly product = this.products.getProduct(this.id);
}
