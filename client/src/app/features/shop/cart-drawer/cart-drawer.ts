import { CurrencyPipe } from '@angular/common';
import { Component, DOCUMENT, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/cart.service';
import { CheckoutService } from '../../../core/checkout.service';

// The cart button in the navigation and the panel it opens. The panel is a
// native <dialog>: the browser closes it on Escape, keeps the focus inside it
// while it is open and puts a backdrop behind it.
@Component({
  imports: [CurrencyPipe, RouterLink],
  selector: 'app-cart-drawer',
  styleUrl: './cart-drawer.scss',
  templateUrl: './cart-drawer.html',
  host: {
    // When the customer goes back from Stripe, the browser can show this page
    // exactly as it was left, with the button still waiting. This resets it.
    '(window:pageshow)': 'isBuying.set(false)',
  },
})
export class CartDrawer {
  protected readonly cart = inject(CartService);
  private readonly checkout = inject(CheckoutService);
  private readonly document = inject(DOCUMENT);

  // The <dialog #dialog> element in the template.
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  // True while the API creates the order, so the button cannot be clicked twice.
  protected readonly isBuying = signal(false);
  protected readonly buyFailed = signal(false);

  protected open(): void {
    this.dialog().nativeElement.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  protected async goToCheckout(): Promise<void> {
    this.isBuying.set(true);
    this.buyFailed.set(false);
    try {
      // Only ids and quantities are sent; the API takes the prices from the database.
      const items = this.cart
        .items()
        .map((item) => ({ productId: item.productId, quantity: item.quantity }));
      const url = await this.checkout.startCheckout(items);
      // Leaves the app for Stripe's payment page, so isBuying is never reset here.
      this.document.location.href = url;
    } catch {
      this.buyFailed.set(true);
      this.isBuying.set(false);
    }
  }
}
