import { CurrencyPipe } from '@angular/common';
import { Component, DOCUMENT, inject, input, signal } from '@angular/core';
import { CheckoutService } from '../../../core/checkout.service';
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
  private readonly checkout = inject(CheckoutService);
  private readonly document = inject(DOCUMENT);

  // The :id from the URL, set by the router (withComponentInputBinding in app.config.ts).
  readonly id = input.required<string>();

  protected readonly product = this.products.getProduct(this.id);

  // True while the API creates the order, so the button cannot be clicked twice.
  protected readonly isBuying = signal(false);
  protected readonly buyFailed = signal(false);

  protected async buy(productId: number): Promise<void> {
    this.isBuying.set(true);
    this.buyFailed.set(false);
    try {
      const url = await this.checkout.startCheckout([{ productId, quantity: 1 }]);
      // Leaves the app for Stripe's payment page, so isBuying is never reset here.
      this.document.location.href = url;
    } catch {
      this.buyFailed.set(true);
      this.isBuying.set(false);
    }
  }
}
