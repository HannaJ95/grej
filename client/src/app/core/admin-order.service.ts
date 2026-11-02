import { httpResource } from '@angular/common/http';
import { Service, Signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { OrderDetails, OrderSummary } from './order';
import { PagedResult } from './paged-result';

// Reads orders through the API's admin endpoints, the same way as AdminCategoryService.
// authInterceptor adds the admin's token to every request. Setting an order to Shipped
// or Cancelled is added in the next sprint item.
@Service()
export class AdminOrderService {
  private readonly url = `${environment.apiUrl}/api/admin/orders`;

  // One page of orders. When all is false, only paid orders that are not shipped yet,
  // oldest first; when it is true, every order, newest first.
  getOrders(page: Signal<number>, all: Signal<boolean>) {
    return httpResource<PagedResult<OrderSummary>>(() => ({
      url: this.url,
      params: { page: page(), all: all() },
    }));
  }

  // One order with its customer and rows. Fetched again whenever the id changes.
  getOrder(id: Signal<string>) {
    return httpResource<OrderDetails>(() => `${this.url}/${id()}`);
  }
}
