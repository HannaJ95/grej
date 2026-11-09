import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminOrderService } from '../../../core/admin-order.service';
import { ConfirmQuestion, ConfirmService } from '../../../core/confirm.service';
import { ToastService } from '../../../core/toast.service';
import { Button } from '../../../shared/button/button';
import { Icon } from '../../../shared/icons/icon';
import { AdminPageHeader } from '../admin-page-header/admin-page-header';
import { ORDER_STATUS_TEXTS, PAYMENT_STATUS_TEXTS } from '../order-texts';

// /admin/ordrar/7: everything the admin needs to pack and send the order, and the buttons to
// mark it as shipped or cancel it.
@Component({
  selector: 'app-admin-order-details',
  imports: [CurrencyPipe, DatePipe, RouterLink, Button, Icon, AdminPageHeader],
  templateUrl: './admin-order-details.html',
  styleUrls: ['../admin-page.scss', '../admin-table.scss', './admin-order-details.scss'],
})
export class AdminOrderDetails {
  private readonly orders = inject(AdminOrderService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  readonly id = input.required<string>();

  protected readonly order = this.orders.getOrder(this.id);
  protected readonly orderStatusTexts = ORDER_STATUS_TEXTS;
  protected readonly paymentStatusTexts = PAYMENT_STATUS_TEXTS;

  // The top bar is shown while the order loads too, so the page always has its h1.
  protected readonly title = computed(() =>
    this.order.hasValue() ? `Order ${this.order.value().orderNumber}` : 'Order',
  );

  // Stops the buttons from being clicked twice.
  protected readonly changing = signal(false);
  protected readonly changeError = signal<string | undefined>(undefined);
  private readonly statusTitle = viewChild.required<ElementRef<HTMLElement>>('statusTitle');

  protected ship(): Promise<void> {
    return this.change(
      {
        title: 'Markera som skickad?',
        message: 'Ordern flyttas från Att göra. Det går inte att ångra.',
        confirmLabel: 'Markera som skickad',
        tone: 'primary',
      },
      (id) => this.orders.ship(id),
      'Ordern är markerad som skickad.',
    );
  }

  protected cancel(): Promise<void> {
    return this.change(
      {
        title: 'Avbryt ordern?',
        message: 'Produkterna läggs tillbaka i lagret. Det går inte att ångra.',
        hint: 'Är ordern betald återbetalar du kunden i Stripe efteråt.',
        confirmLabel: 'Avbryt ordern',
        cancelLabel: 'Behåll ordern',
      },
      (id) => this.orders.cancel(id),
      'Ordern är avbruten.',
    );
  }

  // Shared by the two buttons: asks first, sends the change and fetches the order again.
  private async change(
    question: ConfirmQuestion,
    send: (id: number) => Promise<void>,
    done: string,
  ) {
    if (!this.order.hasValue() || !(await this.confirm.ask(question))) {
      return;
    }
    this.changing.set(true);
    this.changeError.set(undefined);
    // The clicked button disappears when the order has changed, so the focus is moved to the
    // card's heading instead of being lost.
    this.statusTitle().nativeElement.focus();
    try {
      await send(this.order.value().id);
      this.toast.show(done);
    } catch {
      // E.g. 409 if the order was changed in another tab, or the API is down.
      this.changeError.set('Ordern kunde inte ändras just nu. Försök igen om en stund.');
    } finally {
      this.changing.set(false);
    }
    // Fetched again, so the page shows the new status and buttons, also after an error.
    this.order.reload();
  }
}
