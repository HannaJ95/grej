import { CurrencyPipe } from '@angular/common';
import { Component, DOCUMENT, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/cart.service';
import { CheckoutService } from '../../../core/checkout.service';
import { Button } from '../../../shared/button/button';
import { IconButton } from '../../../shared/icon-button/icon-button';
import { Icon } from '../../../shared/icons/icon';

// The cart button in the navigation and the panel it opens (Figma: Cart drawer). The panel
// is a native <dialog>: the browser closes it on Escape, keeps the focus inside it while it
// is open and puts a backdrop behind it.
@Component({
  imports: [CurrencyPipe, RouterLink, Button, Icon, IconButton],
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
  // True when the API has changed the cart because some products ran out.
  protected readonly cartChanged = signal(false);

  // Public, so the layout can open the cart from the phone menu too.
  open(): void {
    this.dialog().nativeElement.showModal();
  }

  // A click on the dialog element itself is a click on the dark backdrop, since the panel
  // inside it covers the rest. The design closes the cart then, like the menu.
  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  // Public, so the "Tillagd i varukorgen" popup's "Till kassan" can start it too.
  async goToCheckout(): Promise<void> {
    this.isBuying.set(true);
    this.buyFailed.set(false);
    this.cartChanged.set(false);
    try {
      // Only ids and quantities are sent; the API takes the prices from the database.
      const items = this.cart
        .items()
        .map((item) => ({ productId: item.productId, quantity: item.quantity }));
      const result = await this.checkout.startCheckout(items);
      if ('unavailableItems' in result) {
        // The customer sees the changed cart before trying again (constraints.md).
        this.cart.limitTo(result.unavailableItems);
        this.cartChanged.set(true);
        this.isBuying.set(false);
        return;
      }
      // Leaves the app for Stripe's payment page, so isBuying is never reset here.
      this.document.location.href = result.url;
    } catch {
      this.buyFailed.set(true);
      this.isBuying.set(false);
    }
  }
}
