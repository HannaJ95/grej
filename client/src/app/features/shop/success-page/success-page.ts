import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/cart.service';

// The page Stripe sends the customer to after paying, e.g. /kassa/tack?order=GREJ-3F9A1C2B.
// It never says that the order is paid, since only the webhook knows that (constraints.md).
@Component({
  selector: 'app-success-page',
  imports: [RouterLink],
  template: `
    <!-- h2 for now, since app.html has the page's h1 until the layout is built. -->
    <h2>Tack för din beställning!</h2>
    @if (order()) {
      <p>Ditt ordernummer är <strong>{{ order() }}</strong>.</p>
      <!-- No email is sent in this version, so the number is the only confirmation (ambiguity.md). -->
      <p>Spara numret. Du behöver det om du kontaktar oss om beställningen.</p>
    }
    <p>Din beställning håller på att bekräftas.</p>
    <p><a routerLink="/produkter">Fortsätt handla</a></p>
  `,
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

