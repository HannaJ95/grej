import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/cart.service';
import { Button } from '../../../shared/button/button';
import { Icon } from '../../../shared/icons/icon';

// The page Stripe sends the customer to after paying, e.g. /kassa/tack?order=GREJ-3F9A1C2B.
// It never says that the order is paid, since only the webhook knows that (constraints.md).
@Component({
  selector: 'app-success-page',
  imports: [RouterLink, Button, Icon],
  templateUrl: './success-page.html',
  styleUrl: './success-page.scss',
  // The page's width and side space (_base.scss), like the product list.
  host: { class: 'page-width' },
})
export class SuccessPage {
  // The ?order= in the URL, set by the router (withComponentInputBinding in app.config.ts).
  readonly order = input<string>();

  constructor() {
    // Stripe only sends the customer here after paying, so the cart is emptied
    // (ambiguity.md). Cancelling in Stripe goes to / instead and keeps the cart.
    inject(CartService).clear();
  }
}

