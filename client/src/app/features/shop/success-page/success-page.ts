import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/cart.service';
import { CheckoutService } from '../../../core/checkout.service';
import { OrderConfirmation } from '../../../core/order';
import { Button } from '../../../shared/button/button';
import { Icon } from '../../../shared/icons/icon';

// The webhook usually arrives within seconds. After 30 the page stops asking.
const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 15;

// Stripe sends the customer here after paying: /kassa/tack?order=GREJ-3F9A1C2B&session=cs_…
// Only the webhook knows that the order is paid, so the page asks the API (constraints.md).
@Component({
  selector: 'app-success-page',
  imports: [CurrencyPipe, RouterLink, Button, Icon],
  templateUrl: './success-page.html',
  styleUrls: ['./success-page.scss', '../../../shared/order-sums.scss'],
  host: { class: 'page-width' },
})
export class SuccessPage {
  protected readonly steps = [
    { title: 'Skaparen packar din grej', text: 'Inom 1–2 arbetsdagar.' },
    {
      title: 'Paketet skickas med PostNord',
      text: 'Spara ordernumret om du vill fråga oss om leveransen.',
    },
    {
      title: 'Hämta ut paketet',
      text: 'Hos ditt PostNord-ombud, normalt inom 2–4 arbetsdagar.',
    },
  ];

  // From the URL (withComponentInputBinding in app.config.ts).
  readonly order = input<string>();
  readonly session = input<string>();

  private readonly placed = inject(CheckoutService).getOrder(this.session);

  // Kept when a later request fails, like ProductList's lastResult.
  protected readonly confirmation = linkedSignal<
    OrderConfirmation | undefined,
    OrderConfirmation | undefined
  >({
    source: () => (this.placed.hasValue() ? this.placed.value() : undefined),
    computation: (next, previous) => next ?? previous?.value,
  });

  protected readonly status = computed(() => {
    const confirmation = this.confirmation();
    const number = this.order() ?? confirmation?.orderNumber;
    const start = number ? `Ordernummer ${number}. ` : '';
    if (confirmation?.paymentStatus !== 'Paid') {
      return `${start}Din beställning håller på att bekräftas.`;
    }
    return confirmation.customerEmail
      ? `${start}Betalningen är klar, och en orderbekräftelse skickas till ${confirmation.customerEmail}.`
      : `${start}Betalningen är klar.`;
  });

  protected readonly productsTotal = computed(() => {
    const confirmation = this.confirmation();
    return confirmation ? confirmation.total - (confirmation.shippingCost ?? 0) : 0;
  });

  // Null fields left out, e.g. the second address line.
  protected readonly address = computed(() => {
    const c = this.confirmation();
    if (!c?.addressLine1) {
      return [];
    }
    return [c.customerName, c.addressLine1, c.addressLine2, `${c.postalCode} ${c.city}`].filter(
      (line): line is string => !!line,
    );
  });

  private retries = 0;

  constructor() {
    // Stripe only sends the customer here after paying, so the cart is emptied (ambiguity.md).
    inject(CartService).clear();

    // Each answer is a new object, so this runs again after every request.
    effect((onCleanup) => {
      if (this.confirmation()?.paymentStatus !== 'Pending' || this.retries >= MAX_RETRIES) {
        return;
      }
      const timer = setTimeout(() => {
        this.retries++;
        this.placed.reload();
      }, RETRY_DELAY_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }
}
