import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AdminOrderService } from '../../../core/admin-order.service';
import { toSearch } from '../../../core/product-filter';
import { LinkButton } from '../../../shared/link-button/link-button';
import { toPageNumber } from '../../../shared/page-number';
import { Pagination } from '../../../shared/pagination/pagination';
import { SearchField } from '../../../shared/search-field/search-field';
import { AdminPageHeader } from '../admin-page-header/admin-page-header';
import { ORDER_STATUS_TEXTS, PAYMENT_STATUS_TEXTS } from '../order-texts';

// ?visa=alla shows every order instead of what the admin has to do, and ?sok= searches within it.
@Component({
  selector: 'app-admin-order-list',
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    AdminPageHeader,
    LinkButton,
    Pagination,
    SearchField,
  ],
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
  private readonly router = inject(Router);

  readonly page = input(1, { alias: 'sida', transform: toPageNumber });
  // Anything but "alla", or nothing, shows the ones to handle.
  readonly all = input(false, {
    alias: 'visa',
    transform: (value: string | undefined) => value === 'alla',
  });
  readonly search = input('', { alias: 'sok', transform: toSearch });

  protected readonly result = this.orders.getOrders(this.page, this.all, this.search);
  protected readonly orderStatusTexts = ORDER_STATUS_TEXTS;
  protected readonly paymentStatusTexts = PAYMENT_STATUS_TEXTS;

  // A new search starts on page 1 and keeps the tab. scroll: 'manual' keeps the page still.
  protected showSearch(search: string): void {
    this.router.navigate(['/admin/ordrar'], {
      queryParams: { sok: search || null, sida: null },
      queryParamsHandling: 'merge',
      scroll: 'manual',
    });
  }
}
