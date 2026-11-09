import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminOrderService } from '../../../core/admin-order.service';
import { toPageNumber } from '../../../shared/page-number';
import { Pagination } from '../../../shared/pagination/pagination';
import { AdminPageHeader } from '../admin-page-header/admin-page-header';
import { ORDER_STATUS_TEXTS, PAYMENT_STATUS_TEXTS } from '../order-texts';

// /admin/ordrar shows what the admin has to do: paid orders that are not shipped yet (to ship
// or to refund) and refunded ones to cancel, oldest first. ?visa=alla shows every order.
@Component({
  selector: 'app-admin-order-list',
  imports: [CurrencyPipe, DatePipe, RouterLink, Pagination, AdminPageHeader],
  templateUrl: './admin-order-list.html',
  styleUrls: [
    '../admin-page.scss',
    '../admin-table.scss',
    '../../../shared/tabs.scss',
    './admin-order-list.scss',
  ],
})
export class AdminOrderList {
  private readonly orders = inject(AdminOrderService);

  readonly page = input(1, { alias: 'sida', transform: toPageNumber });
  // Anything but "alla", or nothing, shows the ones to handle.
  readonly all = input(false, {
    alias: 'visa',
    transform: (value: string | undefined) => value === 'alla',
  });

  protected readonly result = this.orders.getOrders(this.page, this.all);
  protected readonly orderStatusTexts = ORDER_STATUS_TEXTS;
  protected readonly paymentStatusTexts = PAYMENT_STATUS_TEXTS;
}
