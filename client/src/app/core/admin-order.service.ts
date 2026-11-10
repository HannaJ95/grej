import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Service, Signal, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { OrderDetails, OrderSummary } from './order';
import { PagedResult } from './paged-result';

// authInterceptor adds the admin's token to every request.
@Service()
export class AdminOrderService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/api/admin/orders`;

  // all = false gives what the admin has to do, oldest first; true every order, newest first.
  // The search is only sent when it is set.
  getOrders(page: Signal<number>, all: Signal<boolean>, search: Signal<string> = signal('')) {
    return httpResource<PagedResult<OrderSummary>>(() => {
      const text = search();
      return {
        url: this.url,
        params: { page: page(), all: all(), ...(text ? { search: text } : {}) },
      };
    });
  }

  getOrder(id: Signal<string>) {
    return httpResource<OrderDetails>(() => `${this.url}/${id()}`);
  }

  // Throws on errors, e.g. 409 when the order can no longer be shipped.
  async ship(id: number): Promise<void> {
    await firstValueFrom(this.http.post(`${this.url}/${id}/ship`, null));
  }

  // The API puts the order's products back in stock. Throws like ship.
  async cancel(id: number): Promise<void> {
    await firstValueFrom(this.http.post(`${this.url}/${id}/cancel`, null));
  }
}
