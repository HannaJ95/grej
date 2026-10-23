import { CurrencyPipe } from '@angular/common';
import { Component, inject, input, linkedSignal } from '@angular/core';
import { CartService } from '../../../core/cart.service';
import { Product, ProductService } from '../../../core/product.service';

// The page for one product, e.g. /produkter/1.
@Component({
  selector: 'app-product-page',
  imports: [CurrencyPipe],
  templateUrl: './product-page.html',
  styleUrl: './product-page.scss',
})
export class ProductPage {
  private readonly products = inject(ProductService);
  private readonly cart = inject(CartService);

  // The :id from the URL, set by the router (withComponentInputBinding in app.config.ts).
  readonly id = input.required<string>();

  protected readonly product = this.products.getProduct(this.id);

  // True after "Lägg i varukorgen" is clicked. Becomes false again when the id
  // changes, since the router reuses this page when going to another product.
  protected readonly added = linkedSignal({ source: this.id, computation: () => false });

  protected addToCart(product: Product): void {
    this.cart.add(product);
    this.added.set(true);
  }
}
