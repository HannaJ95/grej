import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminOrderService } from '../../../core/admin-order.service';
import { ORDER_STATUS_TEXTS, PAYMENT_STATUS_TEXTS } from '../order-texts';

// One order in the CMS, e.g. /admin/ordrar/7, with everything the admin needs to pack and
// send it. The buttons for Shipped and Cancelled are added in the next sprint item.
@Component({
  selector: 'app-admin-order-details',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './admin-order-details.html',
})
export class AdminOrderDetails {
  private readonly orders = inject(AdminOrderService);

  // The :id in the URL, set by the router, the same way as in ProductPage.
  readonly id = input.required<string>();

  protected readonly order = this.orders.getOrder(this.id);
  protected readonly orderStatusTexts = ORDER_STATUS_TEXTS;
  protected readonly paymentStatusTexts = PAYMENT_STATUS_TEXTS;
}
