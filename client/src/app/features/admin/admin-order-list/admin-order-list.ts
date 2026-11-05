import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminOrderService } from '../../../core/admin-order.service';
import { toPageNumber } from '../../../shared/page-number';
import { Pagination } from '../../../shared/pagination/pagination';
import { ORDER_STATUS_TEXTS, PAYMENT_STATUS_TEXTS } from '../order-texts';

// The CMS's order list, /admin/ordrar. By default it shows what the admin has to do: paid
// orders that are not shipped yet (to ship or to refund) and refunded ones to cancel, oldest
// first. /admin/ordrar?visa=alla shows every order.
@Component({
  selector: 'app-admin-order-list',
  imports: [CurrencyPipe, DatePipe, RouterLink, Pagination],
  templateUrl: './admin-order-list.html',
  styles: `
    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-16);
      padding: 0;
      list-style: none;
    }

    // The filter that is shown is bold and not underlined, so it is not told apart by color only.
    a[aria-current='page'] {
      font-weight: bold;
      text-decoration: none;
    }
  `,
})
export class AdminOrderList {
  private readonly orders = inject(AdminOrderService);

  // The ?sida= in the URL, the same way as in AdminProductList.
  readonly page = input(1, { alias: 'sida', transform: toPageNumber });
  // The ?visa= in the URL. "alla" shows every order; anything else, or nothing, the ones to handle.
  readonly all = input(false, {
    alias: 'visa',
    transform: (value: string | undefined) => value === 'alla',
  });

  protected readonly result = this.orders.getOrders(this.page, this.all);
  protected readonly orderStatusTexts = ORDER_STATUS_TEXTS;
  protected readonly paymentStatusTexts = PAYMENT_STATUS_TEXTS;
}
