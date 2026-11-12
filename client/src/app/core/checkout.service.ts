import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import { inject, Service, Signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { OrderConfirmation } from './order';

// No price, since the API always takes it from the database.
export interface CheckoutItem {
  productId: number;
  quantity: number;
}

// available is how many can be bought now: 0 if the product is sold out or hidden.
export interface UnavailableItem {
  productId: number;
  available: number;
}

// POST /api/checkout: the payment page (200), or the rows that stopped the checkout (409).
export interface CheckoutResponse {
  url: string;
}
export interface CheckoutConflict {
  unavailableItems: UnavailableItem[];
}
export type CheckoutResult = CheckoutResponse | CheckoutConflict;

@Service()
export class CheckoutService {
  private readonly http = inject(HttpClient);

  // Throws if the API answers with any other error, e.g. when it is down.
  async startCheckout(items: CheckoutItem[]): Promise<CheckoutResult> {
    try {
      return await firstValueFrom(
        this.http.post<CheckoutResponse>(`${environment.apiUrl}/api/checkout`, { items }),
      );
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 409) {
        return error.error as CheckoutConflict;
      }
      throw error;
    }
  }

  // The order behind Stripe's session id. Must be called in a field, like inject().
  getOrder(sessionId: Signal<string | undefined>) {
    return httpResource<OrderConfirmation>(() => {
      const id = sessionId();
      // Encoded, since the id comes from the URL and could be anything.
      return id ? `${environment.apiUrl}/api/checkout/${encodeURIComponent(id)}` : undefined;
    });
  }
}
