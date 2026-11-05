import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminOrderService } from '../../../core/admin-order.service';
import { Button } from '../../../shared/button/button';
import { ORDER_STATUS_TEXTS, PAYMENT_STATUS_TEXTS } from '../order-texts';

// One order in the CMS, e.g. /admin/ordrar/7, with everything the admin needs to pack and
// send it, and the buttons to mark it as shipped or cancel it.
@Component({
  selector: 'app-admin-order-details',
  imports: [CurrencyPipe, DatePipe, RouterLink, Button],
  templateUrl: './admin-order-details.html',
  styles: `
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-16);
    }
  `,
})
export class AdminOrderDetails {
  private readonly orders = inject(AdminOrderService);

  // The :id in the URL, set by the router, the same way as in ProductPage.
  readonly id = input.required<string>();

  protected readonly order = this.orders.getOrder(this.id);
  protected readonly orderStatusTexts = ORDER_STATUS_TEXTS;
  protected readonly paymentStatusTexts = PAYMENT_STATUS_TEXTS;

  // True while a change is being sent, so the buttons cannot be clicked twice.
  protected readonly changing = signal(false);
  // What happened to the last change, shown under the buttons.
  protected readonly message = signal<string | undefined>(undefined);
  // The <p #feedback> in the template.
  private readonly feedback = viewChild.required<ElementRef<HTMLElement>>('feedback');

  protected ship(): Promise<void> {
    return this.change(
      'Vill du markera ordern som skickad? Det går inte att ångra.',
      (id) => this.orders.ship(id),
      'Ordern är markerad som skickad.',
    );
  }

  protected cancel(): Promise<void> {
    return this.change(
      'Vill du avbryta ordern? Produkterna läggs tillbaka i lagret. Det går inte att ångra.',
      (id) => this.orders.cancel(id),
      'Ordern är avbruten.',
    );
  }

  // Shared by the two buttons: asks first, sends the change and fetches the order again.
  private async change(question: string, send: (id: number) => Promise<void>, done: string) {
    if (!this.order.hasValue() || !confirm(question)) {
      return;
    }
    this.changing.set(true);
    this.message.set(undefined);
    // The clicked button disappears when the order has changed, so the focus is moved to
    // the message instead of being lost.
    this.feedback().nativeElement.focus();
    try {
      await send(this.order.value().id);
      this.message.set(done);
    } catch {
      // E.g. 409 if the order was changed in another tab, or the API is down.
      this.message.set('Ordern kunde inte ändras just nu. Försök igen om en stund.');
    } finally {
      this.changing.set(false);
    }
    // Fetched again, so the page shows the new status and buttons, also after an error.
    this.order.reload();
  }
}
