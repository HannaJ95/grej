import { CurrencyPipe } from '@angular/common';
import {
  Component,
  computed,
  DOCUMENT,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/cart.service';
import { CheckoutService } from '../../../core/checkout.service';
import { Button } from '../../../shared/button/button';
import { IconButton } from '../../../shared/icon-button/icon-button';
import { Icon } from '../../../shared/icons/icon';
import { QuantityStepper } from '../../../shared/quantity-stepper/quantity-stepper';

// The cart button and its panel, a native <dialog>, so the browser handles Escape, the focus
// and the backdrop.
@Component({
  imports: [CurrencyPipe, RouterLink, Button, Icon, IconButton, QuantityStepper],
  selector: 'app-cart-drawer',
  styleUrls: ['./cart-drawer.scss', '../../../shared/drawer.scss'],
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

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  // True while the API creates the order, so the button cannot be clicked twice.
  protected readonly isBuying = signal(false);
  protected readonly buyFailed = signal(false);
  // True when the API has changed the cart because some products ran out.
  protected readonly cartChanged = signal(false);

  // "Varukorg, 2 grejer", so screen readers know what the number in the square is.
  protected readonly label = computed(() => {
    const count = this.cart.count();
    return `Varukorg, ${count} ${count === 1 ? 'grej' : 'grejer'}`;
  });

  // Public, so the layout can open the cart from the phone menu too.
  open(): void {
    this.dialog().nativeElement.showModal();
  }

  // The panel covers the whole dialog, so a click on the dialog itself is on the backdrop.
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
