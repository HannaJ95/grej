import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, effect, inject, output } from '@angular/core';
import { CartService } from '../../../core/cart.service';
import { Button } from '../../../shared/button/button';
import { IconButton } from '../../../shared/icon-button/icon-button';
import { Icon } from '../../../shared/icons/icon';

const SHOW_FOR_MS = 5000;

// Shown when a product is added. Closes by itself, with the cross or with Escape, and pauses
// while the pointer or the focus is on it, so there is time to click. It never takes the
// focus; screen readers hear it through aria-live.
@Component({
  selector: 'app-added-to-cart',
  imports: [CurrencyPipe, Button, Icon, IconButton],
  templateUrl: './added-to-cart.html',
  styleUrl: './added-to-cart.scss',
  host: {
    '(document:keydown.escape)': 'close()',
  },
})
export class AddedToCart {
  protected readonly cart = inject(CartService);

  // The layout opens the cart or goes to the checkout, since the cart lives there.
  readonly viewCart = output();
  readonly checkout = output();

  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    // Starts the timer each time something is added (lastAdded is a new object every time).
    effect(() => {
      if (this.cart.lastAdded()) {
        this.startTimer();
      }
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected startTimer(): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.close(), SHOW_FOR_MS);
  }

  protected pause(): void {
    clearTimeout(this.timer);
  }

  protected close(): void {
    clearTimeout(this.timer);
    this.cart.forgetLastAdded();
  }

  protected goToCart(): void {
    this.close();
    this.viewCart.emit();
  }

  protected goToCheckout(): void {
    this.close();
    this.checkout.emit();
  }
}
