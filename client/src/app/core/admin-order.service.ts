import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Service, Signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { OrderDetails, OrderSummary } from './order';
import { PagedResult } from './paged-result';

// Reads and changes orders through the API's admin endpoints, the same way as
// AdminCategoryService. authInterceptor adds the admin's token to every request.
@Service()
export class AdminOrderService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/api/admin/orders`;

  // One page of orders. When all is false, only paid orders that are not shipped yet
  // (to ship or to refund), oldest first; when it is true, every order, newest first.
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

  // Throws on errors, e.g. 409 when the order is no longer paid and pending, or when the
  // API is down. The request has no body: the URL says everything.
  async ship(id: number): Promise<void> {
    await firstValueFrom(this.http.post(`${this.url}/${id}/ship`, null));
  }

  // The API puts the order's products back in stock. Throws like ship.
  async cancel(id: number): Promise<void> {
    await firstValueFrom(this.http.post(`${this.url}/${id}/cancel`, null));
  }
}
